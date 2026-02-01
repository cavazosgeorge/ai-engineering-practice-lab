"""
Agent service for the AI study assistant.

Uses LangChain with MiniMax M2 (via OpenAI-compatible API) for tool-calling.
Supports streaming responses via async generators that yield SSE-formatted events.
"""

import json
import logging
import re
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
- Look up which lessons belong to a week (use get_week_lessons FIRST to discover lesson slugs)
- Look up vocabulary terms and lesson content by slug
- Check a student's vocabulary mastery statistics
- Generate practice quiz questions

Tool usage strategy:
1. When asked about a week's content, call get_week_lessons first to get the lesson slugs
2. Then use those exact slugs with get_lesson_content or get_vocabulary_terms
3. NEVER guess lesson slugs — always discover them via get_week_lessons first
4. Call search_course_materials ONCE with a good query — do NOT repeat similar searches
5. Synthesize information from tool results into a clear, helpful response

Response guidelines:
- Be concise and technically accurate
- When citing information, mention the source
- After gathering tool results, synthesize them into a single helpful response
- Do NOT repeat tool results verbatim in your response — the student can already see tool results in the UI. Instead, add context, commentary, or a brief summary
- For practice questions: present the question with your own framing, but don't copy the raw tool output word-for-word
- If you don't know something, say so rather than guessing
- Encourage active learning — suggest practice questions when appropriate
- Do NOT include <think> tags or reasoning traces in your response"""

MAX_HISTORY_MESSAGES = 20

_THINK_PATTERN = re.compile(r"<think>[\s\S]*?</think>\s*", re.DOTALL)


def _strip_think_tags(text: str) -> str:
    """Remove <think>...</think> blocks from completed text."""
    return _THINK_PATTERN.sub("", text).lstrip()


class ThinkBlockFilter:
    """Filters <think>...</think> blocks from a token stream.

    Buffers tokens while inside a think block and discards them.
    Passes through tokens outside of think blocks.
    """

    def __init__(self):
        self._buffer = ""
        self._inside_think = False

    def process(self, token: str) -> str:
        """Process a streaming token. Returns text to emit (may be empty)."""
        self._buffer += token
        output = ""

        while self._buffer:
            if self._inside_think:
                # Look for closing tag
                end_idx = self._buffer.find("</think>")
                if end_idx != -1:
                    # Skip everything up to and including </think> plus trailing whitespace
                    after = self._buffer[end_idx + 8:].lstrip()
                    self._buffer = after
                    self._inside_think = False
                else:
                    # Still inside think block, consume entire buffer
                    self._buffer = ""
                    break
            else:
                # Look for opening tag
                start_idx = self._buffer.find("<think>")
                if start_idx != -1:
                    # Emit everything before <think>
                    output += self._buffer[:start_idx]
                    self._buffer = self._buffer[start_idx + 7:]
                    self._inside_think = True
                elif "<" in self._buffer:
                    # Might be a partial "<think>" tag — hold back from the "<"
                    lt_idx = self._buffer.rfind("<")
                    tail = self._buffer[lt_idx:]
                    if len(tail) < 7 and "<think>"[:len(tail)] == tail:
                        # Partial match, buffer it
                        output += self._buffer[:lt_idx]
                        self._buffer = tail
                        break
                    else:
                        # Not a partial match, emit all
                        output += self._buffer
                        self._buffer = ""
                else:
                    output += self._buffer
                    self._buffer = ""

        return output

    def flush(self) -> str:
        """Flush any remaining buffered content."""
        if self._inside_think:
            self._buffer = ""
            return ""
        remaining = self._buffer
        self._buffer = ""
        return remaining


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

    # Tool-calling loop (max 10 iterations)
    for iteration in range(10):
        response = await llm_with_tools.ainvoke(messages)

        if not response.tool_calls:
            # No tool calls — we have the final response
            usage = response.usage_metadata or {}
            return AgentChatResponse(
                content=_strip_think_tags(response.content or ""),
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

            # Strip hidden answer sections for UI display
            display_result = str(result)
            hidden_idx = display_result.find("[HIDDEN")
            if hidden_idx != -1:
                display_result = display_result[:hidden_idx].rstrip()

            tool_calls_info.append(
                ToolCallInfo(
                    tool_name=tool_name,
                    arguments=tool_args,
                    result=display_result,
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

    # Max iterations reached — do a final synthesis call without tools
    messages.append(HumanMessage(
        content="You've used all available tool calls. Based on the information you already gathered, please provide a comprehensive answer to the student's question."
    ))
    response = await llm.ainvoke(messages)
    usage = response.usage_metadata or {}
    return AgentChatResponse(
        content=response.content or "I gathered information but couldn't synthesize a response.",
        tool_calls=tool_calls_info,
        sources=sources,
        model=settings.AGENT_MODEL,
        input_tokens=usage.get("input_tokens"),
        output_tokens=usage.get("output_tokens"),
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

        for iteration in range(10):
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

                    # Strip hidden answer sections for UI display and persistence
                    display_result = str(result)
                    hidden_idx = display_result.find("[HIDDEN")
                    if hidden_idx != -1:
                        display_result = display_result[:hidden_idx].rstrip()

                    tool_calls_info.append({
                        "tool_name": tool_name,
                        "arguments": tool_args,
                        "result": display_result,
                    })

                    yield f"data: {json.dumps({'type': 'tool_result', 'tool_name': tool_name, 'result': display_result[:500]})}\n\n"

                    messages.append(
                        ToolMessage(content=str(result), tool_call_id=tool_id)
                    )

                continue  # Loop back for next LLM call

            # No tool calls — stream the final response
            # Re-invoke with streaming this time
            full_content = ""
            think_filter = ThinkBlockFilter()
            async for chunk in llm_with_tools.astream(messages):
                if chunk.content:
                    filtered = think_filter.process(chunk.content)
                    if filtered:
                        full_content += filtered
                        yield f"data: {json.dumps({'type': 'content', 'token': filtered})}\n\n"
            # Flush any remaining buffered content
            remaining = think_filter.flush()
            if remaining:
                full_content += remaining
                yield f"data: {json.dumps({'type': 'content', 'token': remaining})}\n\n"

            # If we got no streaming content, use the non-streaming response
            if not full_content and response.content:
                full_content = _strip_think_tags(response.content)
                if full_content:
                    yield f"data: {json.dumps({'type': 'content', 'token': full_content})}\n\n"

            usage = response.usage_metadata or {}

            # Emit done event
            yield f"data: {json.dumps({'type': 'done', 'model': settings.AGENT_MODEL, 'tool_calls': tool_calls_info, 'input_tokens': usage.get('input_tokens'), 'output_tokens': usage.get('output_tokens')})}\n\n"
            return

        # Max iterations reached — do a final synthesis call without tools
        messages.append(HumanMessage(
            content="You've used all available tool calls. Based on the information you already gathered, please provide a comprehensive answer to the student's question."
        ))
        llm_no_tools = _get_llm()
        full_content = ""
        think_filter = ThinkBlockFilter()
        async for chunk in llm_no_tools.astream(messages):
            if chunk.content:
                filtered = think_filter.process(chunk.content)
                if filtered:
                    full_content += filtered
                    yield f"data: {json.dumps({'type': 'content', 'token': filtered})}\n\n"
        remaining = think_filter.flush()
        if remaining:
            full_content += remaining
            yield f"data: {json.dumps({'type': 'content', 'token': remaining})}\n\n"

        if not full_content:
            yield f"data: {json.dumps({'type': 'content', 'token': 'I gathered information from the tools but could not synthesize a response.'})}\n\n"

        yield f"data: {json.dumps({'type': 'done', 'model': settings.AGENT_MODEL, 'tool_calls': tool_calls_info})}\n\n"

    except Exception as e:
        logger.error("Agent stream error: %s", str(e))
        yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
