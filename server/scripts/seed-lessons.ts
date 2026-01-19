import { nanoid } from "nanoid";
import { db, runMigrations } from "../db";

function seed() {
  console.log("Running migrations...");
  runMigrations();

  console.log("Seeding database...");

  // Clear existing data
  db.run("DELETE FROM test_cases");
  db.run("DELETE FROM challenges");
  db.run("DELETE FROM concepts");
  db.run("DELETE FROM lessons");

  // ============================================
  // LESSON 1: TOKENIZATION
  // ============================================
  const lesson1Id = nanoid();
  db.run(
    `INSERT INTO lessons (id, title, slug, description, order_index, is_published)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      lesson1Id,
      "Tokenization",
      "tokenization",
      "Learn how text is converted into tokens that language models can process. Covers word-level, character-level, and subword (BPE) tokenization.",
      1,
      1,
    ]
  );

  // Concept 1.1: Word-Level Tokenization
  const concept1_1Id = nanoid();
  db.run(
    `INSERT INTO concepts (id, lesson_id, title, explanation, order_index)
     VALUES (?, ?, ?, ?, ?)`,
    [
      concept1_1Id,
      lesson1Id,
      "Word-Level Tokenization",
      `# Word-Level Tokenization

Word-level tokenization splits text into individual words, mapping each unique word to an integer ID.

## How it works
1. Build a vocabulary from your training data
2. Assign each unique word a numeric ID
3. Convert text by looking up each word's ID

## Example
\`\`\`python
vocab = {"hello": 0, "world": 1, "the": 2}
# "hello world" -> [0, 1]
\`\`\`

## Limitations
- Large vocabularies needed for good coverage
- Cannot handle out-of-vocabulary (OOV) words
- No parameter sharing between similar words (run, running, runs)`,
      1,
    ]
  );

  // Challenge 1.1.1: Implement encode()
  const challenge1_1_1Id = nanoid();
  db.run(
    `INSERT INTO challenges (id, concept_id, type, title, description, starter_code, solution_code, hints, difficulty, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      challenge1_1_1Id,
      concept1_1Id,
      "implement",
      "Implement word-level encode()",
      `Create an \`encode\` function that takes a string and a vocabulary dictionary, and returns a list of token IDs.

The function should:
- Split the input text on whitespace
- Look up each word in the vocabulary
- Return a list of token IDs

**Example:**
\`\`\`python
vocab = {"hello": 0, "world": 1}
encode("hello world", vocab)  # => [0, 1]
\`\`\``,
      `def encode(text, vocab):
    # Your code here
    pass`,
      `def encode(text, vocab):
    return [vocab[word] for word in text.split()]`,
      JSON.stringify([
        "Start by splitting the text on whitespace using text.split()",
        "Use a list comprehension to transform each word into its vocabulary ID",
        "For each word, look it up in the vocab dictionary: vocab[word]",
      ]),
      "beginner",
      1,
    ]
  );

  // Test cases for encode()
  for (const tc of [
    {
      input: ["hello world", { hello: 0, world: 1 }],
      expected: [0, 1],
      desc: "Basic two-word encoding",
      order: 1,
    },
    {
      input: ["the quick fox", { the: 0, quick: 1, brown: 2, fox: 3 }],
      expected: [0, 1, 3],
      desc: "Three words with unused vocab entry",
      order: 2,
    },
    {
      input: ["a", { a: 42 }],
      expected: [42],
      desc: "Single word",
      order: 3,
    },
  ]) {
    db.run(
      `INSERT INTO test_cases (id, challenge_id, input, expected_output, description, order_index)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nanoid(),
        challenge1_1_1Id,
        JSON.stringify(tc.input),
        JSON.stringify(tc.expected),
        tc.desc,
        tc.order,
      ]
    );
  }

  // Challenge 1.1.2: Implement decode()
  const challenge1_1_2Id = nanoid();
  db.run(
    `INSERT INTO challenges (id, concept_id, type, title, description, starter_code, solution_code, hints, difficulty, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      challenge1_1_2Id,
      concept1_1Id,
      "implement",
      "Implement word-level decode()",
      `Create a \`decode\` function that takes a list of token IDs and a vocabulary dictionary, and returns the original text.

The function should:
- Build a reverse mapping from IDs to words
- Convert each ID back to its word
- Join the words with spaces

**Example:**
\`\`\`python
vocab = {"hello": 0, "world": 1}
decode([0, 1], vocab)  # => "hello world"
\`\`\``,
      `def decode(ids, vocab):
    # Your code here
    pass`,
      `def decode(ids, vocab):
    reverse_vocab = {v: k for k, v in vocab.items()}
    return " ".join(reverse_vocab[id] for id in ids)`,
      JSON.stringify([
        "You need to create a reverse mapping: ID -> word",
        "Use a dictionary comprehension: {v: k for k, v in vocab.items()}",
        "Use ' '.join() to combine the words with spaces",
      ]),
      "beginner",
      2,
    ]
  );

  for (const tc of [
    {
      input: [[0, 1], { hello: 0, world: 1 }],
      expected: "hello world",
      desc: "Basic two-word decoding",
      order: 1,
    },
    {
      input: [[2, 0, 1], { the: 0, cat: 1, sat: 2 }],
      expected: "sat the cat",
      desc: "Order matters",
      order: 2,
    },
  ]) {
    db.run(
      `INSERT INTO test_cases (id, challenge_id, input, expected_output, description, order_index)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nanoid(),
        challenge1_1_2Id,
        JSON.stringify(tc.input),
        JSON.stringify(tc.expected),
        tc.desc,
        tc.order,
      ]
    );
  }

  // Challenge 1.1.3: Handle [UNK] tokens
  const challenge1_1_3Id = nanoid();
  db.run(
    `INSERT INTO challenges (id, concept_id, type, title, description, starter_code, solution_code, hints, difficulty, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      challenge1_1_3Id,
      concept1_1Id,
      "implement",
      "Handle out-of-vocabulary words with [UNK]",
      `Modify the encode function to handle words not in the vocabulary by returning a special [UNK] token ID.

The function should:
- Return the word's ID if it exists in the vocabulary
- Return the [UNK] token ID for unknown words
- The [UNK] token will always be in the vocabulary

**Example:**
\`\`\`python
vocab = {"[UNK]": 0, "hello": 1, "world": 2}
encode("hello universe", vocab)  # => [1, 0]
# "universe" is not in vocab, so we use [UNK]'s ID (0)
\`\`\``,
      `def encode(text, vocab):
    # Your code here
    # vocab["[UNK]"] contains the ID for unknown words
    pass`,
      `def encode(text, vocab):
    unk_id = vocab["[UNK]"]
    return [vocab.get(word, unk_id) for word in text.split()]`,
      JSON.stringify([
        "Store the [UNK] token ID at the start: unk_id = vocab['[UNK]']",
        "Use vocab.get(word, unk_id) to return unk_id for missing words",
        "Or use: vocab[word] if word in vocab else unk_id",
      ]),
      "beginner",
      3,
    ]
  );

  for (const tc of [
    {
      input: ["hello universe", { "[UNK]": 0, hello: 1, world: 2 }],
      expected: [1, 0],
      desc: "Unknown word becomes [UNK]",
      order: 1,
    },
    {
      input: ["foo bar baz", { "[UNK]": 99 }],
      expected: [99, 99, 99],
      desc: "All unknown words",
      order: 2,
    },
    {
      input: ["the cat sat", { "[UNK]": 0, the: 1, cat: 2, sat: 3 }],
      expected: [1, 2, 3],
      desc: "All known words",
      order: 3,
    },
  ]) {
    db.run(
      `INSERT INTO test_cases (id, challenge_id, input, expected_output, description, order_index)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nanoid(),
        challenge1_1_3Id,
        JSON.stringify(tc.input),
        JSON.stringify(tc.expected),
        tc.desc,
        tc.order,
      ]
    );
  }

  // Concept 1.2: Character-Level Tokenization
  const concept1_2Id = nanoid();
  db.run(
    `INSERT INTO concepts (id, lesson_id, title, explanation, order_index)
     VALUES (?, ?, ?, ?, ?)`,
    [
      concept1_2Id,
      lesson1Id,
      "Character-Level Tokenization",
      `# Character-Level Tokenization

Character-level tokenization splits text into individual characters.

## Advantages
- Very small vocabulary (just ~100 characters for English)
- Can handle any word, including misspellings and new words
- No OOV problem

## Disadvantages
- Much longer sequences (a word becomes many tokens)
- Harder for the model to learn word-level patterns
- More compute required for same amount of text

## Trade-off
Character-level models need to learn spelling, word boundaries, and meaning from scratch, but they're extremely flexible.`,
      2,
    ]
  );

  // Challenge 1.2.1: Build character vocabulary
  const challenge1_2_1Id = nanoid();
  db.run(
    `INSERT INTO challenges (id, concept_id, type, title, description, starter_code, solution_code, hints, difficulty, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      challenge1_2_1Id,
      concept1_2Id,
      "implement",
      "Build a character vocabulary",
      `Create a function that builds a character-level vocabulary from a text corpus.

The function should:
- Extract all unique characters from the text
- Assign each character a unique ID starting from 0
- Return the vocabulary as a dictionary mapping characters to IDs

**Example:**
\`\`\`python
build_vocab("hello")  # => {"h": 0, "e": 1, "l": 2, "o": 3}
# Note: "l" appears twice but only gets one ID
\`\`\``,
      `def build_vocab(text):
    # Your code here
    pass`,
      `def build_vocab(text):
    chars = list(dict.fromkeys(text))  # Unique chars preserving order
    return {char: i for i, char in enumerate(chars)}`,
      JSON.stringify([
        "Get unique characters while preserving order",
        "Use dict.fromkeys(text) to get ordered unique chars, then list()",
        "Use enumerate to assign IDs and build the dictionary",
      ]),
      "beginner",
      1,
    ]
  );

  for (const tc of [
    { input: ["abc"], expected: { a: 0, b: 1, c: 2 }, desc: "Simple three characters", order: 1 },
    { input: ["aaa"], expected: { a: 0 }, desc: "Repeated character", order: 2 },
  ]) {
    db.run(
      `INSERT INTO test_cases (id, challenge_id, input, expected_output, description, order_index)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nanoid(),
        challenge1_2_1Id,
        JSON.stringify(tc.input),
        JSON.stringify(tc.expected),
        tc.desc,
        tc.order,
      ]
    );
  }

  // Concept 1.3: Subword Tokenization (BPE)
  const concept1_3Id = nanoid();
  db.run(
    `INSERT INTO concepts (id, lesson_id, title, explanation, order_index)
     VALUES (?, ?, ?, ?, ?)`,
    [
      concept1_3Id,
      lesson1Id,
      "Subword Tokenization (BPE)",
      `# Byte-Pair Encoding (BPE)

BPE is a subword tokenization algorithm that finds a middle ground between word-level and character-level tokenization.

## How it works
1. Start with characters as the initial vocabulary
2. Count all adjacent pairs of tokens
3. Merge the most frequent pair into a new token
4. Repeat until vocabulary reaches desired size

## Why it's powerful
- Common words become single tokens ("the" -> [the])
- Rare words split into meaningful pieces ("unhappiness" -> [un, happi, ness])
- Handles morphology naturally (run, running, runs share "run")
- Fixed vocabulary size with flexible coverage

## Used by
- GPT-2, GPT-3, GPT-4
- RoBERTa
- Most modern LLMs`,
      3,
    ]
  );

  // Challenge 1.3.1: Explain BPE advantages
  db.run(
    `INSERT INTO challenges (id, concept_id, type, title, description, starter_code, solution_code, hints, difficulty, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      nanoid(),
      concept1_3Id,
      "explain",
      "Why does BPE outperform word-level tokenization?",
      `Explain why Byte-Pair Encoding (BPE) generally works better than word-level tokenization for language models.

Consider these aspects in your answer:
1. **Vocabulary efficiency** - How does each method handle vocabulary size?
2. **Out-of-vocabulary handling** - What happens with rare or new words?
3. **Morphological awareness** - How does each handle word variations?
4. **Trade-offs** - What are the downsides of each approach?

Write a clear, concise explanation (3-5 paragraphs).`,
      null,
      null,
      JSON.stringify([
        "Think about what happens when you encounter a word not in your vocabulary",
        "Consider words like 'unhappiness' - how would each method tokenize it?",
        "Think about vocabulary size: word-level needs millions of entries for good coverage",
      ]),
      "intermediate",
      1,
    ]
  );

  // ============================================
  // LESSON 2: LANGUAGE MODELS
  // ============================================
  const lesson2Id = nanoid();
  db.run(
    `INSERT INTO lessons (id, title, slug, description, order_index, is_published)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      lesson2Id,
      "Language Models",
      "language-models",
      "Understand how neural language models work, from embeddings to attention mechanisms.",
      2,
      1,
    ]
  );

  // Concept 2.1: Linear Layers
  const concept2_1Id = nanoid();
  db.run(
    `INSERT INTO concepts (id, lesson_id, title, explanation, order_index)
     VALUES (?, ?, ?, ?, ?)`,
    [
      concept2_1Id,
      lesson2Id,
      "Linear Layers",
      `# Linear Layers

A linear layer (also called a fully connected or dense layer) applies a linear transformation to its input.

## The Math
\`\`\`
y = Wx + b
\`\`\`
Where:
- **x** is the input vector
- **W** is the weight matrix
- **b** is the bias vector
- **y** is the output

## In Neural Networks
Linear layers are the building blocks of neural networks. They:
- Transform input dimensions to output dimensions
- Learn weights during training
- Are followed by non-linear activations (ReLU, etc.)

## Shape
If W has shape (out_features, in_features):
- Input x has shape (in_features,)
- Output y has shape (out_features,)`,
      1,
    ]
  );

  // Challenge 2.1.1: Implement linear layer
  const challenge2_1_1Id = nanoid();
  db.run(
    `INSERT INTO challenges (id, concept_id, type, title, description, starter_code, solution_code, hints, difficulty, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      challenge2_1_1Id,
      concept2_1Id,
      "implement",
      "Implement a Linear layer forward pass",
      `Implement the forward pass of a linear layer: \`y = Wx + b\`

The function should:
- Multiply the weight matrix W by input vector x
- Add the bias vector b
- Return the result

**Example:**
\`\`\`python
W = [[1, 2], [3, 4]]  # 2x2 matrix
b = [1, 1]            # bias vector
x = [1, 1]            # input vector

linear(x, W, b)  # => [4, 8]
# W @ x = [1*1 + 2*1, 3*1 + 4*1] = [3, 7]
# + b = [3+1, 7+1] = [4, 8]
\`\`\``,
      `def linear(x, W, b):
    # x: input vector (list of numbers)
    # W: weight matrix (list of lists)
    # b: bias vector (list of numbers)
    # Return: output vector
    pass`,
      `def linear(x, W, b):
    result = []
    for i, row in enumerate(W):
        dot = sum(w * x[j] for j, w in enumerate(row))
        result.append(dot + b[i])
    return result`,
      JSON.stringify([
        "For each row of W, compute the dot product with x",
        "A dot product is: sum of (w[i] * x[i]) for all i",
        "Use sum() with a generator expression, then add the corresponding bias",
      ]),
      "intermediate",
      1,
    ]
  );

  for (const tc of [
    { input: [[1, 1], [[1, 2], [3, 4]], [1, 1]], expected: [4, 8], desc: "2x2 transformation", order: 1 },
    { input: [[1, 0], [[1, 0], [0, 1]], [0, 0]], expected: [1, 0], desc: "Identity matrix, zero bias", order: 2 },
    { input: [[2, 3], [[1, 1]], [5]], expected: [10], desc: "Projection to 1D", order: 3 },
  ]) {
    db.run(
      `INSERT INTO test_cases (id, challenge_id, input, expected_output, description, order_index)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nanoid(),
        challenge2_1_1Id,
        JSON.stringify(tc.input),
        JSON.stringify(tc.expected),
        tc.desc,
        tc.order,
      ]
    );
  }

  // Concept 2.2: Softmax
  const concept2_2Id = nanoid();
  db.run(
    `INSERT INTO concepts (id, lesson_id, title, explanation, order_index)
     VALUES (?, ?, ?, ?, ?)`,
    [
      concept2_2Id,
      lesson2Id,
      "Softmax Function",
      `# Softmax Function

Softmax converts a vector of raw scores (logits) into a probability distribution.

## The Formula
\`\`\`
softmax(x_i) = exp(x_i) / sum(exp(x_j) for all j)
\`\`\`

## Properties
- Output values are between 0 and 1
- Output values sum to 1 (valid probability distribution)
- Larger inputs get larger probabilities
- Preserves relative ordering of inputs

## Numerical Stability
In practice, we subtract the max value first to avoid overflow:
\`\`\`python
x_stable = x - max(x)
softmax(x_stable)
\`\`\`

## Use in LLMs
Softmax is used to convert the model's output logits into probabilities over the vocabulary.`,
      2,
    ]
  );

  // Challenge 2.2.1: Implement softmax
  const challenge2_2_1Id = nanoid();
  db.run(
    `INSERT INTO challenges (id, concept_id, type, title, description, starter_code, solution_code, hints, difficulty, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      challenge2_2_1Id,
      concept2_2Id,
      "implement",
      "Implement the softmax function",
      `Implement the softmax function that converts logits to probabilities.

The function should:
- Apply the softmax formula: exp(x_i) / sum(exp(x_j))
- Handle numerical stability by subtracting the max value first
- Return a list of probabilities that sum to 1

**Example:**
\`\`\`python
softmax([1, 2, 3])  # => [0.09, 0.24, 0.67] (approximately)
\`\`\``,
      `import math

def softmax(logits):
    # logits: list of numbers (raw scores)
    # Return: list of probabilities
    pass`,
      `import math

def softmax(logits):
    max_val = max(logits)
    exps = [math.exp(x - max_val) for x in logits]
    sum_exps = sum(exps)
    return [e / sum_exps for e in exps]`,
      JSON.stringify([
        "First subtract the max value from all logits for numerical stability",
        "Apply math.exp() to each shifted value",
        "Divide each exp value by the sum of all exp values",
      ]),
      "intermediate",
      1,
    ]
  );

  for (const tc of [
    {
      input: [[0, 0, 0]],
      expected: [0.3333333333333333, 0.3333333333333333, 0.3333333333333333],
      desc: "Equal logits -> equal probabilities",
      order: 1,
    },
    {
      input: [[1000, 1000, 1000]],
      expected: [0.3333333333333333, 0.3333333333333333, 0.3333333333333333],
      desc: "Large equal values (tests numerical stability)",
      order: 2,
    },
  ]) {
    db.run(
      `INSERT INTO test_cases (id, challenge_id, input, expected_output, description, order_index)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nanoid(),
        challenge2_2_1Id,
        JSON.stringify(tc.input),
        JSON.stringify(tc.expected),
        tc.desc,
        tc.order,
      ]
    );
  }

  // ============================================
  // LESSON 3: TEXT GENERATION (DECODING)
  // ============================================
  const lesson3Id = nanoid();
  db.run(
    `INSERT INTO lessons (id, title, slug, description, order_index, is_published)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      lesson3Id,
      "Text Generation (Decoding)",
      "text-generation",
      "Learn how language models generate text using different decoding strategies: greedy, top-k, and top-p sampling.",
      3,
      1,
    ]
  );

  // Concept 3.1: Greedy Decoding
  const concept3_1Id = nanoid();
  db.run(
    `INSERT INTO concepts (id, lesson_id, title, explanation, order_index)
     VALUES (?, ?, ?, ?, ?)`,
    [
      concept3_1Id,
      lesson3Id,
      "Greedy Decoding",
      `# Greedy Decoding

Greedy decoding is the simplest text generation strategy. At each step, it selects the token with the highest probability.

## How it works
1. Get probability distribution over vocabulary
2. Select token with highest probability
3. Append to sequence and repeat

## Example
\`\`\`python
# Probabilities: {"the": 0.6, "a": 0.3, "an": 0.1}
# Greedy selects: "the" (highest probability)
\`\`\`

## Pros
- Deterministic (same input -> same output)
- Fast and simple to implement
- Good for factual/precise tasks

## Cons
- Often produces repetitive text
- Can get stuck in loops ("is is is is...")
- Misses creative or diverse outputs`,
      1,
    ]
  );

  // Challenge 3.1.1: Implement greedy decode
  const challenge3_1_1Id = nanoid();
  db.run(
    `INSERT INTO challenges (id, concept_id, type, title, description, starter_code, solution_code, hints, difficulty, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      challenge3_1_1Id,
      concept3_1Id,
      "implement",
      "Implement greedy token selection",
      `Create a function that implements greedy decoding by selecting the token with the highest probability.

The function should:
- Take a dictionary mapping tokens to their probabilities
- Return the token with the highest probability

**Example:**
\`\`\`python
probs = {"the": 0.6, "a": 0.3, "an": 0.1}
greedy_select(probs)  # => "the"
\`\`\``,
      `def greedy_select(probabilities):
    # probabilities: dict mapping tokens to their probabilities
    # Return the token with the highest probability
    pass`,
      `def greedy_select(probabilities):
    return max(probabilities, key=probabilities.get)`,
      JSON.stringify([
        "Use the max() function with a key argument",
        "The key should be a function that gets the probability: probabilities.get",
        "max(dict, key=dict.get) returns the key with the maximum value",
      ]),
      "beginner",
      1,
    ]
  );

  for (const tc of [
    {
      input: [{ the: 0.6, a: 0.3, an: 0.1 }],
      expected: "the",
      desc: "Selects highest probability token",
      order: 1,
    },
    {
      input: [{ cat: 0.25, dog: 0.25, bird: 0.5 }],
      expected: "bird",
      desc: "Bird has highest probability",
      order: 2,
    },
    {
      input: [{ only: 1.0 }],
      expected: "only",
      desc: "Single token",
      order: 3,
    },
  ]) {
    db.run(
      `INSERT INTO test_cases (id, challenge_id, input, expected_output, description, order_index)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nanoid(),
        challenge3_1_1Id,
        JSON.stringify(tc.input),
        JSON.stringify(tc.expected),
        tc.desc,
        tc.order,
      ]
    );
  }

  // Concept 3.2: Top-k Sampling
  const concept3_2Id = nanoid();
  db.run(
    `INSERT INTO concepts (id, lesson_id, title, explanation, order_index)
     VALUES (?, ?, ?, ?, ?)`,
    [
      concept3_2Id,
      lesson3Id,
      "Top-k Sampling",
      `# Top-k Sampling

Top-k sampling introduces randomness by sampling from the k most likely tokens instead of always picking the best one.

## How it works
1. Sort tokens by probability (descending)
2. Keep only the top k tokens
3. Renormalize probabilities to sum to 1
4. Randomly sample from this reduced set

## Example with k=3
\`\`\`python
# Original: {"the": 0.4, "a": 0.3, "an": 0.2, "this": 0.1}
# Top-3: {"the": 0.4, "a": 0.3, "an": 0.2}
# Renormalized: {"the": 0.44, "a": 0.33, "an": 0.22}
# Sample randomly from these 3
\`\`\`

## Benefits
- Adds variety while staying reasonable
- Prevents very unlikely tokens from being selected
- Parameter k controls diversity (smaller k = more focused)`,
      2,
    ]
  );

  // Challenge 3.2.1: Implement top-k filtering
  const challenge3_2_1Id = nanoid();
  db.run(
    `INSERT INTO challenges (id, concept_id, type, title, description, starter_code, solution_code, hints, difficulty, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      challenge3_2_1Id,
      concept3_2Id,
      "implement",
      "Implement top-k filtering",
      `Create a function that filters a probability distribution to keep only the top k tokens.

The function should:
- Sort tokens by probability (highest first)
- Keep only the top k tokens
- Return the filtered distribution (don't renormalize)

**Example:**
\`\`\`python
probs = {"the": 0.4, "a": 0.3, "an": 0.2, "this": 0.1}
top_k(probs, 2)  # => {"the": 0.4, "a": 0.3}
\`\`\``,
      `def top_k(probabilities, k):
    # probabilities: dict mapping tokens to probabilities
    # k: number of top tokens to keep
    # Return dict with only the top k tokens
    pass`,
      `def top_k(probabilities, k):
    sorted_items = sorted(probabilities.items(), key=lambda x: x[1], reverse=True)
    return dict(sorted_items[:k])`,
      JSON.stringify([
        "Use sorted() with items() to get a list of (token, prob) tuples",
        "Sort by probability in descending order: key=lambda x: x[1], reverse=True",
        "Slice to keep only the top k: [:k]",
        "Convert back to dict with dict()",
      ]),
      "intermediate",
      1,
    ]
  );

  for (const tc of [
    {
      input: [{ the: 0.4, a: 0.3, an: 0.2, this: 0.1 }, 2],
      expected: { the: 0.4, a: 0.3 },
      desc: "Keep top 2 tokens",
      order: 1,
    },
    {
      input: [{ x: 0.5, y: 0.3, z: 0.2 }, 3],
      expected: { x: 0.5, y: 0.3, z: 0.2 },
      desc: "k equals number of tokens",
      order: 2,
    },
    {
      input: [{ a: 0.1, b: 0.9 }, 1],
      expected: { b: 0.9 },
      desc: "k=1 is like greedy",
      order: 3,
    },
  ]) {
    db.run(
      `INSERT INTO test_cases (id, challenge_id, input, expected_output, description, order_index)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nanoid(),
        challenge3_2_1Id,
        JSON.stringify(tc.input),
        JSON.stringify(tc.expected),
        tc.desc,
        tc.order,
      ]
    );
  }

  // Concept 3.3: Top-p (Nucleus) Sampling
  const concept3_3Id = nanoid();
  db.run(
    `INSERT INTO concepts (id, lesson_id, title, explanation, order_index)
     VALUES (?, ?, ?, ?, ?)`,
    [
      concept3_3Id,
      lesson3Id,
      "Top-p (Nucleus) Sampling",
      `# Top-p (Nucleus) Sampling

Top-p sampling dynamically selects tokens until their cumulative probability exceeds p. This adapts to the model's confidence.

## How it works
1. Sort tokens by probability (descending)
2. Add tokens until cumulative probability >= p
3. Sample from this "nucleus" of tokens

## Example with p=0.8
\`\`\`python
# Sorted: {"the": 0.5, "a": 0.3, "an": 0.15, "this": 0.05}
# Cumulative: 0.5 -> 0.8 -> 0.95 -> 1.0
# With p=0.8: keep ["the", "a"] (cumsum reaches 0.8)
\`\`\`

## Top-p vs Top-k
- Top-k: fixed number of tokens
- Top-p: adaptive based on probability mass
- Top-p is often preferred because it adapts to model confidence

## Common values
- p = 0.9 or 0.95 for diverse but coherent text
- p = 1.0 is equivalent to sampling from full distribution`,
      3,
    ]
  );

  // Challenge 3.3.1: Implement top-p filtering
  const challenge3_3_1Id = nanoid();
  db.run(
    `INSERT INTO challenges (id, concept_id, type, title, description, starter_code, solution_code, hints, difficulty, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      challenge3_3_1Id,
      concept3_3Id,
      "implement",
      "Implement top-p (nucleus) filtering",
      `Create a function that filters tokens until their cumulative probability exceeds p.

The function should:
- Sort tokens by probability (descending)
- Keep adding tokens until cumulative probability >= p
- Return the filtered distribution

**Example:**
\`\`\`python
probs = {"the": 0.5, "a": 0.3, "an": 0.15, "this": 0.05}
top_p(probs, 0.8)  # => {"the": 0.5, "a": 0.3}
# 0.5 + 0.3 = 0.8 which meets the threshold
\`\`\``,
      `def top_p(probabilities, p):
    # probabilities: dict mapping tokens to probabilities
    # p: cumulative probability threshold
    # Return dict with tokens that sum to >= p
    pass`,
      `def top_p(probabilities, p):
    sorted_items = sorted(probabilities.items(), key=lambda x: x[1], reverse=True)
    result = {}
    cumsum = 0
    for token, prob in sorted_items:
        result[token] = prob
        cumsum += prob
        if cumsum >= p:
            break
    return result`,
      JSON.stringify([
        "Sort items by probability descending first",
        "Track cumulative sum as you iterate",
        "Stop when cumulative sum reaches or exceeds p",
        "Build the result dictionary as you go",
      ]),
      "intermediate",
      1,
    ]
  );

  for (const tc of [
    {
      input: [{ the: 0.5, a: 0.3, an: 0.15, this: 0.05 }, 0.8],
      expected: { the: 0.5, a: 0.3 },
      desc: "Cumsum reaches 0.8 after two tokens",
      order: 1,
    },
    {
      input: [{ x: 0.9, y: 0.1 }, 0.5],
      expected: { x: 0.9 },
      desc: "First token exceeds threshold",
      order: 2,
    },
    {
      input: [{ a: 0.33, b: 0.33, c: 0.34 }, 1.0],
      expected: { a: 0.33, b: 0.33, c: 0.34 },
      desc: "p=1.0 keeps all tokens",
      order: 3,
    },
  ]) {
    db.run(
      `INSERT INTO test_cases (id, challenge_id, input, expected_output, description, order_index)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nanoid(),
        challenge3_3_1Id,
        JSON.stringify(tc.input),
        JSON.stringify(tc.expected),
        tc.desc,
        tc.order,
      ]
    );
  }

  // Concept 3.4: Temperature
  const concept3_4Id = nanoid();
  db.run(
    `INSERT INTO concepts (id, lesson_id, title, explanation, order_index)
     VALUES (?, ?, ?, ?, ?)`,
    [
      concept3_4Id,
      lesson3Id,
      "Temperature",
      `# Temperature

Temperature controls the "sharpness" of the probability distribution before sampling.

## The Math
\`\`\`
adjusted_logits = logits / temperature
probabilities = softmax(adjusted_logits)
\`\`\`

## Effect of Temperature

| Temperature | Effect |
|------------|--------|
| T < 1.0 | Sharper distribution, more confident choices |
| T = 1.0 | Original distribution (no change) |
| T > 1.0 | Flatter distribution, more random |

## Examples
\`\`\`python
# Original probs: [0.7, 0.2, 0.1]

# T = 0.5 (low): [0.9, 0.08, 0.02] - very confident
# T = 1.0 (normal): [0.7, 0.2, 0.1] - unchanged
# T = 2.0 (high): [0.5, 0.3, 0.2] - more uniform
\`\`\`

## Common Values
- T = 0.0-0.3: Very focused, almost deterministic
- T = 0.7-0.9: Balanced creativity and coherence
- T = 1.0-2.0: High creativity, may be less coherent`,
      4,
    ]
  );

  // Challenge 3.4.1: Apply temperature to logits
  const challenge3_4_1Id = nanoid();
  db.run(
    `INSERT INTO challenges (id, concept_id, type, title, description, starter_code, solution_code, hints, difficulty, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      challenge3_4_1Id,
      concept3_4Id,
      "implement",
      "Apply temperature scaling to logits",
      `Create a function that applies temperature scaling to logits (raw model outputs).

The function should:
- Divide each logit by the temperature
- Return the scaled logits list

**Example:**
\`\`\`python
apply_temperature([2.0, 1.0, 0.5], 0.5)
# => [4.0, 2.0, 1.0] (each divided by 0.5)

apply_temperature([2.0, 1.0, 0.5], 2.0)
# => [1.0, 0.5, 0.25] (each divided by 2.0)
\`\`\``,
      `def apply_temperature(logits, temperature):
    # logits: list of raw model outputs
    # temperature: scaling factor
    # Return list of temperature-scaled logits
    pass`,
      `def apply_temperature(logits, temperature):
    return [logit / temperature for logit in logits]`,
      JSON.stringify([
        "Temperature scaling divides each logit by temperature",
        "Use a list comprehension to apply the division to each element",
        "Lower temperature = larger values = sharper distribution",
      ]),
      "beginner",
      1,
    ]
  );

  for (const tc of [
    {
      input: [[2.0, 1.0, 0.5], 0.5],
      expected: [4.0, 2.0, 1.0],
      desc: "Low temperature amplifies differences",
      order: 1,
    },
    {
      input: [[2.0, 1.0, 0.5], 2.0],
      expected: [1.0, 0.5, 0.25],
      desc: "High temperature reduces differences",
      order: 2,
    },
    {
      input: [[1.0, 1.0, 1.0], 1.0],
      expected: [1.0, 1.0, 1.0],
      desc: "Temperature 1.0 is identity",
      order: 3,
    },
  ]) {
    db.run(
      `INSERT INTO test_cases (id, challenge_id, input, expected_output, description, order_index)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nanoid(),
        challenge3_4_1Id,
        JSON.stringify(tc.input),
        JSON.stringify(tc.expected),
        tc.desc,
        tc.order,
      ]
    );
  }

  // Challenge: Compare decoding strategies
  db.run(
    `INSERT INTO challenges (id, concept_id, type, title, description, starter_code, solution_code, hints, difficulty, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      nanoid(),
      concept3_1Id,
      "explain",
      "Compare greedy decoding with sampling methods",
      `Explain the key differences between greedy decoding and sampling-based methods (top-k, top-p).

Consider these aspects in your answer:
1. **Determinism** - Does the same input always produce the same output?
2. **Repetition** - Which method is more prone to repetitive loops?
3. **Creativity** - Which methods produce more diverse outputs?
4. **Use cases** - When would you choose each method?

Write a clear comparison (3-5 paragraphs).`,
      null,
      null,
      JSON.stringify([
        "Greedy is deterministic; sampling methods introduce randomness",
        "Greedy can get stuck repeating phrases because it always picks the same token",
        "Consider: code generation vs creative writing - which needs which approach?",
      ]),
      "intermediate",
      2,
    ]
  );

  // ============================================
  // LESSON 4: COMPLETION VS INSTRUCTION-TUNED
  // ============================================
  const lesson4Id = nanoid();
  db.run(
    `INSERT INTO lessons (id, title, slug, description, order_index, is_published)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      lesson4Id,
      "Completion vs Instruction-Tuned Models",
      "model-types",
      "Understand the difference between base language models (completion) and instruction-tuned models that follow directions.",
      4,
      1,
    ]
  );

  // Concept 4.1: Completion Models
  const concept4_1Id = nanoid();
  db.run(
    `INSERT INTO concepts (id, lesson_id, title, explanation, order_index)
     VALUES (?, ?, ?, ?, ?)`,
    [
      concept4_1Id,
      lesson4Id,
      "Completion Models",
      `# Completion Models (Base LLMs)

Base language models are trained on one objective: **predict the next token**. They learn to continue text in a statistically likely way.

## How They Work
- Trained on massive text corpora (books, web pages, code)
- Learn patterns, grammar, facts through prediction
- Generate text that "looks like" their training data

## Example Behavior
\`\`\`
Input: "The capital of France is"
Output: "Paris. France is a country in Western Europe..."
\`\`\`

The model continues naturally, but doesn't "understand" you're asking a question.

## Key Characteristics
- Excellent at text continuation
- Good for creative writing, code completion
- Don't naturally follow instructions
- May continue prompts instead of answering
- No inherent safety guardrails

## Examples
- GPT-2
- GPT-3 (davinci-base)
- LLaMA base models`,
      1,
    ]
  );

  // Concept 4.2: Instruction-Tuned Models
  const concept4_2Id = nanoid();
  db.run(
    `INSERT INTO concepts (id, lesson_id, title, explanation, order_index)
     VALUES (?, ?, ?, ?, ?)`,
    [
      concept4_2Id,
      lesson4Id,
      "Instruction-Tuned Models",
      `# Instruction-Tuned Models

Instruction-tuned models undergo additional training to follow human instructions and engage in helpful dialogue.

## Post-Training Process
1. **Supervised Fine-Tuning (SFT)**: Train on instruction-response pairs
2. **RLHF/DPO**: Align with human preferences for helpfulness and safety

## How They Behave
\`\`\`
Input: "What is the capital of France?"
Output: "The capital of France is Paris."
\`\`\`

The model interprets this as a question and provides a direct answer.

## Key Characteristics
- Follow instructions naturally
- Stay in conversation mode
- Include safety guardrails
- More helpful and aligned
- May refuse some requests
- Can be overly cautious

## Examples
- ChatGPT (GPT-3.5/4 + RLHF)
- Claude
- Qwen-Chat
- LLaMA-Chat`,
      2,
    ]
  );

  // Concept 4.3: Chat Templates
  const concept4_3Id = nanoid();
  db.run(
    `INSERT INTO concepts (id, lesson_id, title, explanation, order_index)
     VALUES (?, ?, ?, ?, ?)`,
    [
      concept4_3Id,
      lesson4Id,
      "Chat Templates",
      `# Chat Templates

Instruction-tuned models expect input in a specific format called a chat template. This helps the model understand the conversation structure.

## Why Templates Matter
Without proper formatting, instruction-tuned models may:
- Continue text instead of responding
- Give inconsistent outputs
- Ignore the conversational context

## Example Formats

### ChatML (OpenAI style)
\`\`\`
<|im_start|>system
You are a helpful assistant.
<|im_end|>
<|im_start|>user
What is 2+2?
<|im_end|>
<|im_start|>assistant
\`\`\`

### Llama 2 style
\`\`\`
[INST] <<SYS>>
You are a helpful assistant.
<</SYS>>

What is 2+2? [/INST]
\`\`\`

## Using Templates
Most libraries handle this automatically:
\`\`\`python
# Hugging Face
tokenizer.apply_chat_template(messages)

# OpenAI API
{"role": "user", "content": "Hello"}
\`\`\``,
      3,
    ]
  );

  // Challenge 4.1: Explain the difference
  db.run(
    `INSERT INTO challenges (id, concept_id, type, title, description, starter_code, solution_code, hints, difficulty, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      nanoid(),
      concept4_1Id,
      "explain",
      "Why would GPT-2 fail at answering questions?",
      `Explain why a base model like GPT-2 would struggle to answer "What is the capital of France?" compared to an instruction-tuned model.

Consider:
1. What objective was GPT-2 trained on?
2. How does it interpret the input prompt?
3. What kind of output would it likely produce?
4. How does instruction-tuning change this behavior?`,
      null,
      null,
      JSON.stringify([
        "GPT-2 was trained only on next-token prediction",
        "It might continue with: 'What is the capital of Germany?'",
        "Instruction-tuning teaches models to interpret prompts as requests",
      ]),
      "beginner",
      1,
    ]
  );

  // Challenge 4.2: Format chat messages
  const challenge4_2_1Id = nanoid();
  db.run(
    `INSERT INTO challenges (id, concept_id, type, title, description, starter_code, solution_code, hints, difficulty, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      challenge4_2_1Id,
      concept4_3Id,
      "implement",
      "Format messages into ChatML template",
      `Create a function that formats a list of chat messages into the ChatML format.

Each message has a \`role\` (system, user, or assistant) and \`content\`.

**Example:**
\`\`\`python
messages = [
    {"role": "system", "content": "You are helpful."},
    {"role": "user", "content": "Hi!"}
]
format_chatml(messages)
# => "<|im_start|>system\\nYou are helpful.<|im_end|>\\n<|im_start|>user\\nHi!<|im_end|>\\n"
\`\`\``,
      `def format_chatml(messages):
    # messages: list of dicts with "role" and "content" keys
    # Return formatted ChatML string
    pass`,
      `def format_chatml(messages):
    parts = []
    for m in messages:
        parts.append(f"<|im_start|>{m['role']}\\n{m['content']}<|im_end|>")
    return "\\n".join(parts) + "\\n"`,
      JSON.stringify([
        "Each message wraps in <|im_start|>role...content<|im_end|>",
        "Use f-strings for cleaner string building",
        "Join messages with newlines and add trailing newline",
      ]),
      "intermediate",
      1,
    ]
  );

  for (const tc of [
    {
      input: [[{ role: "user", content: "Hello" }]],
      expected: "<|im_start|>user\nHello<|im_end|>\n",
      desc: "Single user message",
      order: 1,
    },
    {
      input: [
        [
          { role: "system", content: "Be helpful" },
          { role: "user", content: "Hi" },
        ],
      ],
      expected:
        "<|im_start|>system\nBe helpful<|im_end|>\n<|im_start|>user\nHi<|im_end|>\n",
      desc: "System and user messages",
      order: 2,
    },
  ]) {
    db.run(
      `INSERT INTO test_cases (id, challenge_id, input, expected_output, description, order_index)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nanoid(),
        challenge4_2_1Id,
        JSON.stringify(tc.input),
        JSON.stringify(tc.expected),
        tc.desc,
        tc.order,
      ]
    );
  }

  // ============================================
  // LESSON 5: LLM PLAYGROUND (Optional)
  // ============================================
  const lesson5Id = nanoid();
  db.run(
    `INSERT INTO lessons (id, title, slug, description, order_index, is_published)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      lesson5Id,
      "Building LLM Applications",
      "llm-applications",
      "Optional: Learn to build interactive applications with language models, combining all the concepts from previous lessons.",
      5,
      1,
    ]
  );

  // Concept 5.1: Putting It All Together
  const concept5_1Id = nanoid();
  db.run(
    `INSERT INTO concepts (id, lesson_id, title, explanation, order_index)
     VALUES (?, ?, ?, ?, ?)`,
    [
      concept5_1Id,
      lesson5Id,
      "The LLM Pipeline",
      `# The Complete LLM Pipeline

Now you understand all the pieces. Here's how they fit together:

## The Flow
\`\`\`
User Input
    |
Tokenization (text -> token IDs)
    |
Model Forward Pass
    |
Logits (raw scores for each token)
    |
Temperature Scaling
    |
Softmax -> Probabilities
    |
Decoding Strategy (greedy/top-k/top-p)
    |
Selected Token
    |
Append to sequence, repeat
    |
Detokenization (token IDs -> text)
    |
Output to User
\`\`\`

## Key Parameters
| Parameter | Effect |
|-----------|--------|
| \`max_tokens\` | Maximum length of generation |
| \`temperature\` | Randomness (0 = deterministic, >1 = creative) |
| \`top_k\` | Sample from top k tokens |
| \`top_p\` | Sample from tokens with cumulative prob >= p |
| \`stop_sequences\` | Stop generation at specific strings |

## Building Applications
When building LLM apps, you control these parameters to get the right behavior:
- **Code generation**: Low temperature (0.2), greedy or top_p=0.95
- **Creative writing**: Higher temperature (0.9), top_p=0.95
- **Factual Q&A**: Low temperature, maybe greedy`,
      1,
    ]
  );

  // Challenge 5.1: Build a generation pipeline
  const challenge5_1_1Id = nanoid();
  db.run(
    `INSERT INTO challenges (id, concept_id, type, title, description, starter_code, solution_code, hints, difficulty, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      challenge5_1_1Id,
      concept5_1Id,
      "implement",
      "Implement a simplified generation step",
      `Create a function that performs one step of text generation:
1. Apply temperature to logits
2. Convert to probabilities with softmax
3. Select a token using greedy decoding

**Example:**
\`\`\`python
logits = [2.0, 1.0, 0.5]
vocab = ["the", "a", "an"]
generate_step(logits, vocab, 1.0)
# => "the" (highest probability after softmax)
\`\`\``,
      `import math

def generate_step(logits, vocab, temperature):
    # 1. Apply temperature scaling
    # 2. Apply softmax to get probabilities
    # 3. Return the token with highest probability

    # Helper: softmax function
    def softmax(arr):
        max_val = max(arr)
        exps = [math.exp(x - max_val) for x in arr]
        total = sum(exps)
        return [e / total for e in exps]

    # Your code here
    pass`,
      `import math

def generate_step(logits, vocab, temperature):
    def softmax(arr):
        max_val = max(arr)
        exps = [math.exp(x - max_val) for x in arr]
        total = sum(exps)
        return [e / total for e in exps]

    scaled = [l / temperature for l in logits]
    probs = softmax(scaled)
    max_idx = probs.index(max(probs))
    return vocab[max_idx]`,
      JSON.stringify([
        "First divide each logit by temperature",
        "Then apply the provided softmax function",
        "Find the index with the highest probability using list.index(max(list))",
        "Return vocab[max_idx]",
      ]),
      "intermediate",
      1,
    ]
  );

  for (const tc of [
    {
      input: [[2.0, 1.0, 0.5], ["the", "a", "an"], 1.0],
      expected: "the",
      desc: "Highest logit becomes highest prob",
      order: 1,
    },
    {
      input: [[1.0, 1.0, 1.0], ["x", "y", "z"], 1.0],
      expected: "x",
      desc: "Equal logits - first one wins (greedy)",
      order: 2,
    },
    {
      input: [[0.5, 2.0, 1.0], ["a", "b", "c"], 0.5],
      expected: "b",
      desc: "Low temperature keeps same winner",
      order: 3,
    },
  ]) {
    db.run(
      `INSERT INTO test_cases (id, challenge_id, input, expected_output, description, order_index)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nanoid(),
        challenge5_1_1Id,
        JSON.stringify(tc.input),
        JSON.stringify(tc.expected),
        tc.desc,
        tc.order,
      ]
    );
  }

  console.log("Database seeded successfully!");
  console.log("- 5 lessons");
  console.log("- 12 concepts");
  console.log("- 14 challenges (now in Python!)");
}

seed();
