"""
Agent service for the AI study assistant.

Uses LangChain with MiniMax M2 (via OpenAI-compatible API) for tool-calling.
Supports streaming responses via async generators that yield SSE-formatted events.
"""

import json
import logging
from collections.abc import AsyncGenerator

from langchain_openai import ChatOpenAI
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage, ToolMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

from config import settings
from models.schemas import AgentChatRequest, AgentChatResponse, ToolCallInfo, SearchResult
from services.agent_tools import get_all_tools
from services.rag_pipeline import search_knowledge_base

logger = logging.getLogger(__name__)

DEFAULT_SYSTEM_PROMPT = """You are an AI study assistant for an AI Engineering cohort. You help students understand AI/ML concepts, review vocabulary, and practice for assessments.

Your capabilities:
- Search the course knowledge base for relevant information
- Look up vocabulary terms and definitions for any lesson
- Check a student's vocabulary mastery statistics
- Generate practice quiz questions
- Explain lesson structure and content

Guidelines:
- Be concise and technically accurate
- When citing information, mention the source
- If you use a tool and get results, synthesize them into a helpful response
- If you don't know something, say so rather than guessing
- Encourage active learning — suggest practice questions when appropriate"""

MAX_HISTORY_MESSAGES = 20


def _get_llm():
    """Create the MiniMax M2 LLM instance via OpenAI-compatible API."""
    return ChatOpenAI(
        model=settings.AGENT_MODEL,
        base_url="https://api.minimax.io/v1",
        api_key=settings.MINIMAX_API_KEY,
        temperature=0.7,
        streaming=True,
    )


def _build_messages(
    request: AgentChatRequest,
    system_prompt: str | None = None,
) -> list:
    """Build the message list for the agent from conversation history."""
    messages = []

    # System prompt
    prompt = system_prompt or DEFAULT_SYSTEM_PROMPT
    if request.week_slug:
        prompt += f"\n\nThe student is currently studying week: {request.week_slug}"
    messages.append(SystemMessage(content=prompt))

    # History (trim to max)
    history = request.history[-MAX_HISTORY_MESSAGES:]
    for msg in history:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        if role == "user":
            messages.append(HumanMessage(content=content))
        elif role == "assistant":
            messages.append(AIMessage(content=content))
        elif role == "tool":
            messages.append(ToolMessage(
                content=content,
                tool_call_id=msg.get("tool_call_id", ""),
            ))

    # Current message
    messages.append(HumanMessage(content=request.message))

    return messages


async def chat(request: AgentChatRequest) -> AgentChatResponse:
    """
    Non-streaming agent chat. Runs the full tool-calling loop
    and returns the final response.
    """
    llm = _get_llm()
    tools = get_all_tools()
    llm_with_tools = llm.bind_tools(tools)

    messages = _build_messages(request)
    tool_calls_info: list[ToolCallInfo] = []
    sources: list[SearchResult] = []

    # Tool-calling loop (max 5 iterations)
    for iteration in range(5):
        response = await llm_with_tools.ainvoke(messages)

        if not response.tool_calls:
            # No tool calls — we have the final response
            usage = response.usage_metadata or {}
            return AgentChatResponse(
                content=response.content or "",
                tool_calls=tool_calls_info,
                sources=sources,
                model=settings.AGENT_MODEL,
                input_tokens=usage.get("input_tokens"),
                output_tokens=usage.get("output_tokens"),
            )

        # Process tool calls
        messages.append(response)

        for tool_call in response.tool_calls:
            tool_name = tool_call["name"]
            tool_args = tool_call["args"]
            tool_id = tool_call.get("id", "")

            logger.info(
                "Agent tool call [iter=%d]: %s(%s)",
                iteration,
                tool_name,
                json.dumps(tool_args),
            )

            # Find and execute the tool
            tool_fn = next(
                (t for t in tools if t.name == tool_name), None
            )
            if tool_fn:
                try:
                    result = await tool_fn.ainvoke(tool_args)
                except Exception as e:
                    result = f"Tool error: {str(e)}"
            else:
                result = f"Unknown tool: {tool_name}"

            tool_calls_info.append(
                ToolCallInfo(
                    tool_name=tool_name,
                    arguments=tool_args,
                    result=str(result),
                )
            )

            # If it was a search, collect source info
            if tool_name == "search_course_materials" and isinstance(result, str):
                try:
                    week_slug = tool_args.get("week_slug")
                    query = tool_args.get("query", "")
                    search_results = search_knowledge_base(
                        query=query, week_slug=week_slug, top_k=3
                    )
                    sources.extend(search_results)
                except Exception:
                    pass

            messages.append(
                ToolMessage(content=str(result), tool_call_id=tool_id)
            )

    # Max iterations reached — return what we have
    return AgentChatResponse(
        content="I've reached the maximum number of tool calls. Here's what I found so far based on the tools I used.",
        tool_calls=tool_calls_info,
        sources=sources,
        model=settings.AGENT_MODEL,
    )


