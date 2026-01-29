import { nanoid } from "nanoid";
import { db, runMigrations } from "../db";

interface VocabularyTerm {
  term: string;
  definition: string;
  context?: string;
  difficulty: "beginner" | "intermediate" | "advanced";
}

interface LessonVocabulary {
  slug: string;
  terms: VocabularyTerm[];
}

function seedVocabulary() {
  console.log("Running migrations...");
  runMigrations();

  console.log("Seeding vocabulary...");

  // Clear existing vocabulary data
  db.run("DELETE FROM vocabulary_submissions");
  db.run("DELETE FROM vocabulary_progress");
  db.run("DELETE FROM vocabulary_terms");

  // Helper to get lesson ID by slug
  const getLessonId = (slug: string): string | null => {
    const result = db
      .query<{ id: string }, [string]>("SELECT id FROM lessons WHERE slug = ?")
      .get(slug);
    return result?.id ?? null;
  };

  // Define vocabulary for each lesson
  const lessonVocabulary: LessonVocabulary[] = [
    // ============================================
    // LESSON 1: TOKENIZATION
    // ============================================
    {
      slug: "tokenization",
      terms: [
        {
          term: "token",
          definition:
            "A unit of text that the model processes (word, subword, or character)",
          context:
            "Modern LLMs like GPT-4 use subword tokens, which means a single word might be split into multiple tokens.",
          difficulty: "beginner",
        },
        {
          term: "vocabulary",
          definition: "The set of all tokens the model knows",
          context:
            "GPT-2 has a vocabulary of about 50,000 tokens, while some models use over 100,000.",
          difficulty: "beginner",
        },
        {
          term: "BPE",
          definition:
            "Byte-Pair Encoding, a subword tokenization algorithm that iteratively merges frequent pairs",
          context:
            "BPE was popularized by GPT-2 and remains the foundation for most modern tokenizers.",
          difficulty: "intermediate",
        },
        {
          term: "subword",
          definition:
            "A piece of a word, used in modern tokenizers to handle unknown words",
          context:
            'For example, "unhappiness" might be tokenized as ["un", "happiness"] or ["un", "happi", "ness"].',
          difficulty: "intermediate",
        },
        {
          term: "encode",
          definition: "Converting text into a sequence of token IDs",
          context:
            'tokenizer.encode("hello world") might return [15496, 995] depending on the tokenizer.',
          difficulty: "beginner",
        },
        {
          term: "decode",
          definition: "Converting token IDs back into text",
          context:
            'tokenizer.decode([15496, 995]) would return "hello world".',
          difficulty: "beginner",
        },
        {
          term: "[UNK]",
          definition:
            "Special token representing unknown words not in the vocabulary",
          context:
            "Word-level tokenizers use [UNK] for out-of-vocabulary words, but BPE tokenizers rarely need it.",
          difficulty: "beginner",
        },
        {
          term: "OOV",
          definition:
            "Out-of-vocabulary, words not found in the tokenizer's vocabulary",
          context:
            "OOV is a major problem for word-level tokenizers but is largely solved by subword tokenization.",
          difficulty: "intermediate",
        },
        {
          term: "word-level tokenization",
          definition: "Splitting text by whitespace into complete words",
          context:
            "Simple but requires huge vocabularies and cannot handle new or misspelled words.",
          difficulty: "beginner",
        },
        {
          term: "character-level tokenization",
          definition: "Splitting text into individual characters",
          context:
            "Very small vocabulary (~100 chars) but produces very long sequences that are harder for models to learn from.",
          difficulty: "beginner",
        },
      ],
    },

    // ============================================
    // LESSON 2: LANGUAGE MODELS
    // ============================================
    {
      slug: "language-models",
      terms: [
        {
          term: "logits",
          definition:
            "Raw unnormalized scores output by the model before softmax",
          context:
            "Logits can be any real number (positive or negative). They become probabilities after softmax.",
          difficulty: "intermediate",
        },
        {
          term: "softmax",
          definition:
            "Function that converts logits into a probability distribution",
          context:
            "softmax([2.0, 1.0, 0.1]) produces probabilities that sum to 1, emphasizing larger values.",
          difficulty: "intermediate",
        },
        {
          term: "embedding",
          definition: "Dense vector representation of a token",
          context:
            "GPT-3 uses 12,288-dimensional embeddings. Similar words have similar embedding vectors.",
          difficulty: "intermediate",
        },
        {
          term: "linear layer",
          definition:
            "Neural network layer that applies y = Wx + b transformation",
          context:
            "Linear layers are the fundamental building blocks of neural networks, including transformers.",
          difficulty: "intermediate",
        },
        {
          term: "weight matrix",
          definition: "Learnable parameters W in a linear transformation",
          context:
            "The weight matrix is learned during training and encodes the transformation the layer performs.",
          difficulty: "intermediate",
        },
        {
          term: "bias",
          definition: "Learnable offset b added after linear transformation",
          context:
            "Bias allows the layer to shift its output, providing more flexibility in what it can learn.",
          difficulty: "intermediate",
        },
        {
          term: "probability distribution",
          definition: "Values between 0-1 that sum to 1",
          context:
            "After softmax, the model outputs a probability distribution over the entire vocabulary.",
          difficulty: "beginner",
        },
        {
          term: "perplexity",
          definition:
            "Measure of how well a model predicts text (lower is better)",
          context:
            "A perplexity of 20 means the model is as uncertain as if it had to choose uniformly among 20 options.",
          difficulty: "advanced",
        },
      ],
    },

    // ============================================
    // LESSON 3: TEXT GENERATION
    // ============================================
    {
      slug: "text-generation",
      terms: [
        {
          term: "greedy decoding",
          definition: "Always selecting the highest probability token",
          context:
            "Fast and deterministic, but often produces repetitive text and can get stuck in loops.",
          difficulty: "beginner",
        },
        {
          term: "top-k sampling",
          definition: "Sampling from the k most likely tokens",
          context:
            "With k=40, only the 40 highest probability tokens are considered, then one is randomly selected.",
          difficulty: "intermediate",
        },
        {
          term: "top-p sampling",
          definition:
            "Sampling from tokens until cumulative probability reaches p",
          context:
            "With p=0.9, tokens are included until their probabilities sum to 0.9, then one is randomly selected.",
          difficulty: "intermediate",
        },
        {
          term: "nucleus sampling",
          definition: "Another name for top-p sampling",
          context:
            'The "nucleus" refers to the core set of tokens that make up most of the probability mass.',
          difficulty: "intermediate",
        },
        {
          term: "temperature",
          definition: "Parameter that controls randomness of generation",
          context:
            "T=0 is deterministic (greedy), T=1 is the original distribution, T>1 increases randomness.",
          difficulty: "beginner",
        },
        {
          term: "sampling",
          definition: "Randomly selecting from a probability distribution",
          context:
            "Unlike greedy decoding, sampling introduces controlled randomness for more diverse outputs.",
          difficulty: "beginner",
        },
        {
          term: "beam search",
          definition: "Exploring multiple candidate sequences simultaneously",
          context:
            "Beam search with beam_size=5 keeps track of the 5 most promising partial sequences.",
          difficulty: "advanced",
        },
        {
          term: "repetition penalty",
          definition: "Technique to reduce repetitive generated text",
          context:
            "Reduces the probability of tokens that have already appeared, preventing loops.",
          difficulty: "intermediate",
        },
      ],
    },

    // ============================================
    // LESSON 4: MODEL TYPES
    // ============================================
    {
      slug: "model-types",
      terms: [
        {
          term: "base model",
          definition: "Language model trained only on next-token prediction",
          context:
            "Base models like GPT-2 are great at text completion but don't naturally follow instructions.",
          difficulty: "beginner",
        },
        {
          term: "instruction-tuned",
          definition: "Model fine-tuned to follow instructions",
          context:
            "ChatGPT and Claude are instruction-tuned versions of their base models.",
          difficulty: "beginner",
        },
        {
          term: "RLHF",
          definition: "Reinforcement Learning from Human Feedback",
          context:
            "RLHF trains a reward model from human preferences, then uses RL to optimize the LLM against it.",
          difficulty: "advanced",
        },
        {
          term: "SFT",
          definition: "Supervised Fine-Tuning on instruction-response pairs",
          context:
            "SFT is typically the first step in post-training, before RLHF or DPO.",
          difficulty: "intermediate",
        },
        {
          term: "chat template",
          definition: "Format for structuring conversation with chat models",
          context:
            "Without the correct chat template, instruction-tuned models may behave like base models.",
          difficulty: "intermediate",
        },
        {
          term: "ChatML",
          definition: "A common chat template format with im_start/im_end tags",
          context:
            'ChatML uses special tokens like <|im_start|>user to mark message boundaries.',
          difficulty: "intermediate",
        },
        {
          term: "system prompt",
          definition: "Instructions that set the model's behavior",
          context:
            'System prompts like "You are a helpful assistant" shape how the model responds throughout the conversation.',
          difficulty: "beginner",
        },
        {
          term: "alignment",
          definition: "Training models to be helpful, harmless, and honest",
          context:
            "Alignment techniques like RLHF help prevent harmful outputs while maintaining helpfulness.",
          difficulty: "advanced",
        },
      ],
    },

    // ============================================
    // LESSON 5: LLM APPLICATIONS
    // ============================================
    {
      slug: "llm-applications",
      terms: [
        {
          term: "context window",
          definition: "Maximum number of tokens the model can process",
          context:
            "GPT-4 Turbo has a 128K context window, allowing it to process entire books.",
          difficulty: "beginner",
        },
        {
          term: "max_tokens",
          definition: "Parameter limiting generation length",
          context:
            "Setting max_tokens=100 ensures the model generates at most 100 tokens.",
          difficulty: "beginner",
        },
        {
          term: "stop sequence",
          definition: "String that stops generation when encountered",
          context:
            'Setting stop=["\\n\\n"] stops generation at double newlines.',
          difficulty: "beginner",
        },
        {
          term: "API",
          definition: "Application Programming Interface for accessing models",
          context:
            "The OpenAI API lets you send requests to GPT models and receive generated text.",
          difficulty: "beginner",
        },
        {
          term: "prompt engineering",
          definition: "Crafting inputs to get desired model outputs",
          context:
            "Good prompts include clear instructions, examples (few-shot), and structured formats.",
          difficulty: "intermediate",
        },
        {
          term: "inference",
          definition: "Running a trained model to generate predictions",
          context:
            "Inference costs are typically measured in tokens per second or dollars per million tokens.",
          difficulty: "beginner",
        },
        {
          term: "latency",
          definition: "Time delay in generating responses",
          context:
            "Lower latency is important for interactive applications like chatbots.",
          difficulty: "intermediate",
        },
        {
          term: "throughput",
          definition: "Number of requests a model can handle per unit time",
          context:
            "High throughput is crucial for production systems serving many users.",
          difficulty: "intermediate",
        },
      ],
    },

    // ============================================
    // LESSON 6: RETRIEVAL-AUGMENTED GENERATION (RAG)
    // ============================================
    {
      slug: "rag",
      terms: [
        {
          term: "RAG",
          definition:
            "Retrieval-Augmented Generation, a technique that combines document retrieval with LLM generation to produce grounded answers",
          context:
            "RAG systems retrieve relevant documents from a knowledge base and inject them into the LLM's prompt, reducing hallucination.",
          difficulty: "beginner",
        },
        {
          term: "text chunking",
          definition:
            "Splitting large documents into smaller, overlapping pieces for embedding and retrieval",
          context:
            "A typical RAG system chunks documents into 300-1000 character pieces with 50-200 character overlap.",
          difficulty: "beginner",
        },
        {
          term: "chunk overlap",
          definition:
            "Shared characters between consecutive chunks to preserve context at boundaries",
          context:
            "Without overlap, a sentence split across two chunks would be incomplete in both, hurting retrieval quality.",
          difficulty: "intermediate",
        },
        {
          term: "text embedding",
          definition:
            "A dense vector representation of text that captures its semantic meaning",
          context:
            "Models like gte-small produce 384-dimensional vectors where similar texts are close together in vector space.",
          difficulty: "intermediate",
        },
        {
          term: "vector store",
          definition:
            "A database optimized for storing and searching vector embeddings using similarity metrics",
          context:
            "FAISS, Pinecone, and ChromaDB are popular vector stores used in RAG systems for fast nearest-neighbor search.",
          difficulty: "intermediate",
        },
        {
          term: "cosine similarity",
          definition:
            "A similarity metric that measures the angle between two vectors, ignoring their magnitude",
          context:
            "Cosine similarity of 1.0 means identical direction (most similar), 0.0 means perpendicular (unrelated).",
          difficulty: "intermediate",
        },
        {
          term: "semantic search",
          definition:
            "Finding documents by meaning rather than exact keyword matching",
          context:
            "A semantic search for 'refund policy' would also match 'return guidelines' because the meanings are similar.",
          difficulty: "beginner",
        },
        {
          term: "retriever",
          definition:
            "A component that takes a query and returns the most relevant documents from a knowledge base",
          context:
            "In LangChain, a retriever wraps a vector store and returns the top-k most similar documents for a given query.",
          difficulty: "beginner",
        },
        {
          term: "grounding",
          definition:
            "Constraining an LLM's responses to information from provided source documents",
          context:
            "RAG prompts include instructions like 'Answer only from the provided context' to ground the LLM in retrieved facts.",
          difficulty: "intermediate",
        },
        {
          term: "hallucination",
          definition:
            "When an LLM generates plausible-sounding but factually incorrect information",
          context:
            "RAG reduces hallucination by providing the LLM with actual source documents instead of relying solely on trained knowledge.",
          difficulty: "beginner",
        },
      ],
    },
  ];

  // Insert terms for each lesson
  let totalTerms = 0;

  for (const lesson of lessonVocabulary) {
    const lessonId = getLessonId(lesson.slug);

    if (!lessonId) {
      console.warn(
        `Warning: Lesson with slug "${lesson.slug}" not found. Skipping vocabulary for this lesson.`
      );
      continue;
    }

    console.log(`Adding vocabulary for lesson: ${lesson.slug}`);

    for (let i = 0; i < lesson.terms.length; i++) {
      const term = lesson.terms[i];
      db.run(
        `INSERT INTO vocabulary_terms (id, lesson_id, term, definition, context, difficulty, order_index)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          nanoid(),
          lessonId,
          term.term,
          term.definition,
          term.context ?? null,
          term.difficulty,
          i + 1,
        ]
      );
      totalTerms++;
    }
  }

  console.log("\nVocabulary seeded successfully!");
  console.log(`- ${lessonVocabulary.length} lessons processed`);
  console.log(`- ${totalTerms} vocabulary terms added`);
}

seedVocabulary();