async def chat_stream(request: AgentChatRequest) -> AsyncGenerator[str, None]:
    """
    Streaming agent chat. Yields SSE-formatted events as the agent
    processes tool calls and generates the final response.

    Event types:
    - tool_call: Agent is calling a tool
    - tool_result: Tool returned a result
    - content: Streaming content token
    - done: Stream complete with metadata
    - error: An error occurred
    """
    try:
        llm = _get_llm()
        tools = get_all_tools()
        llm_with_tools = llm.bind_tools(tools)

        messages = _build_messages(request)
        tool_calls_info: list[dict] = []

        for iteration in range(5):
            # First, get the full response to check for tool calls
            response = await llm_with_tools.ainvoke(messages)

            if response.tool_calls:
                # Process tool calls
                messages.append(response)

                for tool_call in response.tool_calls:
                    tool_name = tool_call["name"]
                    tool_args = tool_call["args"]
                    tool_id = tool_call.get("id", "")

                    # Emit tool_call event
                    yield f"data: {json.dumps({'type': 'tool_call', 'tool_name': tool_name, 'arguments': tool_args})}\n\n"

                    # Execute tool
                    tool_fn = next(
                        (t for t in tools if t.name == tool_name), None
                    )
                    if tool_fn:
                        try:
                            result = await tool_fn.ainvoke(tool_args)
                        except Exception as e:
                            result = f"Tool error: {str(e)}"
                    else:
                        result = f"Unknown tool: {tool_name}"

                    tool_calls_info.append({
                        "tool_name": tool_name,
                        "arguments": tool_args,
                        "result": str(result),
                    })

                    # Emit tool_result event
                    yield f"data: {json.dumps({'type': 'tool_result', 'tool_name': tool_name, 'result': str(result)[:500]})}\n\n"

                    messages.append(
                        ToolMessage(content=str(result), tool_call_id=tool_id)
                    )

                continue  # Loop back for next LLM call

            # No tool calls — stream the final response
            # Re-invoke with streaming this time
            full_content = ""
            async for chunk in llm_with_tools.astream(messages):
                if chunk.content:
                    full_content += chunk.content
                    yield f"data: {json.dumps({'type': 'content', 'token': chunk.content})}\n\n"

            # If we got no streaming content, use the non-streaming response
            if not full_content and response.content:
                full_content = response.content
                yield f"data: {json.dumps({'type': 'content', 'token': full_content})}\n\n"

            usage = response.usage_metadata or {}

            # Emit done event
            yield f"data: {json.dumps({'type': 'done', 'model': settings.AGENT_MODEL, 'tool_calls': tool_calls_info, 'input_tokens': usage.get('input_tokens'), 'output_tokens': usage.get('output_tokens')})}\n\n"
            return

        # Max iterations reached
        yield f"data: {json.dumps({'type': 'content', 'token': 'I reached the maximum number of tool calls. Here is what I found based on the tools I used.'})}\n\n"
        yield f"data: {json.dumps({'type': 'done', 'model': settings.AGENT_MODEL, 'tool_calls': tool_calls_info})}\n\n"

    except Exception as e:
        logger.error("Agent stream error: %s", str(e))
        yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
