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
      `## Vocabulary Efficiency

Word-level tokenization requires an enormous vocabulary to achieve good coverage of a language. English alone has hundreds of thousands of words, and when you include technical terms, proper nouns, and compound words, the vocabulary can grow to millions of entries. This creates memory and computational challenges. BPE, on the other hand, achieves excellent coverage with a fixed, manageable vocabulary size (typically 30,000-50,000 tokens) by breaking words into commonly occurring subword pieces.

## Out-of-Vocabulary Handling

The most critical advantage of BPE is how it handles unknown words. Word-level tokenizers must use a special [UNK] token for any word not in their vocabulary, losing all semantic information about that word. BPE can tokenize *any* word by breaking it into known subword pieces. For example, "unfriendliness" might become ["un", "friend", "li", "ness"], preserving meaningful components even for words the model has never seen as a whole.

## Morphological Awareness

BPE naturally captures morphological patterns in language. Related words like "run", "running", "runner", and "runs" will share common subword tokens (like "run"), allowing the model to recognize their relationship and share learned parameters. Word-level tokenization treats each form as a completely separate entity with no connection, requiring the model to independently learn that "running" relates to "run."

## Trade-offs

BPE isn't without downsides. It produces longer token sequences than word-level tokenization (more tokens to process), and the segmentation can sometimes be counterintuitive (splitting words in unexpected places). Word-level tokenization is simpler to understand and debug. However, for most modern NLP applications, BPE's flexibility and efficient vocabulary usage far outweigh these minor drawbacks, which is why it's used in virtually all state-of-the-art language models.`,
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
      `## Determinism

Greedy decoding is completely deterministic—given the same input and model, it will always produce the exact same output because it always selects the highest probability token. Sampling methods (top-k and top-p) introduce controlled randomness by selecting from a pool of likely candidates, meaning each run can produce different outputs. This non-determinism is a feature, not a bug, when you want variety in your outputs.

## Repetition Problem

Greedy decoding is notorious for producing repetitive text. Because it always picks the most probable token, it can get stuck in loops like "the cat sat on the mat on the mat on the mat..." Once a pattern becomes locally probable, greedy will keep selecting it. Sampling methods break out of these loops naturally because they occasionally pick different tokens, introducing variation that prevents the model from getting trapped in repetitive patterns.

## Creativity and Diversity

Sampling methods produce more diverse and creative outputs by allowing the model to explore less obvious word choices. Top-k keeps a fixed number of candidates (e.g., the top 40 tokens), while top-p (nucleus sampling) dynamically adjusts based on the probability mass, including more options when the model is uncertain and fewer when it's confident. This adaptability makes top-p particularly effective for balancing creativity with coherence.

## Use Cases

**Greedy decoding** is best for tasks requiring precision and reproducibility: code generation, factual question answering, math problems, or any situation where there's typically one "correct" answer. **Sampling methods** excel at creative tasks: story writing, dialogue generation, brainstorming, or any application where variety and human-like naturalness matter more than deterministic correctness. Many applications use top-p with values like 0.9-0.95 combined with a moderate temperature (0.7-0.9) for the best balance of quality and diversity.`,
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
      `## GPT-2's Training Objective

GPT-2 was trained solely on **next-token prediction**—given a sequence of text, predict what token comes next. It learned to do this by reading billions of web pages, books, and articles. Crucially, it was never trained to recognize questions as requests for information. It only learned to predict what text typically follows other text.

## How GPT-2 Interprets the Prompt

When given "What is the capital of France?", GPT-2 doesn't think "this is a question I should answer." Instead, it thinks "what text typically follows this sequence in my training data?" The answer might be another question ("What is the capital of Germany?"), a list of quiz questions, or the beginning of a geography lesson. GPT-2 saw questions in many contexts—trivia games, textbooks, conversations—and will continue in whatever pattern seems most likely.

## Likely GPT-2 Output

GPT-2 might produce any of these:
- "What is the capital of Germany? What is the capital of Spain?"
- "This is a common question asked in geography classes..."
- "A) Paris B) London C) Berlin D) Rome"
- Sometimes it might luck into "Paris" if the training data had many direct Q&A pairs, but this is inconsistent.

## How Instruction-Tuning Fixes This

Instruction-tuned models (like ChatGPT or Claude) undergo additional training on curated instruction-response pairs. They learn that questions are requests requiring direct answers, that users expect helpful responses, and how to format replies appropriately. When an instruction-tuned model sees "What is the capital of France?", it understands this as a request and responds: "The capital of France is Paris." This alignment training fundamentally changes how the model interprets user input.`,
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

  // ============================================
  // LESSON 6: RETRIEVAL-AUGMENTED GENERATION (RAG)
  // ============================================
  const lesson6Id = nanoid();
  db.run(
    `INSERT INTO lessons (id, title, slug, description, order_index, is_published)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      lesson6Id,
      "Retrieval-Augmented Generation (RAG)",
      "rag",
      "Learn how to build RAG systems that combine document retrieval with language model generation. Covers text chunking, embeddings, similarity search, and context-augmented prompting.",
      6,
      1,
    ]
  );

  // Concept 6.1: Text Chunking
  const concept6_1Id = nanoid();
  db.run(
    `INSERT INTO concepts (id, lesson_id, title, explanation, order_index)
     VALUES (?, ?, ?, ?, ?)`,
    [
      concept6_1Id,
      lesson6Id,
      "Text Chunking",
      `# Text Chunking

Text chunking splits large documents into smaller, manageable pieces for retrieval and processing. This is a critical preprocessing step in any RAG system.

## Why Chunk?
- LLMs have limited context windows — you can't feed an entire document at once
- Smaller chunks improve retrieval precision — the model gets focused, relevant passages
- Embedding models work best on paragraph-length text, not entire documents

## Chunking Strategies

### Fixed-Size Chunking
Split text into equal-sized pieces by character count. Simple but may break mid-sentence.

### Overlapping Chunks
Add overlap between consecutive chunks so context at boundaries isn't lost:
\`\`\`
Chunk 1: [===overlap===]
Chunk 2:    [===overlap===]
Chunk 3:       [===overlap===]
\`\`\`

### Recursive/Semantic Chunking
Split on natural boundaries (paragraphs, sentences) then further split if still too large. Libraries like LangChain's \`RecursiveCharacterTextSplitter\` use this approach.

## Common Parameters
| Parameter | Typical Value | Effect |
|-----------|--------------|--------|
| \`chunk_size\` | 300-1000 chars | Larger = more context per chunk |
| \`chunk_overlap\` | 50-200 chars | Larger = more continuity between chunks |

## Trade-offs
- **Small chunks**: Better retrieval precision, but may lack context
- **Large chunks**: More context, but noisier retrieval results
- **More overlap**: Better continuity, but more redundant storage`,
      1,
    ]
  );

  // Challenge 6.1.1: Fixed-size text chunking
  const challenge6_1_1Id = nanoid();
  db.run(
    `INSERT INTO challenges (id, concept_id, type, title, description, starter_code, solution_code, hints, difficulty, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      challenge6_1_1Id,
      concept6_1Id,
      "implement",
      "Implement fixed-size text chunking",
      `Create a \`chunk_text\` function that splits a string into non-overlapping chunks of a given size.

The function should:
- Split the text into pieces of exactly \`chunk_size\` characters
- The last chunk may be shorter if the text doesn't divide evenly
- Return a list of chunk strings

**Example:**
\`\`\`python
chunk_text("abcdefghij", 3)  # => ["abc", "def", "ghi", "j"]
\`\`\``,
      `def chunk_text(text, chunk_size):
    # text: the input string to chunk
    # chunk_size: maximum characters per chunk
    # Return: list of chunk strings
    pass`,
      `def chunk_text(text, chunk_size):
    return [text[i:i + chunk_size] for i in range(0, len(text), chunk_size)]`,
      JSON.stringify([
        "Use range(0, len(text), chunk_size) to get the starting index of each chunk",
        "Slice the text with text[i:i + chunk_size] for each start position",
        "Python slicing handles the last chunk gracefully — it won't go past the end",
      ]),
      "beginner",
      1,
    ]
  );

  for (const tc of [
    {
      input: ["abcdefghij", 3],
      expected: ["abc", "def", "ghi", "j"],
      desc: "Uneven split with remainder",
      order: 1,
    },
    {
      input: ["hello", 10],
      expected: ["hello"],
      desc: "Text shorter than chunk size",
      order: 2,
    },
    {
      input: ["abcdef", 2],
      expected: ["ab", "cd", "ef"],
      desc: "Exact division",
      order: 3,
    },
  ]) {
    db.run(
      `INSERT INTO test_cases (id, challenge_id, input, expected_output, description, order_index)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nanoid(),
        challenge6_1_1Id,
        JSON.stringify(tc.input),
        JSON.stringify(tc.expected),
        tc.desc,
        tc.order,
      ]
    );
  }

  // Challenge 6.1.2: Overlapping text chunking
  const challenge6_1_2Id = nanoid();
  db.run(
    `INSERT INTO challenges (id, concept_id, type, title, description, starter_code, solution_code, hints, difficulty, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      challenge6_1_2Id,
      concept6_1Id,
      "implement",
      "Implement overlapping text chunking",
      `Create a \`chunk_text_overlap\` function that splits text into chunks with overlap between consecutive chunks.

The function should:
- Create chunks of \`chunk_size\` characters
- Each new chunk starts \`chunk_size - overlap\` characters after the previous one
- The last chunk may be shorter than \`chunk_size\`
- Return a list of chunk strings

**Example:**
\`\`\`python
chunk_text_overlap("abcdefghij", 5, 2)
# => ["abcde", "defgh", "ghij"]
# Chunk 1 starts at 0: "abcde"
# Chunk 2 starts at 3: "defgh" (overlap of "de")
# Chunk 3 starts at 6: "ghij"  (overlap of "gh")
\`\`\``,
      `def chunk_text_overlap(text, chunk_size, overlap):
    # text: the input string
    # chunk_size: maximum characters per chunk
    # overlap: number of overlapping characters between chunks
    # Return: list of chunk strings
    pass`,
      `def chunk_text_overlap(text, chunk_size, overlap):
    chunks = []
    step = chunk_size - overlap
    for i in range(0, len(text), step):
        chunk = text[i:i + chunk_size]
        if chunk:
            chunks.append(chunk)
    return chunks`,
      JSON.stringify([
        "The step size between chunk starts is chunk_size - overlap",
        "Use range(0, len(text), step) to iterate through start positions",
        "Slice with text[i:i + chunk_size] — Python handles end-of-string gracefully",
      ]),
      "intermediate",
      2,
    ]
  );

  for (const tc of [
    {
      input: ["abcdefghij", 5, 2],
      expected: ["abcde", "defgh", "ghij"],
      desc: "Basic overlap of 2 characters",
      order: 1,
    },
    {
      input: ["abcdefgh", 4, 1],
      expected: ["abcd", "defg", "fgh"],
      desc: "Overlap of 1 character",
      order: 2,
    },
    {
      input: ["abc", 5, 2],
      expected: ["abc"],
      desc: "Text shorter than chunk size",
      order: 3,
    },
  ]) {
    db.run(
      `INSERT INTO test_cases (id, challenge_id, input, expected_output, description, order_index)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nanoid(),
        challenge6_1_2Id,
        JSON.stringify(tc.input),
        JSON.stringify(tc.expected),
        tc.desc,
        tc.order,
      ]
    );
  }

  // Challenge 6.1.3: Explain why chunking is needed
  db.run(
    `INSERT INTO challenges (id, concept_id, type, title, description, starter_code, solution_code, hints, difficulty, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      nanoid(),
      concept6_1Id,
      "explain",
      "Why is text chunking necessary for RAG?",
      `Explain why text chunking is a critical preprocessing step in Retrieval-Augmented Generation systems.

Consider these aspects in your answer:
1. **Context window limits** — Why can't we just pass entire documents to the LLM?
2. **Retrieval precision** — How does chunk size affect the quality of retrieved results?
3. **Overlap** — Why do we add overlap between chunks? What happens without it?
4. **Trade-offs** — What are the consequences of chunks that are too small vs. too large?

Write a clear explanation (3-5 paragraphs).`,
      null,
      `## Context Window Limits

Large Language Models have a fixed context window — the maximum amount of text they can read at once. Even modern models with 128K+ token windows can't efficiently process entire document collections. In a RAG system, we need to select only the most relevant passages to include in the prompt, which means documents must be broken into pieces small enough to selectively retrieve and fit within the context window alongside the user's question and system instructions.

## Retrieval Precision

Chunk size directly affects retrieval quality. When chunks are small (e.g., individual sentences), the embedding captures very specific meaning, making it easier to match a precise query. However, small chunks may lack the surrounding context needed to fully answer a question. When chunks are large (e.g., entire pages), they contain more information but the embedding becomes a blurry average of many topics, making precise matching harder. Most RAG systems use chunks of 300-1000 characters as a practical sweet spot.

## The Role of Overlap

Overlap between consecutive chunks ensures that information at chunk boundaries isn't lost. Without overlap, a key fact that spans two chunks would be split across them, and neither chunk alone would contain the complete information. For example, if a sentence starts at the end of chunk 1 and finishes at the beginning of chunk 2, overlap ensures at least one chunk contains the full sentence. Typical overlap values are 10-20% of the chunk size.

## Trade-offs

Too-small chunks produce many highly specific pieces but may lack context — answering "What is the refund policy?" might require information spread across several tiny chunks. Too-large chunks are self-contained but produce noisy embeddings that match many queries imprecisely. The ideal chunk size depends on the use case: FAQ-style questions work well with small chunks, while complex analytical questions benefit from larger chunks. This is often tuned experimentally by evaluating retrieval quality on representative queries.`,
      JSON.stringify([
        "Think about what happens when a document is 50 pages but the model can only read 4 pages at a time",
        "Consider: if a chunk contains a whole chapter, its embedding represents many topics at once — is that good for precise matching?",
        "What happens if a sentence starts at the end of one chunk and finishes at the start of the next?",
      ]),
      "intermediate",
      3,
    ]
  );

  // Concept 6.2: Vector Embeddings and Similarity
  const concept6_2Id = nanoid();
  db.run(
    `INSERT INTO concepts (id, lesson_id, title, explanation, order_index)
     VALUES (?, ?, ?, ?, ?)`,
    [
      concept6_2Id,
      lesson6Id,
      "Embeddings & Similarity",
      `# Vector Embeddings and Similarity

Embeddings are dense numerical vectors that capture the semantic meaning of text. In RAG, both document chunks and user queries are converted to embeddings so we can find relevant documents using mathematical similarity.

## What Are Embeddings?
An embedding model converts text into a fixed-length vector of numbers (e.g., 384 dimensions for \`gte-small\`, 1536 for OpenAI's \`text-embedding-3-small\`). Similar meanings produce vectors that point in similar directions.

\`\`\`python
# Conceptually:
embed("king") ≈ [0.2, 0.8, 0.1, ...]  # 384 numbers
embed("queen") ≈ [0.2, 0.7, 0.2, ...]  # nearby in vector space
embed("pizza") ≈ [0.9, 0.1, 0.3, ...]  # far away
\`\`\`

## Measuring Similarity

### Dot Product
The simplest similarity measure — multiply corresponding elements and sum:
\`\`\`
dot(a, b) = a₁b₁ + a₂b₂ + ... + aₙbₙ
\`\`\`

### Cosine Similarity
Measures the angle between two vectors, ignoring magnitude:
\`\`\`
cosine(a, b) = dot(a, b) / (||a|| × ||b||)
\`\`\`
- **1.0** = identical direction (most similar)
- **0.0** = perpendicular (unrelated)
- **-1.0** = opposite direction (most dissimilar)

## Why Cosine Similarity?
Cosine similarity is preferred because it's **magnitude-invariant**. A long document and a short document can have different embedding magnitudes, but cosine similarity compares their semantic direction, not their length.

## Embedding Models
| Model | Dimensions | Quality | Speed |
|-------|-----------|---------|-------|
| \`gte-small\` | 384 | Good | Fast |
| \`text-embedding-3-small\` | 1536 | Better | API call |
| \`text-embedding-3-large\` | 3072 | Best | API call |`,
      2,
    ]
  );

  // Challenge 6.2.1: Implement dot product
  const challenge6_2_1Id = nanoid();
  db.run(
    `INSERT INTO challenges (id, concept_id, type, title, description, starter_code, solution_code, hints, difficulty, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      challenge6_2_1Id,
      concept6_2Id,
      "implement",
      "Implement the dot product",
      `Create a \`dot_product\` function that computes the dot product of two vectors.

The dot product is the sum of element-wise products:
\`\`\`
dot(a, b) = a₁×b₁ + a₂×b₂ + ... + aₙ×bₙ
\`\`\`

**Example:**
\`\`\`python
dot_product([1, 2, 3], [4, 5, 6])  # => 32
# 1×4 + 2×5 + 3×6 = 4 + 10 + 18 = 32
\`\`\``,
      `def dot_product(vec_a, vec_b):
    # vec_a: first vector (list of numbers)
    # vec_b: second vector (list of numbers)
    # Return: the dot product (a single number)
    pass`,
      `def dot_product(vec_a, vec_b):
    return sum(a * b for a, b in zip(vec_a, vec_b))`,
      JSON.stringify([
        "Use zip(vec_a, vec_b) to pair up corresponding elements",
        "Multiply each pair together: a * b",
        "Sum all the products with sum()",
      ]),
      "beginner",
      1,
    ]
  );

  for (const tc of [
    {
      input: [[1, 2, 3], [4, 5, 6]],
      expected: 32,
      desc: "Basic dot product",
      order: 1,
    },
    {
      input: [[1, 0], [0, 1]],
      expected: 0,
      desc: "Orthogonal vectors",
      order: 2,
    },
    {
      input: [[2, 3], [2, 3]],
      expected: 13,
      desc: "Self dot product",
      order: 3,
    },
  ]) {
    db.run(
      `INSERT INTO test_cases (id, challenge_id, input, expected_output, description, order_index)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nanoid(),
        challenge6_2_1Id,
        JSON.stringify(tc.input),
        JSON.stringify(tc.expected),
        tc.desc,
        tc.order,
      ]
    );
  }

  // Challenge 6.2.2: Implement cosine similarity
  const challenge6_2_2Id = nanoid();
  db.run(
    `INSERT INTO challenges (id, concept_id, type, title, description, starter_code, solution_code, hints, difficulty, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      challenge6_2_2Id,
      concept6_2Id,
      "implement",
      "Implement cosine similarity",
      `Create a \`cosine_similarity\` function that computes the cosine similarity between two vectors.

The formula is:
\`\`\`
cosine_sim(a, b) = dot(a, b) / (||a|| × ||b||)
\`\`\`

Where \`||a||\` is the magnitude (Euclidean norm) of vector a:
\`\`\`
||a|| = sqrt(a₁² + a₂² + ... + aₙ²)
\`\`\`

**Example:**
\`\`\`python
cosine_similarity([1, 0], [0, 1])  # => 0.0 (perpendicular)
cosine_similarity([1, 2], [1, 2])  # => 1.0 (identical)
\`\`\``,
      `import math

def cosine_similarity(vec_a, vec_b):
    # vec_a: first vector (list of numbers)
    # vec_b: second vector (list of numbers)
    # Return: cosine similarity (float between -1 and 1)
    pass`,
      `import math

def cosine_similarity(vec_a, vec_b):
    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    mag_a = math.sqrt(sum(a * a for a in vec_a))
    mag_b = math.sqrt(sum(b * b for b in vec_b))
    return dot / (mag_a * mag_b)`,
      JSON.stringify([
        "First compute the dot product: sum(a * b for a, b in zip(vec_a, vec_b))",
        "Then compute each magnitude: math.sqrt(sum(x * x for x in vec))",
        "Divide the dot product by the product of magnitudes",
      ]),
      "intermediate",
      2,
    ]
  );

  for (const tc of [
    {
      input: [[1, 0], [0, 1]],
      expected: 0.0,
      desc: "Perpendicular vectors",
      order: 1,
    },
    {
      input: [[1, 2, 3], [1, 2, 3]],
      expected: 1.0,
      desc: "Identical vectors",
      order: 2,
    },
    {
      input: [[1, 0], [1, 1]],
      expected: 0.7071067811865475,
      desc: "45-degree angle",
      order: 3,
    },
  ]) {
    db.run(
      `INSERT INTO test_cases (id, challenge_id, input, expected_output, description, order_index)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nanoid(),
        challenge6_2_2Id,
        JSON.stringify(tc.input),
        JSON.stringify(tc.expected),
        tc.desc,
        tc.order,
      ]
    );
  }

  // Challenge 6.2.3: Explain cosine similarity for text
  db.run(
    `INSERT INTO challenges (id, concept_id, type, title, description, starter_code, solution_code, hints, difficulty, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      nanoid(),
      concept6_2Id,
      "explain",
      "Why is cosine similarity preferred for text embeddings?",
      `Explain why cosine similarity is the standard similarity metric for comparing text embeddings, rather than Euclidean distance or raw dot product.

Consider these aspects:
1. **Magnitude invariance** — Why does ignoring vector length matter for text?
2. **Document length** — How do short vs. long documents affect embeddings?
3. **Range and interpretation** — What do cosine similarity values mean?
4. **Comparison with alternatives** — When might Euclidean distance or dot product be better?

Write a clear explanation (3-4 paragraphs).`,
      null,
      `## Magnitude Invariance

The key advantage of cosine similarity is that it measures the *direction* of vectors, not their *length*. When embedding models process text, longer documents tend to produce embeddings with larger magnitudes simply because more text contributes to the vector values. Two documents about the same topic — one a brief summary and one a detailed article — would have embeddings pointing in similar directions but with different magnitudes. Cosine similarity correctly identifies them as semantically similar, while Euclidean distance would penalize the magnitude difference and rank them as less similar.

## Document Length Effects

In a RAG system, document chunks can vary significantly in length even with chunking strategies. A 100-word chunk and a 500-word chunk about the same topic should be considered equally relevant to a matching query. Cosine similarity normalizes for this by dividing by the product of magnitudes (effectively comparing unit vectors). This means retrieval quality doesn't degrade when your knowledge base contains chunks of varying sizes — the retriever focuses purely on semantic relevance.

## Range and Interpretation

Cosine similarity produces values between -1 and 1, which are intuitive to interpret: 1.0 means identical semantic direction, 0.0 means completely unrelated, and -1.0 means opposite meaning. This bounded range makes it easy to set meaningful similarity thresholds (e.g., "only retrieve chunks with cosine similarity > 0.7"). Euclidean distance has no upper bound, making threshold-setting less intuitive, and raw dot product conflates similarity with magnitude.

## When to Use Alternatives

Dot product is preferred when embeddings are already normalized (unit length), which is the case for some models like OpenAI's. In this case, dot product and cosine similarity produce identical rankings but dot product is computationally cheaper (no magnitude calculation needed). Euclidean distance can be better for tasks where magnitude carries meaningful information, such as comparing feature vectors in recommendation systems. However, for general text retrieval in RAG, cosine similarity remains the most robust default choice.`,
      JSON.stringify([
        "Think about two documents on the same topic — one is 100 words, the other is 1000 words",
        "Cosine measures angle between vectors; Euclidean measures straight-line distance",
        "What's easier to interpret: a similarity of 0.85 or a distance of 12.7?",
      ]),
      "intermediate",
      3,
    ]
  );

  // Concept 6.3: Nearest Neighbor Retrieval
  const concept6_3Id = nanoid();
  db.run(
    `INSERT INTO concepts (id, lesson_id, title, explanation, order_index)
     VALUES (?, ?, ?, ?, ?)`,
    [
      concept6_3Id,
      lesson6Id,
      "Nearest Neighbor Retrieval",
      `# Nearest Neighbor Retrieval

The retrieval step in RAG finds the k most relevant document chunks for a given query. This is done by comparing the query's embedding against all stored document embeddings and returning the closest matches.

## How It Works
1. Convert the user's query into an embedding vector
2. Compare that vector against every document embedding in the index
3. Return the top-k most similar documents

\`\`\`python
# Conceptual flow:
query_vec = embed("What is your return policy?")
# Compare against all document embeddings
similarities = [cosine_sim(query_vec, doc_vec) for doc_vec in index]
# Return top-k most similar
top_k_docs = sorted(similarities, reverse=True)[:k]
\`\`\`

## The k Parameter
- **Small k** (1-3): Few, highly relevant chunks — may miss information
- **Large k** (8-20): More context — but includes less relevant chunks
- Common default: k=4 to k=8

## Brute Force vs. Approximate Search

### Brute Force
Compare query against every document. Exact results but slow for large collections.
- Time: O(n × d) where n = documents, d = dimensions
- Fine for < 100K documents

### Approximate Nearest Neighbors (ANN)
Trade small accuracy loss for massive speed gains:
- **IVF (Inverted File Index)**: Clusters vectors, only searches nearby clusters
- **HNSW (Hierarchical Navigable Small World)**: Graph-based approach, very fast
- **Product Quantization**: Compresses vectors to reduce memory

## Vector Databases
Production systems use specialized databases:
| Database | Type | Key Feature |
|----------|------|-------------|
| **FAISS** | Library | Meta's fast similarity search |
| **Pinecone** | Managed | Fully hosted, scales automatically |
| **ChromaDB** | Open-source | Simple API, good for prototyping |
| **Weaviate** | Open-source | Schema-aware, hybrid search |`,
      3,
    ]
  );

  // Challenge 6.3.1: Implement k-nearest neighbors
  const challenge6_3_1Id = nanoid();
  db.run(
    `INSERT INTO challenges (id, concept_id, type, title, description, starter_code, solution_code, hints, difficulty, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      challenge6_3_1Id,
      concept6_3Id,
      "implement",
      "Implement k-nearest neighbors retrieval",
      `Create a \`find_nearest\` function that retrieves the k most similar documents to a query vector using cosine similarity.

The function should:
- Compute cosine similarity between the query and each document vector
- Return the doc_ids of the k most similar documents
- Results should be sorted by similarity (most similar first)

**Example:**
\`\`\`python
query = [1, 0]
docs = [("a", [1, 0]), ("b", [0, 1]), ("c", [1, 1])]
find_nearest(query, docs, 2)  # => ["a", "c"]
# "a" has cosine_sim = 1.0 (identical)
# "c" has cosine_sim ≈ 0.71 (45 degrees)
# "b" has cosine_sim = 0.0 (perpendicular)
\`\`\``,
      `import math

def find_nearest(query_vec, document_vecs, k):
    # query_vec: the query embedding (list of floats)
    # document_vecs: list of (doc_id, embedding) tuples
    # k: number of nearest neighbors to return
    # Return: list of doc_ids, most similar first
    pass`,
      `import math

def find_nearest(query_vec, document_vecs, k):
    def cosine_sim(a, b):
        dot = sum(x * y for x, y in zip(a, b))
        mag_a = math.sqrt(sum(x * x for x in a))
        mag_b = math.sqrt(sum(x * x for x in b))
        if mag_a == 0 or mag_b == 0:
            return 0.0
        return dot / (mag_a * mag_b)

    scored = [(doc_id, cosine_sim(query_vec, vec)) for doc_id, vec in document_vecs]
    scored.sort(key=lambda x: x[1], reverse=True)
    return [doc_id for doc_id, _ in scored[:k]]`,
      JSON.stringify([
        "First implement a cosine similarity helper inside the function",
        "Compute similarity for each document: (doc_id, similarity) pairs",
        "Sort by similarity descending and take the first k doc_ids",
      ]),
      "intermediate",
      1,
    ]
  );

  for (const tc of [
    {
      input: [[1, 0], [["a", [1, 0]], ["b", [0, 1]], ["c", [1, 1]]], 2],
      expected: ["a", "c"],
      desc: "Retrieve 2 nearest from 3 documents",
      order: 1,
    },
    {
      input: [[0, 1], [["x", [0, 1]], ["y", [1, 0]], ["z", [1, 1]]], 1],
      expected: ["x"],
      desc: "Retrieve single nearest neighbor",
      order: 2,
    },
    {
      input: [[1, 1], [["p", [1, 0]], ["q", [0, 1]], ["r", [-1, -1]]], 2],
      expected: ["p", "q"],
      desc: "Exclude opposite-direction vector",
      order: 3,
    },
  ]) {
    db.run(
      `INSERT INTO test_cases (id, challenge_id, input, expected_output, description, order_index)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nanoid(),
        challenge6_3_1Id,
        JSON.stringify(tc.input),
        JSON.stringify(tc.expected),
        tc.desc,
        tc.order,
      ]
    );
  }

  // Challenge 6.3.2: Explain vector database scaling
  db.run(
    `INSERT INTO challenges (id, concept_id, type, title, description, starter_code, solution_code, hints, difficulty, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      nanoid(),
      concept6_3Id,
      "explain",
      "How do vector databases scale similarity search?",
      `Explain how vector databases like FAISS handle similarity search at scale, and why brute-force search becomes impractical.

Consider these aspects:
1. **Brute-force limitations** — What happens when you have millions of documents?
2. **Approximate Nearest Neighbors (ANN)** — How do ANN algorithms trade accuracy for speed?
3. **Indexing strategies** — What do IVF and HNSW do at a high level?
4. **Production trade-offs** — How do teams choose between FAISS, Pinecone, ChromaDB, etc.?

Write a clear explanation (3-4 paragraphs).`,
      null,
      `## Brute-Force Limitations

Brute-force nearest-neighbor search compares the query vector against every single document vector in the index. For a collection of n documents with d-dimensional embeddings, this requires n × d multiplications per query. At small scale (thousands of documents), this is fast enough. But at production scale — millions or billions of documents — brute force becomes prohibitively slow. A single query against 10 million 768-dimensional vectors requires ~7.7 billion floating-point operations, making sub-second response times impossible without optimization.

## Approximate Nearest Neighbors

ANN algorithms accept a small accuracy trade-off (typically 95-99% recall) for orders-of-magnitude speed improvements. Instead of checking every vector, they use data structures that quickly narrow the search space. The key insight is that in high-dimensional spaces, vectors that are close together tend to share structural properties that can be indexed. This allows the search to skip most of the database and only examine a small fraction of vectors that are likely to be relevant.

## Indexing Strategies

**IVF (Inverted File Index)** partitions all vectors into clusters using k-means. At query time, only the nearest few clusters are searched instead of the entire database — reducing the search space by 10-100x. **HNSW (Hierarchical Navigable Small World)** builds a multi-layer graph where each layer is a progressively coarser approximation. Queries navigate from the top (coarse) layer down to the bottom (fine) layer, quickly zeroing in on the nearest neighbors. **Product Quantization** compresses vectors from 768 floats (3KB) to ~64 bytes, enabling the entire index to fit in RAM.

## Production Trade-offs

**FAISS** (by Meta) is a library, not a database — it's extremely fast and flexible but requires you to manage persistence, scaling, and updates yourself. It's ideal for batch processing or applications where the index doesn't change frequently. **Pinecone** is a fully managed cloud service — no infrastructure to maintain, automatic scaling, but vendor lock-in and ongoing costs. **ChromaDB** offers a simple Python API similar to a dictionary, making it great for prototyping and small-scale applications. **Weaviate** supports hybrid search (combining vector and keyword search) and schema-aware indexing. Teams typically start with ChromaDB or FAISS for development, then migrate to Pinecone or Weaviate for production workloads that require high availability and automatic scaling.`,
      JSON.stringify([
        "Think about searching 10 million vectors one by one — how long would that take?",
        "ANN algorithms trade perfect accuracy for much faster search — like using an index in a book instead of reading every page",
        "Different vector DBs optimize for different use cases: managed vs self-hosted, scale vs simplicity",
      ]),
      "advanced",
      2,
    ]
  );

  // Concept 6.4: RAG Prompt Engineering
  const concept6_4Id = nanoid();
  db.run(
    `INSERT INTO concepts (id, lesson_id, title, explanation, order_index)
     VALUES (?, ?, ?, ?, ?)`,
    [
      concept6_4Id,
      lesson6Id,
      "RAG Prompt Engineering",
      `# RAG Prompt Engineering

The generation step in RAG constructs a prompt that includes retrieved context and the user's question, then sends it to the LLM. How you format this prompt directly impacts answer quality.

## The Basic Pattern
\`\`\`
[System Instructions]
[Retrieved Context]
[User Question]
[Answer Prefix]
\`\`\`

## Example RAG Prompt
\`\`\`
Answer the question based only on the following context:

Context:
Our return policy allows returns within 30 days of purchase.
Items must be in original condition with tags attached.
---
Refunds are processed within 5-7 business days.

Question: How long do I have to return an item?

Answer:
\`\`\`

## Key Principles

### 1. Ground the LLM
Tell the model to use ONLY the provided context. This reduces hallucination:
\`\`\`
"Use ONLY the provided context to answer."
"If the answer is not in the context, say 'I don't know.'"
\`\`\`

### 2. Separate Chunks Clearly
Use delimiters (\`---\`, numbered sections, or XML tags) between chunks so the LLM can distinguish sources.

### 3. Handle Missing Information
Always include a fallback instruction for when the context doesn't contain the answer.

### 4. Conversational Context
For multi-turn conversations, include chat history so the LLM can resolve references like "it" or "that":
\`\`\`
Chat History:
User: What is your return policy?
Assistant: You can return items within 30 days.

Question: Does that apply to sale items?
\`\`\`

## Common Mistakes
- **No grounding instruction**: Model invents answers not in context
- **No fallback**: Model guesses instead of admitting uncertainty
- **No chunk separation**: Model conflates information from different sources`,
      4,
    ]
  );

  // Challenge 6.4.1: Build a RAG prompt
  const challenge6_4_1Id = nanoid();
  db.run(
    `INSERT INTO challenges (id, concept_id, type, title, description, starter_code, solution_code, hints, difficulty, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      challenge6_4_1Id,
      concept6_4Id,
      "implement",
      "Build a RAG prompt with retrieved context",
      `Create a \`build_rag_prompt\` function that assembles a RAG prompt from a question and retrieved context chunks.

The output format should be:
\`\`\`
Answer the question based only on the following context:

Context:
[chunk 1]
---
[chunk 2]
---
[chunk 3]

Question: [question]

Answer:
\`\`\`

**Rules:**
- Chunks are separated by \`---\` on its own line
- There is no \`---\` after the last chunk
- The prompt ends with \`Answer:\` (so the LLM continues from there)

**Example:**
\`\`\`python
build_rag_prompt("What is Python?", ["Python is a language.", "Python was created by Guido."])
\`\`\``,
      `def build_rag_prompt(question, context_chunks):
    # question: the user's question (string)
    # context_chunks: list of retrieved text chunks (list of strings)
    # Return: the formatted RAG prompt (string)
    pass`,
      `def build_rag_prompt(question, context_chunks):
    context = "\\n---\\n".join(context_chunks)
    return f"""Answer the question based only on the following context:

Context:
{context}

Question: {question}

Answer:"""`,
      JSON.stringify([
        "Join the chunks with '\\n---\\n' as separator between them",
        "Use an f-string or string concatenation to build the full template",
        "The format is: instruction + Context: + chunks + Question: + question + Answer:",
      ]),
      "intermediate",
      1,
    ]
  );

  for (const tc of [
    {
      input: ["What is Python?", ["Python is a language.", "Python was created by Guido."]],
      expected: "Answer the question based only on the following context:\n\nContext:\nPython is a language.\n---\nPython was created by Guido.\n\nQuestion: What is Python?\n\nAnswer:",
      desc: "Two context chunks",
      order: 1,
    },
    {
      input: ["Hi?", ["One chunk."]],
      expected: "Answer the question based only on the following context:\n\nContext:\nOne chunk.\n\nQuestion: Hi?\n\nAnswer:",
      desc: "Single context chunk",
      order: 2,
    },
    {
      input: ["Tell me about returns.", ["Returns within 30 days.", "Must have receipt.", "Refund in 5 days."]],
      expected: "Answer the question based only on the following context:\n\nContext:\nReturns within 30 days.\n---\nMust have receipt.\n---\nRefund in 5 days.\n\nQuestion: Tell me about returns.\n\nAnswer:",
      desc: "Three context chunks",
      order: 3,
    },
  ]) {
    db.run(
      `INSERT INTO test_cases (id, challenge_id, input, expected_output, description, order_index)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nanoid(),
        challenge6_4_1Id,
        JSON.stringify(tc.input),
        JSON.stringify(tc.expected),
        tc.desc,
        tc.order,
      ]
    );
  }

  // Challenge 6.4.2: Build conversational RAG prompt
  const challenge6_4_2Id = nanoid();
  db.run(
    `INSERT INTO challenges (id, concept_id, type, title, description, starter_code, solution_code, hints, difficulty, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      challenge6_4_2Id,
      concept6_4Id,
      "implement",
      "Build a conversational RAG prompt with chat history",
      `Create a \`build_chat_rag_prompt\` function that includes chat history for multi-turn RAG conversations.

The output format should be:
\`\`\`
Answer the question based only on the following context:

Context:
[chunks joined by ---]

Chat History:
User: [message]
Assistant: [message]
...

Question: [question]

Answer:
\`\`\`

If chat_history is empty, omit the Chat History section entirely.

**Example:**
\`\`\`python
history = [("What is your policy?", "Returns within 30 days.")]
build_chat_rag_prompt("Does that apply to sale items?", ["Sale items are final sale."], history)
\`\`\``,
      `def build_chat_rag_prompt(question, context_chunks, chat_history):
    # question: the user's question (string)
    # context_chunks: list of retrieved text chunks
    # chat_history: list of (user_msg, assistant_msg) tuples
    # Return: formatted prompt string
    pass`,
      `def build_chat_rag_prompt(question, context_chunks, chat_history):
    context = "\\n---\\n".join(context_chunks)
    parts = ["Answer the question based only on the following context:", "", "Context:", context]
    if chat_history:
        parts.append("")
        parts.append("Chat History:")
        for user_msg, asst_msg in chat_history:
            parts.append(f"User: {user_msg}")
            parts.append(f"Assistant: {asst_msg}")
    parts.append("")
    parts.append(f"Question: {question}")
    parts.append("")
    parts.append("Answer:")
    return "\\n".join(parts)`,
      JSON.stringify([
        "Start with the same base template as build_rag_prompt",
        "If chat_history is not empty, add a Chat History section with User:/Assistant: lines",
        "Use '\\n'.join(parts) to assemble the final string from a list of lines",
      ]),
      "advanced",
      2,
    ]
  );

  for (const tc of [
    {
      input: [
        "Does that apply to sale items?",
        ["Sale items are final sale."],
        [["What is your policy?", "Returns within 30 days."]],
      ],
      expected: "Answer the question based only on the following context:\n\nContext:\nSale items are final sale.\n\nChat History:\nUser: What is your policy?\nAssistant: Returns within 30 days.\n\nQuestion: Does that apply to sale items?\n\nAnswer:",
      desc: "With one chat history exchange",
      order: 1,
    },
    {
      input: [
        "What is your policy?",
        ["Returns within 30 days.", "Must have receipt."],
        [],
      ],
      expected: "Answer the question based only on the following context:\n\nContext:\nReturns within 30 days.\n---\nMust have receipt.\n\nQuestion: What is your policy?\n\nAnswer:",
      desc: "Empty chat history omits section",
      order: 2,
    },
  ]) {
    db.run(
      `INSERT INTO test_cases (id, challenge_id, input, expected_output, description, order_index)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nanoid(),
        challenge6_4_2Id,
        JSON.stringify(tc.input),
        JSON.stringify(tc.expected),
        tc.desc,
        tc.order,
      ]
    );
  }

  // Concept 6.5: The RAG Pipeline
  const concept6_5Id = nanoid();
  db.run(
    `INSERT INTO concepts (id, lesson_id, title, explanation, order_index)
     VALUES (?, ?, ?, ?, ?)`,
    [
      concept6_5Id,
      lesson6Id,
      "The RAG Pipeline",
      `# The Complete RAG Pipeline

A RAG system connects all the pieces into one pipeline: chunk documents, embed them, store in a vector index, retrieve relevant chunks for a query, inject them into a prompt, and send to the LLM.

## The Flow
\`\`\`
Knowledge Base (PDFs, web pages, docs)
    |
Chunking (split into passages)
    |
Embedding (text → vectors)
    |
Vector Store (index for fast search)
    |
--- at query time ---
    |
User Query → Embed Query
    |
Retrieve top-k similar chunks
    |
Build prompt (context + question)
    |
LLM generates answer
    |
Response to user
\`\`\`

## Offline vs. Online Steps
| Phase | Steps | When |
|-------|-------|------|
| **Indexing** (offline) | Chunk → Embed → Store | Once, when documents change |
| **Retrieval** (online) | Embed query → Search → Build prompt → Generate | Every user query |

## Why RAG?

### vs. Using LLM Alone
- LLMs have a knowledge cutoff date — RAG provides fresh information
- LLMs hallucinate — RAG grounds answers in actual documents
- LLMs can't cite sources — RAG knows which documents were used

### vs. Fine-Tuning
- No retraining needed when documents update
- Works with any LLM (swap models freely)
- Cheaper and faster to set up
- Better for factual, domain-specific Q&A

### When Fine-Tuning Is Better
- Changing model behavior/style (not just knowledge)
- Tasks requiring deep reasoning over the full domain
- Latency-critical applications (no retrieval step)

## Real-World RAG Stack
\`\`\`
Documents → LangChain Loaders → Splitter → Embeddings → FAISS/Pinecone
                                                              |
User Query → Embed → Retrieve → PromptTemplate → LLM → Answer
\`\`\`

This is exactly what project_2's chatbot implements using LangChain, FAISS, and Ollama.`,
      5,
    ]
  );

  // Challenge 6.5.1: Simplified RAG pipeline
  const challenge6_5_1Id = nanoid();
  db.run(
    `INSERT INTO challenges (id, concept_id, type, title, description, starter_code, solution_code, hints, difficulty, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      challenge6_5_1Id,
      concept6_5Id,
      "implement",
      "Implement a simplified RAG retrieval pipeline",
      `Create a \`rag_retrieve\` function that simulates the retrieval side of a RAG pipeline.

Given a query, pre-computed embeddings, and document texts, it should:
1. Find the k nearest document embeddings to the query embedding (using cosine similarity)
2. Look up the corresponding document texts
3. Build and return a RAG prompt with the retrieved context

**Example:**
\`\`\`python
docs = {"d1": "Returns within 30 days.", "d2": "Free shipping over $50.", "d3": "Contact us at help@store.com."}
embeddings = [("d1", [1, 0]), ("d2", [0, 1]), ("d3", [0.5, 0.5])]
query_vec = [1, 0.1]  # Most similar to d1

rag_retrieve("What is the return policy?", query_vec, docs, embeddings, 2)
# Returns a formatted RAG prompt with d1 and d3 as context
\`\`\``,
      `import math

def rag_retrieve(query, query_vec, documents, doc_embeddings, k):
    # query: the user's question (string)
    # query_vec: the query's embedding vector
    # documents: dict mapping doc_id -> text
    # doc_embeddings: list of (doc_id, vector) tuples
    # k: number of documents to retrieve
    # Return: formatted RAG prompt string
    pass`,
      `import math

def rag_retrieve(query, query_vec, documents, doc_embeddings, k):
    def cosine_sim(a, b):
        dot = sum(x * y for x, y in zip(a, b))
        mag_a = math.sqrt(sum(x * x for x in a))
        mag_b = math.sqrt(sum(x * x for x in b))
        if mag_a == 0 or mag_b == 0:
            return 0.0
        return dot / (mag_a * mag_b)

    scored = [(doc_id, cosine_sim(query_vec, vec)) for doc_id, vec in doc_embeddings]
    scored.sort(key=lambda x: x[1], reverse=True)
    top_ids = [doc_id for doc_id, _ in scored[:k]]
    chunks = [documents[doc_id] for doc_id in top_ids]
    context = "\\n---\\n".join(chunks)
    return f"""Answer the question based only on the following context:

Context:
{context}

Question: {query}

Answer:"""`,
      JSON.stringify([
        "Reuse the cosine similarity and nearest-neighbor logic from earlier challenges",
        "Look up each retrieved doc_id in the documents dictionary to get the text",
        "Format using the same RAG prompt template: instruction + context + question + answer prefix",
      ]),
      "advanced",
      1,
    ]
  );

  for (const tc of [
    {
      input: [
        "What is the return policy?",
        [1, 0],
        { d1: "Returns within 30 days.", d2: "Free shipping over $50." },
        [["d1", [1, 0]], ["d2", [0, 1]]],
        1,
      ],
      expected: "Answer the question based only on the following context:\n\nContext:\nReturns within 30 days.\n\nQuestion: What is the return policy?\n\nAnswer:",
      desc: "Retrieve single most relevant document",
      order: 1,
    },
    {
      input: [
        "Tell me about shipping.",
        [0, 1],
        { a: "Ships in 2 days.", b: "Returns OK.", c: "Express available." },
        [["a", [0, 1]], ["b", [1, 0]], ["c", [0.1, 0.9]]],
        2,
      ],
      expected: "Answer the question based only on the following context:\n\nContext:\nShips in 2 days.\n---\nExpress available.\n\nQuestion: Tell me about shipping.\n\nAnswer:",
      desc: "Retrieve two most relevant documents",
      order: 2,
    },
  ]) {
    db.run(
      `INSERT INTO test_cases (id, challenge_id, input, expected_output, description, order_index)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nanoid(),
        challenge6_5_1Id,
        JSON.stringify(tc.input),
        JSON.stringify(tc.expected),
        tc.desc,
        tc.order,
      ]
    );
  }

  // Challenge 6.5.2: Explain RAG vs fine-tuning
  db.run(
    `INSERT INTO challenges (id, concept_id, type, title, description, starter_code, solution_code, hints, difficulty, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      nanoid(),
      concept6_5Id,
      "explain",
      "When should you use RAG vs fine-tuning?",
      `Explain when to use Retrieval-Augmented Generation vs fine-tuning to customize an LLM for a specific domain.

Consider these aspects:
1. **Data freshness** — How often does the knowledge need to update?
2. **Cost and complexity** — What's the setup and maintenance burden?
3. **Accuracy and grounding** — Which approach is more factually reliable?
4. **Use cases** — Give specific examples of when each approach is better.

Write a clear comparison (3-5 paragraphs).`,
      null,
      `## Data Freshness

RAG's biggest advantage is that updating knowledge requires no model retraining. When a company changes its return policy, you update the document in the knowledge base and the RAG system immediately reflects the change. Fine-tuning bakes knowledge into the model's weights during training, so updating information requires a new fine-tuning run — which means collecting new training data, running the training job, evaluating the result, and deploying the updated model. For domains where information changes frequently (support docs, product catalogs, policies), RAG is clearly superior.

## Cost and Complexity

RAG requires setting up a document ingestion pipeline, embedding model, vector store, and retrieval logic, but no GPU-intensive training. A basic RAG system can be built in a day with LangChain and FAISS. Fine-tuning requires curated training data (often hundreds to thousands of examples), GPU compute for training, and careful evaluation to avoid catastrophic forgetting or overfitting. However, once fine-tuned, the model runs without the retrieval overhead, making inference simpler and faster.

## Accuracy and Grounding

RAG produces answers grounded in actual documents, which means you can trace every answer back to its source — crucial for applications where accuracy and auditability matter (legal, medical, financial). Fine-tuned models generate from their learned weights, making it impossible to pinpoint where a specific answer came from. However, fine-tuned models can develop deeper understanding of domain-specific patterns, terminology, and reasoning, which RAG alone may miss if the right document isn't retrieved.

## When to Use Each

**Choose RAG** for: customer support bots (grounded in policy docs), internal knowledge bases, research assistants, any application where you need citations, and domains where information updates frequently.

**Choose fine-tuning** for: changing the model's style or tone (e.g., writing like a specific brand), teaching new skills or reasoning patterns (e.g., code review, medical diagnosis), reducing latency (no retrieval step), and tasks where the full domain context is needed rather than specific document passages.

**Combine both** for the best results: fine-tune a model for your domain's style and reasoning, then use RAG to provide it with specific, up-to-date facts. This hybrid approach is increasingly common in production systems.`,
      JSON.stringify([
        "Think about what happens when your company updates its refund policy — which approach handles that more easily?",
        "Fine-tuning trains knowledge into weights; RAG looks it up at query time",
        "Can you always find the right document with retrieval? What if the answer requires reasoning across many documents?",
      ]),
      "advanced",
      2,
    ]
  );

  // ============================================
  // LESSON 7: TOOL CALLING
  // ============================================
  const lesson7Id = nanoid();
  db.run(
    `INSERT INTO lessons (id, title, slug, description, order_index, is_published)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      lesson7Id,
      "Tool Calling",
      "tool-calling",
      "Learn how to give LLMs the ability to call external tools and functions. Covers manual parsing, function schemas, and framework approaches.",
      7,
      1,
    ]
  );

  // Concept 7.1: Manual Tool Calling
  const concept7_1Id = nanoid();
  db.run(
    `INSERT INTO concepts (id, lesson_id, title, explanation, order_index)
     VALUES (?, ?, ?, ?, ?)`,
    [
      concept7_1Id,
      lesson7Id,
      "Manual Tool Calling",
      `# Manual Tool Calling

LLMs generate text — they can't natively run code, query databases, or call APIs. **Tool calling** bridges this gap by teaching the model to *request* that an external function be executed on its behalf.

## The Pattern

Without native tool-calling support (common in smaller or open-source models), you instruct the LLM via the system prompt to output a special marker when it wants to use a tool:

\`\`\`
System: You have access to these tools:
- get_weather(city: str) -> str
- search_web(query: str) -> str

When you need a tool, output EXACTLY:
TOOL_CALL: {"name": "tool_name", "args": {"param": "value"}}
\`\`\`

## The Execution Flow

1. **User query** → "What's the weather in NYC?"
2. **LLM generates** → "I'll check the weather for you. TOOL_CALL: {\\"name\\": \\"get_weather\\", \\"args\\": {\\"city\\": \\"NYC\\"}}"
3. **Your code parses** the TOOL_CALL from the output using regex
4. **Execute the function** → \`get_weather("NYC")\` returns "72°F, sunny"
5. **Feed result back** to the LLM as a new message
6. **LLM responds** → "It's currently 72°F and sunny in NYC!"

## Parsing with Regex

\`\`\`python
import re, json

pattern = r'TOOL_CALL:\\s*(\\{.*\\})'
match = re.search(pattern, text)
if match:
    tool_call = json.loads(match.group(1))
    # {"name": "get_weather", "args": {"city": "NYC"}}
\`\`\`

## Key Insight

The LLM never actually *calls* anything. It produces structured text that your code interprets and acts on. You are the executor — the LLM is the decision-maker.`,
      1,
    ]
  );

  // Challenge 7.1.1: Parse tool calls from LLM output
  const challenge7_1_1Id = nanoid();
  db.run(
    `INSERT INTO challenges (id, concept_id, type, title, description, starter_code, solution_code, hints, difficulty, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      challenge7_1_1Id,
      concept7_1Id,
      "implement",
      "Parse tool calls from LLM output",
      `Implement a \`parse_tool_call\` function that extracts a tool call from LLM-generated text.

The function should:
- Search for the pattern \`TOOL_CALL: {"name": "...", "args": {...}}\` in the text
- Parse the JSON object after "TOOL_CALL:"
- Return a dict with \`"name"\` and \`"args"\` keys
- Return \`None\` if no tool call is found

**Example:**
\`\`\`python
text = 'I\\'ll look that up. TOOL_CALL: {"name": "search", "args": {"query": "python"}}'
parse_tool_call(text)
# => {"name": "search", "args": {"query": "python"}}
\`\`\``,
      `import re
import json

def parse_tool_call(text):
    # Your code here
    pass`,
      `import re
import json

def parse_tool_call(text):
    pattern = r'TOOL_CALL:\\s*(\\{.*\\})'
    match = re.search(pattern, text)
    if not match:
        return None
    try:
        tool_call = json.loads(match.group(1))
        return tool_call
    except json.JSONDecodeError:
        return None`,
      JSON.stringify([
        "Use re.search() with a pattern that matches 'TOOL_CALL:' followed by a JSON object",
        "The regex pattern r'TOOL_CALL:\\s*({.*})' will capture the JSON string",
        "Use json.loads() on the captured group to parse the JSON",
        "Wrap the JSON parsing in a try/except to handle malformed JSON",
      ]),
      "beginner",
      1,
    ]
  );

  // Test cases for parse_tool_call
  for (const tc of [
    {
      input: ["I'll check the weather. TOOL_CALL: {\"name\": \"get_weather\", \"args\": {\"city\": \"NYC\"}}"],
      expected: { name: "get_weather", args: { city: "NYC" } },
      desc: "Simple tool call in middle of text",
      order: 1,
    },
    {
      input: ["I don't need any tools for this."],
      expected: null,
      desc: "No tool call present",
      order: 2,
    },
    {
      input: ["TOOL_CALL: {\"name\": \"search\", \"args\": {\"query\": \"python\"}}"],
      expected: { name: "search", args: { query: "python" } },
      desc: "Tool call at start of text",
      order: 3,
    },
    {
      input: ["Let me calculate. TOOL_CALL: {\"name\": \"calculate\", \"args\": {\"a\": 5, \"b\": 3, \"op\": \"add\"}}"],
      expected: { name: "calculate", args: { a: 5, b: 3, op: "add" } },
      desc: "Tool call with multiple args",
      order: 4,
    },
  ]) {
    db.run(
      `INSERT INTO test_cases (id, challenge_id, input, expected_output, description, order_index)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nanoid(),
        challenge7_1_1Id,
        JSON.stringify(tc.input),
        JSON.stringify(tc.expected),
        tc.desc,
        tc.order,
      ]
    );
  }

  // Challenge 7.1.2: Execute a tool from a parsed tool call
  const challenge7_1_2Id = nanoid();
  db.run(
    `INSERT INTO challenges (id, concept_id, type, title, description, starter_code, solution_code, hints, difficulty, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      challenge7_1_2Id,
      concept7_1Id,
      "implement",
      "Execute a tool from a parsed tool call",
      `Implement an \`execute_tool\` function that looks up and calls a tool from a registry.

The function should:
- Accept a \`tool_call\` dict with \`"name"\` and \`"args"\` keys
- Accept a \`tool_registry\` dict mapping tool names to callable functions
- Look up the tool by name in the registry
- Call the tool with the args as keyword arguments
- Return the tool's return value
- Raise a \`ValueError\` with message \`"Unknown tool: {name}"\` if the tool is not found

**Example:**
\`\`\`python
def add(a, b):
    return a + b

registry = {"add": add}
execute_tool({"name": "add", "args": {"a": 2, "b": 3}}, registry)
# => 5
\`\`\``,
      `def execute_tool(tool_call, tool_registry):
    # Your code here
    pass`,
      `def execute_tool(tool_call, tool_registry):
    name = tool_call["name"]
    args = tool_call["args"]
    if name not in tool_registry:
        raise ValueError(f"Unknown tool: {name}")
    return tool_registry[name](**args)`,
      JSON.stringify([
        "Extract the 'name' and 'args' from the tool_call dict",
        "Check if the tool name exists in the registry before calling it",
        "Use **kwargs syntax to pass the args dict as keyword arguments: fn(**args)",
        "Raise ValueError if the tool name isn't in the registry",
      ]),
      "intermediate",
      2,
    ]
  );

  // Test cases for execute_tool
  for (const tc of [
    {
      input: [
        { name: "add", args: { a: 2, b: 3 } },
        "__REGISTRY_PLACEHOLDER__",
      ],
      expected: 5,
      desc: "Valid tool call with simple function",
      order: 1,
    },
    {
      input: [
        { name: "unknown_tool", args: {} },
        "__REGISTRY_PLACEHOLDER__",
      ],
      expected: "ValueError",
      desc: "Unknown tool raises ValueError",
      order: 2,
    },
    {
      input: [
        { name: "multiply", args: { x: 4, y: 7 } },
        "__REGISTRY_PLACEHOLDER__",
      ],
      expected: 28,
      desc: "Tool with multiple args",
      order: 3,
    },
    {
      input: [
        { name: "greet", args: {} },
        "__REGISTRY_PLACEHOLDER__",
      ],
      expected: "hello",
      desc: "Tool with no args",
      order: 4,
    },
  ]) {
    db.run(
      `INSERT INTO test_cases (id, challenge_id, input, expected_output, description, order_index)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nanoid(),
        challenge7_1_2Id,
        JSON.stringify(tc.input),
        JSON.stringify(tc.expected),
        tc.desc,
        tc.order,
      ]
    );
  }

  // Concept 7.2: Function Schemas
  const concept7_2Id = nanoid();
  db.run(
    `INSERT INTO concepts (id, lesson_id, title, explanation, order_index)
     VALUES (?, ?, ?, ?, ?)`,
    [
      concept7_2Id,
      lesson7Id,
      "Function Schemas",
      `# Function Schemas

For an LLM to call a function correctly, it needs to know the function's **name**, **description**, **parameters**, and their **types**. This metadata is called a **function schema** — it's the "menu" the model reads to decide which tool to use and how to call it.

## Why Schemas Matter

Without a schema, you'd have to describe every function in the system prompt as free text. Schemas provide a standardized, machine-readable format that:

- Tells the LLM exactly what parameters are expected
- Specifies the type of each parameter (string, integer, etc.)
- Indicates which parameters are optional (have defaults)
- Provides a description of what the function does

## The Standard Format

Most frameworks (OpenAI, LangChain, Anthropic) use a JSON Schema-based format:

\`\`\`json
{
  "name": "get_weather",
  "description": "Get the current weather for a city",
  "parameters": {
    "type": "object",
    "properties": {
      "city": {
        "type": "string"
      },
      "units": {
        "type": "string",
        "default": "fahrenheit"
      }
    }
  }
}
\`\`\`

## Auto-Generating Schemas from Python

Python's \`inspect\` module lets you extract parameter names, type hints, and defaults from any function:

\`\`\`python
import inspect

def get_weather(city: str, units: str = "fahrenheit"):
    """Get the current weather for a city"""
    ...

sig = inspect.signature(get_weather)
for name, param in sig.parameters.items():
    print(f"{name}: {param.annotation}, default={param.default}")
# city: <class 'str'>, default=<class 'inspect._empty'>
# units: <class 'str'>, default=fahrenheit
\`\`\`

## Type Mapping

Python types map to JSON Schema types:
| Python | JSON Schema |
|--------|------------|
| \`str\`  | \`"string"\` |
| \`int\`  | \`"integer"\` |
| \`float\` | \`"number"\` |
| \`bool\` | \`"boolean"\` |`,
      2,
    ]
  );

  // Challenge 7.2.1: Build a function schema generator
  const challenge7_2_1Id = nanoid();
  db.run(
    `INSERT INTO challenges (id, concept_id, type, title, description, starter_code, solution_code, hints, difficulty, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      challenge7_2_1Id,
      concept7_2Id,
      "implement",
      "Build a function schema generator",
      `Implement a \`to_schema\` function that auto-generates a JSON-serializable schema dict from a Python function.

The function should:
- Extract the function's name via \`fn.__name__\`
- Extract the docstring via \`fn.__doc__\` (use \`""\` if None)
- Use \`inspect.signature()\` to get parameters
- Map type hints to JSON Schema types: \`str\`→\`"string"\`, \`int\`→\`"integer"\`, \`float\`→\`"number"\`, \`bool\`→\`"boolean"\`
- Include \`"default"\` in a parameter's dict if it has a default value
- Omit the \`"type"\` key for parameters with no type hint

**Return format:**
\`\`\`python
{
  "name": "fn_name",
  "description": "docstring",
  "parameters": {
    "type": "object",
    "properties": {
      "param_name": {"type": "string"},
      "other_param": {"type": "integer", "default": 10}
    }
  }
}
\`\`\``,
      `import inspect

def to_schema(fn):
    # Your code here
    pass`,
      `import inspect

def to_schema(fn):
    type_map = {str: "string", int: "integer", float: "number", bool: "boolean"}
    sig = inspect.signature(fn)
    properties = {}
    for name, param in sig.parameters.items():
        prop = {}
        if param.annotation != inspect.Parameter.empty:
            mapped = type_map.get(param.annotation)
            if mapped:
                prop["type"] = mapped
        if param.default != inspect.Parameter.empty:
            prop["default"] = param.default
        properties[name] = prop
    return {
        "name": fn.__name__,
        "description": fn.__doc__ or "",
        "parameters": {
            "type": "object",
            "properties": properties,
        },
    }`,
      JSON.stringify([
        "Use inspect.signature(fn) to get the function's parameters",
        "Check param.annotation != inspect.Parameter.empty to see if a type hint exists",
        "Map Python types to JSON Schema types: str→'string', int→'integer', float→'number', bool→'boolean'",
        "Check param.default != inspect.Parameter.empty to see if a default exists",
      ]),
      "intermediate",
      1,
    ]
  );

  // Test cases for to_schema
  for (const tc of [
    {
      input: ["__FN_simple_greet__"],
      expected: {
        name: "greet",
        description: "Say hello",
        parameters: {
          type: "object",
          properties: {
            name: { type: "string" },
          },
        },
      },
      desc: "Simple function with str param and docstring",
      order: 1,
    },
    {
      input: ["__FN_with_default__"],
      expected: {
        name: "repeat",
        description: "",
        parameters: {
          type: "object",
          properties: {
            text: { type: "string" },
            times: { type: "integer", default: 2 },
          },
        },
      },
      desc: "Function with int param and default value",
      order: 2,
    },
    {
      input: ["__FN_multi_param__"],
      expected: {
        name: "calculate",
        description: "Do math",
        parameters: {
          type: "object",
          properties: {
            a: { type: "number" },
            b: { type: "number" },
            round_result: { type: "boolean", default: false },
          },
        },
      },
      desc: "Function with multiple params and docstring",
      order: 3,
    },
    {
      input: ["__FN_no_hints__"],
      expected: {
        name: "process",
        description: "",
        parameters: {
          type: "object",
          properties: {
            data: {},
          },
        },
      },
      desc: "Function with no type hints omits 'type' key",
      order: 4,
    },
  ]) {
    db.run(
      `INSERT INTO test_cases (id, challenge_id, input, expected_output, description, order_index)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nanoid(),
        challenge7_2_1Id,
        JSON.stringify(tc.input),
        JSON.stringify(tc.expected),
        tc.desc,
        tc.order,
      ]
    );
  }

  // Challenge 7.2.2: Explain JSON function schemas
  db.run(
    `INSERT INTO challenges (id, concept_id, type, title, description, starter_code, solution_code, hints, difficulty, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      nanoid(),
      concept7_2Id,
      "explain",
      "Why do LLMs need structured function schemas?",
      `Explain why LLMs need structured JSON function schemas instead of just knowing function names.

Consider these aspects:
1. **Parameter precision** — How does a schema help the LLM provide correct arguments?
2. **Type safety** — Why does specifying types matter?
3. **Standardization** — Why is a common format valuable across different models and frameworks?
4. **Validation** — How do schemas enable automatic input validation?

Write a clear explanation (3-4 paragraphs).`,
      null,
      `## Parameter Precision

A function name alone — like "get_weather" — tells the LLM *what* to call but nothing about *how* to call it. Without a schema, the model would have to guess parameter names and formats. Should it pass "New York", "new_york", or "NYC"? Is the parameter called "city", "location", or "place"? A schema eliminates this ambiguity by listing every parameter by name, so the model knows exactly what keys to include in its function call.

## Type Safety

JSON schemas specify the expected type of each parameter — string, integer, number, boolean. This matters because an LLM generating a tool call might output "5" (a string) when the function expects 5 (an integer). With type information in the schema, the model can produce correctly-typed values, and your code can validate inputs before passing them to the function. This catches errors early rather than letting them propagate into function execution.

## Standardization Across Ecosystems

Without a standard schema format, every LLM provider and framework would define its own way of describing tools — and they'd all be incompatible. The JSON Schema-based format (used by OpenAI, Anthropic, LangChain, and others) provides a universal "language" for describing functions. This means you can define your tools once and use them across different models and frameworks without rewriting your tool definitions.

## Automatic Validation

Schemas enable a validation layer between the LLM's output and your function execution. Before calling a function, you can programmatically verify that all required parameters are present, types match expectations, and values fall within acceptable ranges. This is impossible with unstructured tool descriptions. The schema acts as a contract — if the LLM's output doesn't match the schema, you can reject it and ask the model to try again, rather than passing bad data to your functions.`,
      JSON.stringify([
        "Think about what happens when the LLM only knows a function name but not its parameters",
        "Consider how different LLM providers (OpenAI, Anthropic) use the same schema format",
        "Schemas let you validate the LLM's output before executing anything",
      ]),
      "beginner",
      2,
    ]
  );

  // Concept 7.3: Framework Tool Calling
  const concept7_3Id = nanoid();
  db.run(
    `INSERT INTO concepts (id, lesson_id, title, explanation, order_index)
     VALUES (?, ?, ?, ?, ?)`,
    [
      concept7_3Id,
      lesson7Id,
      "Framework Tool Calling",
      `# Framework Tool Calling

Modern LLM frameworks like LangChain abstract away the manual work of tool calling — no regex parsing, no system prompt engineering, no JSON extraction. You define a function, decorate it, and the framework handles the rest.

## The @tool Decorator

LangChain's \`@tool\` decorator auto-generates a JSON schema from your function's signature and docstring:

\`\`\`python
from langchain_core.tools import tool

@tool
def get_weather(city: str) -> str:
    """Get the current weather for a city."""
    return f"72°F in {city}"

# Automatically generates:
# {"name": "get_weather", "description": "Get the current weather...", ...}
\`\`\`

## Native Tool Calling

Larger models (3B+ parameters) support **native tool calling** — the model outputs structured JSON tool calls directly, without needing the TOOL_CALL regex pattern. The framework sends the schemas to the model's API, and the model returns structured responses:

\`\`\`python
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4o")
llm_with_tools = llm.bind_tools([get_weather])
response = llm_with_tools.invoke("What's the weather in NYC?")
# response.tool_calls = [{"name": "get_weather", "args": {"city": "NYC"}}]
\`\`\`

## Manual vs Framework Comparison

| Aspect | Manual | Framework |
|--------|--------|-----------|
| Schema generation | Write JSON by hand | Auto from function signature |
| Tool call parsing | Regex on LLM output | Structured API response |
| Error handling | DIY | Built-in retry and validation |
| Model compatibility | Any text-generating model | Models with tool-calling API |
| Control | Full control | Opinionated defaults |

## When to Use Each

- **Manual**: Small open-source models without tool-calling support, custom protocols, learning purposes
- **Framework**: Production applications, models with native tool support (GPT-4, Claude, Gemini), rapid development`,
      3,
    ]
  );

  // Challenge 7.3.1: Build a tool registry class
  const challenge7_3_1Id = nanoid();
  db.run(
    `INSERT INTO challenges (id, concept_id, type, title, description, starter_code, solution_code, hints, difficulty, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      challenge7_3_1Id,
      concept7_3Id,
      "implement",
      "Build a tool registry class",
      `Implement a \`ToolRegistry\` class that manages a collection of tools.

The class should have:
- \`register(name, fn, description)\` — adds a tool to the registry
- \`get_schemas()\` — returns a list of schema dicts for all registered tools
- \`call(name, **kwargs)\` — calls a registered tool by name with keyword arguments

Each schema dict should have:
\`\`\`python
{"name": str, "description": str, "parameters": [list of param names]}
\`\`\`

Raise \`KeyError\` with message \`"Tool not found: {name}"\` if \`call()\` is used with an unregistered tool name.

**Example:**
\`\`\`python
registry = ToolRegistry()

def add(a, b):
    return a + b

registry.register("add", add, "Add two numbers")
registry.get_schemas()
# => [{"name": "add", "description": "Add two numbers", "parameters": ["a", "b"]}]
registry.call("add", a=2, b=3)
# => 5
\`\`\``,
      `import inspect

class ToolRegistry:
    # Your code here
    pass`,
      `import inspect

class ToolRegistry:
    def __init__(self):
        self._tools = {}

    def register(self, name, fn, description):
        self._tools[name] = {"fn": fn, "description": description}

    def get_schemas(self):
        schemas = []
        for name, tool in self._tools.items():
            params = list(inspect.signature(tool["fn"]).parameters.keys())
            schemas.append({
                "name": name,
                "description": tool["description"],
                "parameters": params,
            })
        return schemas

    def call(self, name, **kwargs):
        if name not in self._tools:
            raise KeyError(f"Tool not found: {name}")
        return self._tools[name]["fn"](**kwargs)`,
      JSON.stringify([
        "Store tools in a dictionary with name as key, and fn + description as values",
        "Use inspect.signature(fn).parameters.keys() to get parameter names",
        "get_schemas() should iterate over all registered tools and build the schema list",
        "call() should look up the tool and use **kwargs to pass arguments",
      ]),
      "intermediate",
      1,
    ]
  );

  // Test cases for ToolRegistry
  for (const tc of [
    {
      input: ["__REGISTRY_ONE_TOOL__"],
      expected: [{ name: "add", description: "Add numbers", parameters: ["a", "b"] }],
      desc: "Register one tool and get schemas",
      order: 1,
    },
    {
      input: ["__REGISTRY_CALL__", "add", { a: 10, b: 20 }],
      expected: 30,
      desc: "Call a registered tool by name",
      order: 2,
    },
    {
      input: ["__REGISTRY_CALL_UNKNOWN__", "unknown"],
      expected: "KeyError",
      desc: "Call unregistered tool raises KeyError",
      order: 3,
    },
    {
      input: ["__REGISTRY_TWO_TOOLS__"],
      expected: [
        { name: "add", description: "Add numbers", parameters: ["a", "b"] },
        { name: "greet", description: "Say hello", parameters: ["name"] },
      ],
      desc: "Register two tools and get correct schemas with parameter names",
      order: 4,
    },
  ]) {
    db.run(
      `INSERT INTO test_cases (id, challenge_id, input, expected_output, description, order_index)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nanoid(),
        challenge7_3_1Id,
        JSON.stringify(tc.input),
        JSON.stringify(tc.expected),
        tc.desc,
        tc.order,
      ]
    );
  }

  // ============================================
  // LESSON 8: AI AGENTS
  // ============================================
  const lesson8Id = nanoid();
  db.run(
    `INSERT INTO lessons (id, title, slug, description, order_index, is_published)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      lesson8Id,
      "AI Agents",
      "ai-agents",
      "Understand how AI agents use reasoning and tool calling to solve complex, multi-step problems. Covers the ReAct pattern, search agents, and the Model Context Protocol.",
      8,
      1,
    ]
  );

  // Concept 8.1: The ReAct Pattern
  const concept8_1Id = nanoid();
  db.run(
    `INSERT INTO concepts (id, lesson_id, title, explanation, order_index)
     VALUES (?, ?, ?, ?, ?)`,
    [
      concept8_1Id,
      lesson8Id,
      "The ReAct Pattern",
      `# The ReAct Pattern

**ReAct** (Reasoning + Acting) is the foundational pattern behind most AI agents. Instead of generating a single response, the agent runs in a **loop** — thinking, acting, and observing — until it has enough information to answer.

## The Loop

\`\`\`
while not done:
    1. THOUGHT  → The LLM reasons about what to do next
    2. ACTION   → The LLM decides to use a tool OR give a final answer
    3. OBSERVATION → The tool result is fed back to the LLM
\`\`\`

## Example Trace

\`\`\`
User: What's the population of the capital of France?

Thought: I need to find the capital of France first.
Action: search_web("capital of France")
Observation: Paris is the capital of France.

Thought: Now I need the population of Paris.
Action: search_web("population of Paris")
Observation: The population of Paris is approximately 2.1 million.

Thought: I now have enough information to answer.
FINAL ANSWER: The population of Paris, the capital of France, is approximately 2.1 million.
\`\`\`

## Why It Works

The key insight is that agents can **chain multiple tool calls** to solve problems that require intermediate steps. A single LLM call can't look up two facts and combine them — but a ReAct loop can, because each observation becomes context for the next reasoning step.

## Decision Points

At each step, the agent decides between:
- **Tool call**: "I need more information" → call a tool, get the result, continue
- **Final answer**: "I have enough information" → stop the loop, respond to the user

## Implementation Pattern

\`\`\`python
messages = [system_prompt, user_message]
while True:
    response = llm.invoke(messages)
    if response.has_tool_calls():
        result = execute_tool(response.tool_call)
        messages.append(tool_result_message(result))
    else:
        return response.content  # Final answer
\`\`\``,
      1,
    ]
  );

  // Challenge 8.1.1: Implement a ReAct reasoning step
  const challenge8_1_1Id = nanoid();
  db.run(
    `INSERT INTO challenges (id, concept_id, type, title, description, starter_code, solution_code, hints, difficulty, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      challenge8_1_1Id,
      concept8_1Id,
      "implement",
      "Implement a ReAct reasoning step",
      `Implement a \`react_step\` function that parses a single step of a ReAct reasoning loop.

The function should:
- Accept a \`thought\` string and a list of \`available_tools\` (tool name strings)
- Check if the thought contains \`"FINAL ANSWER:"\` — if so, return a finish result with everything after it (stripped)
- Check if the thought contains \`"ACTION:"\` followed by a tool name from \`available_tools\` — if so, return a tool_call result with the tool name and the remaining text as input (stripped)
- Otherwise, return a continue result

**Return format:**
\`\`\`python
# Final answer:
{"action": "finish", "result": "the answer text"}

# Tool call:
{"action": "tool_call", "tool": "tool_name", "input": "the input text"}

# Continue thinking:
{"action": "continue", "thought": "original thought"}
\`\`\``,
      `def react_step(thought, available_tools):
    # Your code here
    pass`,
      `def react_step(thought, available_tools):
    if "FINAL ANSWER:" in thought:
        result = thought.split("FINAL ANSWER:", 1)[1].strip()
        return {"action": "finish", "result": result}
    if "ACTION:" in thought:
        after_action = thought.split("ACTION:", 1)[1].strip()
        for tool in available_tools:
            if after_action.startswith(tool):
                tool_input = after_action[len(tool):].strip()
                return {"action": "tool_call", "tool": tool, "input": tool_input}
    return {"action": "continue", "thought": thought}`,
      JSON.stringify([
        "Check for 'FINAL ANSWER:' first — use str.split('FINAL ANSWER:', 1) to get the text after it",
        "For 'ACTION:', split on it, then check if the remaining text starts with any tool name",
        "Use str.startswith(tool_name) to match the tool, then slice off the tool name to get the input",
        "If no FINAL ANSWER or valid ACTION is found, return a 'continue' action",
      ]),
      "advanced",
      1,
    ]
  );

  // Test cases for react_step
  for (const tc of [
    {
      input: [
        "Based on the search, FINAL ANSWER: Paris is the capital",
        ["search_web", "calculator"],
      ],
      expected: { action: "finish", result: "Paris is the capital" },
      desc: "Final answer is extracted correctly",
      order: 1,
    },
    {
      input: [
        "I need to search. ACTION: search_web query about python",
        ["search_web", "calculator"],
      ],
      expected: { action: "tool_call", tool: "search_web", input: "query about python" },
      desc: "Tool call with input is parsed correctly",
      order: 2,
    },
    {
      input: [
        "Let me think about this more",
        ["search_web", "calculator"],
      ],
      expected: { action: "continue", thought: "Let me think about this more" },
      desc: "Continue when no action markers found",
      order: 3,
    },
    {
      input: [
        "ACTION: invalid_tool test input",
        ["search_web", "calculator"],
      ],
      expected: { action: "continue", thought: "ACTION: invalid_tool test input" },
      desc: "Invalid tool name results in continue",
      order: 4,
    },
  ]) {
    db.run(
      `INSERT INTO test_cases (id, challenge_id, input, expected_output, description, order_index)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nanoid(),
        challenge8_1_1Id,
        JSON.stringify(tc.input),
        JSON.stringify(tc.expected),
        tc.desc,
        tc.order,
      ]
    );
  }

  // Challenge 8.1.2: Explain the ReAct pattern
  db.run(
    `INSERT INTO challenges (id, concept_id, type, title, description, starter_code, solution_code, hints, difficulty, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      nanoid(),
      concept8_1Id,
      "explain",
      "Explain the ReAct pattern",
      `Explain what the ReAct (Reasoning + Acting) pattern is and why it's important for AI agents.

Consider these aspects:
1. **The loop** — How does the Thought → Action → Observation cycle work?
2. **Decision-making** — When should an agent use a tool vs give a final answer?
3. **Advantages** — Why is ReAct better than a single LLM call for complex tasks?
4. **Limitations** — What can go wrong with ReAct agents?

Write a clear explanation (3-4 paragraphs).`,
      null,
      `## The ReAct Loop

ReAct stands for Reasoning + Acting, and it describes the core loop that powers most AI agents. Instead of generating a single response to a question, a ReAct agent operates in a cycle: it first *thinks* about what it knows and what it needs (the Thought step), then *decides* on an action to take (the Action step — either calling a tool or providing a final answer), and finally *observes* the result (the Observation step — the tool's output gets added to the conversation). This cycle repeats until the agent decides it has enough information to answer the original question.

## Decision-Making

At each step, the agent faces a binary choice: use a tool to gather more information, or commit to a final answer. A well-designed agent uses tools when the current context is insufficient — for example, if asked "What's the weather in Tokyo?" and it doesn't have real-time data, it should call a weather API rather than hallucinate. Conversely, when the conversation history already contains everything needed to answer, the agent should stop looping and respond. Poor decision-making — like calling unnecessary tools or answering prematurely — is one of the main failure modes of agents.

## Advantages Over Single-Call LLMs

A single LLM call is stateless — it can only use what's in its context window. ReAct agents can gather information dynamically, chaining multiple tool calls to solve multi-step problems. "What's the population of the capital of France?" requires two lookups (find the capital, then find its population), which a single call can't do but a ReAct loop handles naturally. The reasoning trace also provides transparency: you can inspect each Thought to understand *why* the agent took certain actions, making debugging much easier.

## Limitations

ReAct agents can get stuck in loops — repeatedly calling the same tool with the same input, or oscillating between two actions without converging on an answer. They can also "hallucinate actions," generating tool calls that don't match any available tool. Each loop iteration costs latency and tokens, so complex questions requiring many steps can be slow and expensive. Setting maximum iteration limits and implementing fallback behaviors (like forcing a final answer after N steps) are essential safeguards in production systems.`,
      JSON.stringify([
        "Think about what happens when a question requires two separate pieces of information",
        "Consider how the agent decides between 'I need more info' vs 'I can answer now'",
        "What happens if the agent gets stuck in a loop calling the same tool repeatedly?",
      ]),
      "beginner",
      2,
    ]
  );

  // Concept 8.2: Web Search Agents
  const concept8_2Id = nanoid();
  db.run(
    `INSERT INTO concepts (id, lesson_id, title, explanation, order_index)
     VALUES (?, ?, ?, ?, ?)`,
    [
      concept8_2Id,
      lesson8Id,
      "Web Search Agents",
      `# Web Search Agents

A web search agent is the most practical example of the ReAct pattern: an LLM that can search the internet to answer questions it doesn't know the answer to.

## The Architecture

\`\`\`
User Query
    ↓
Agent (LLM) ←→ Search Tool (DuckDuckGo, Google, etc.)
    ↓
Formatted Answer
\`\`\`

## Multi-Step Reasoning with Search

The agent doesn't just search once — it can reason about results and search again:

\`\`\`
User: "Compare the GDP of the two largest EU countries"

Thought: I need to find the two largest EU countries by population first.
Action: search("largest EU countries by population")
Observation: Germany (83M) and France (67M) are the largest.

Thought: Now I need the GDP of Germany.
Action: search("Germany GDP 2024")
Observation: Germany's GDP is approximately $4.5 trillion.

Thought: Now I need France's GDP.
Action: search("France GDP 2024")
Observation: France's GDP is approximately $3.0 trillion.

FINAL ANSWER: Germany ($4.5T) has a ~50% larger GDP than France ($3.0T).
\`\`\`

## Formatting Results for the LLM

Raw search results are messy HTML. Before feeding results to the LLM, you need to format them into clean, readable text:

\`\`\`python
def format_results(results):
    formatted = []
    for i, r in enumerate(results, 1):
        formatted.append(f"{i}. **{r['title']}**")
        formatted.append(f"   URL: {r['url']}")
        formatted.append(f"   {r['snippet']}")
    return "\\n\\n".join(formatted)
\`\`\`

## Result Ranking

Not all search results are equally relevant. Scoring results by how many query terms appear in the title and snippet helps the agent focus on the most useful information.`,
      2,
    ]
  );

  // Challenge 8.2.1: Format search results for an LLM
  const challenge8_2_1Id = nanoid();
  db.run(
    `INSERT INTO challenges (id, concept_id, type, title, description, starter_code, solution_code, hints, difficulty, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      challenge8_2_1Id,
      concept8_2Id,
      "implement",
      "Format search results for an LLM",
      `Implement a \`format_results\` function that takes a list of search result dicts and returns a formatted string.

Each result dict has: \`{"title": str, "url": str, "snippet": str}\`

The function should:
- Number each result starting from 1
- Format each result as: \`"{n}. **{title}**\\n   URL: {url}\\n   {snippet}"\`
- Separate results with a blank line (\`"\\n\\n"\`)
- Return \`"No results found."\` for an empty list

**Example:**
\`\`\`python
results = [{"title": "Python Docs", "url": "https://python.org", "snippet": "Official docs"}]
format_results(results)
# => '1. **Python Docs**\\n   URL: https://python.org\\n   Official docs'
\`\`\``,
      `def format_results(results):
    # Your code here
    pass`,
      `def format_results(results):
    if not results:
        return "No results found."
    formatted = []
    for i, r in enumerate(results, 1):
        entry = f"{i}. **{r['title']}**\\n   URL: {r['url']}\\n   {r['snippet']}"
        formatted.append(entry)
    return "\\n\\n".join(formatted)`,
      JSON.stringify([
        "Check for empty list first and return the special message",
        "Use enumerate(results, 1) to get 1-based numbering",
        "Build each entry as a multi-line string with the number, title, URL, and snippet",
        "Join all entries with '\\n\\n' for blank line separation",
      ]),
      "beginner",
      1,
    ]
  );

  // Test cases for format_results
  for (const tc of [
    {
      input: [[{ title: "Python Docs", url: "https://python.org", snippet: "Official Python documentation" }]],
      expected: "1. **Python Docs**\n   URL: https://python.org\n   Official Python documentation",
      desc: "Single result formatted correctly",
      order: 1,
    },
    {
      input: [[
        { title: "First Result", url: "https://example.com/1", snippet: "First snippet" },
        { title: "Second Result", url: "https://example.com/2", snippet: "Second snippet" },
      ]],
      expected: "1. **First Result**\n   URL: https://example.com/1\n   First snippet\n\n2. **Second Result**\n   URL: https://example.com/2\n   Second snippet",
      desc: "Multiple results numbered and separated",
      order: 2,
    },
    {
      input: [[]],
      expected: "No results found.",
      desc: "Empty list returns no results message",
      order: 3,
    },
    {
      input: [[{ title: "Tom & Jerry's \"Show\"", url: "https://example.com", snippet: "Special <chars> & more" }]],
      expected: "1. **Tom & Jerry's \"Show\"**\n   URL: https://example.com\n   Special <chars> & more",
      desc: "Special characters handled correctly",
      order: 4,
    },
  ]) {
    db.run(
      `INSERT INTO test_cases (id, challenge_id, input, expected_output, description, order_index)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nanoid(),
        challenge8_2_1Id,
        JSON.stringify(tc.input),
        JSON.stringify(tc.expected),
        tc.desc,
        tc.order,
      ]
    );
  }

  // Challenge 8.2.2: Build a search result ranker
  const challenge8_2_2Id = nanoid();
  db.run(
    `INSERT INTO challenges (id, concept_id, type, title, description, starter_code, solution_code, hints, difficulty, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      challenge8_2_2Id,
      concept8_2Id,
      "implement",
      "Build a search result ranker",
      `Implement a \`rank_results\` function that scores and sorts search results by relevance to a query.

**Scoring rules:**
- Split the query into lowercase terms
- For each query term found in the result's \`title\` (case-insensitive): **+2 points**
- For each query term found in the result's \`snippet\` (case-insensitive): **+1 point**
- Sort results by score (highest first)
- Results with the same score keep their original order
- Add a \`"score"\` key to each result dict

**Example:**
\`\`\`python
results = [
    {"title": "Cats and Dogs", "snippet": "A story about cats"},
    {"title": "Python Programming", "snippet": "Learn Python cats"},
]
rank_results(results, "python cats")
# Second result scores higher: "python" in title (2) + "cats" in snippet (1) = 3
# First result: "cats" in title (2) + "cats" in snippet (1) = 3 — tie, original order preserved
\`\`\``,
      `def rank_results(results, query):
    # Your code here
    pass`,
      `def rank_results(results, query):
    if not results:
        return []
    terms = query.lower().split()
    scored = []
    for r in results:
        score = 0
        title_lower = r["title"].lower()
        snippet_lower = r["snippet"].lower()
        for term in terms:
            if term in title_lower:
                score += 2
            if term in snippet_lower:
                score += 1
        scored.append({**r, "score": score})
    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored`,
      JSON.stringify([
        "Split the query into lowercase terms with query.lower().split()",
        "For each result, check if each term appears in the lowercased title (+2) and snippet (+1)",
        "Add the score to each result dict using {**r, 'score': score}",
        "Use sort with key=lambda and reverse=True — Python's sort is stable, so ties keep original order",
      ]),
      "intermediate",
      2,
    ]
  );

  // Test cases for rank_results
  for (const tc of [
    {
      input: [
        [
          { title: "Learn JavaScript", snippet: "A guide to JS" },
          { title: "Python Tutorial", snippet: "Learn Python basics" },
        ],
        "python",
      ],
      expected: [
        { title: "Python Tutorial", snippet: "Learn Python basics", score: 3 },
        { title: "Learn JavaScript", snippet: "A guide to JS", score: 0 },
      ],
      desc: "Results sorted by relevance score",
      order: 1,
    },
    {
      input: [
        [
          { title: "Introduction to AI", snippet: "A guide about artificial intelligence" },
          { title: "Machine Learning Basics", snippet: "Learn about machine learning algorithms" },
        ],
        "machine learning",
      ],
      expected: [
        { title: "Machine Learning Basics", snippet: "Learn about machine learning algorithms", score: 6 },
        { title: "Introduction to AI", snippet: "A guide about artificial intelligence", score: 0 },
      ],
      desc: "Multiple query terms accumulate scores",
      order: 2,
    },
    {
      input: [[], "python"],
      expected: [],
      desc: "Empty results returns empty list",
      order: 3,
    },
    {
      input: [
        [
          { title: "AAA", snippet: "bbb" },
          { title: "CCC", snippet: "ddd" },
        ],
        "xyz",
      ],
      expected: [
        { title: "AAA", snippet: "bbb", score: 0 },
        { title: "CCC", snippet: "ddd", score: 0 },
      ],
      desc: "Equal scores preserve original order",
      order: 4,
    },
  ]) {
    db.run(
      `INSERT INTO test_cases (id, challenge_id, input, expected_output, description, order_index)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nanoid(),
        challenge8_2_2Id,
        JSON.stringify(tc.input),
        JSON.stringify(tc.expected),
        tc.desc,
        tc.order,
      ]
    );
  }

  // Concept 8.3: Model Context Protocol (MCP)
  const concept8_3Id = nanoid();
  db.run(
    `INSERT INTO concepts (id, lesson_id, title, explanation, order_index)
     VALUES (?, ?, ?, ?, ?)`,
    [
      concept8_3Id,
      lesson8Id,
      "Model Context Protocol (MCP)",
      `# Model Context Protocol (MCP)

The **Model Context Protocol** (MCP) is an open standard that defines how LLMs connect to external tools and data sources. Think of it as the **"USB for AI"** — a universal plug that lets any LLM client talk to any tool server.

## The Problem MCP Solves

Today, every framework has its own way of defining and connecting tools:
- LangChain uses \`@tool\` decorators
- OpenAI uses function definitions in the API
- Anthropic uses tool blocks in messages
- Custom frameworks roll their own formats

This means tools written for one framework can't easily be used with another. If you build 10 tools for LangChain, switching to a different framework means rewriting all 10.

## How MCP Works

MCP separates **tool implementation** (the server) from **agent logic** (the client):

\`\`\`
┌─────────────┐       MCP Protocol       ┌─────────────┐
│  MCP Client  │ ←────────────────────→ │  MCP Server  │
│  (Agent/LLM) │    Tool discovery,      │  (Tool host) │
│              │    invocation, results   │              │
└─────────────┘                         └─────────────┘
\`\`\`

1. **MCP Server** exposes tools with their schemas (name, description, parameters)
2. **MCP Client** discovers available tools automatically
3. Client sends tool invocations, server executes and returns results
4. Any client can connect to any server — they speak the same protocol

## The USB Analogy

Before USB, every device had its own proprietary connector. USB standardized the interface — any device works with any computer. MCP does the same for LLM tools:
- **Before MCP**: Each framework has proprietary tool formats
- **After MCP**: Write a tool once as an MCP server, use it from any MCP-compatible client

## LangChain Integration

\`\`\`python
from langchain_mcp_adapters import create_mcp_client

# Connect to any MCP server — tools are discovered automatically
tools = await create_mcp_client("path/to/mcp-server")
llm_with_tools = llm.bind_tools(tools)
\`\`\`

## Current State

MCP is still early-stage but gaining rapid adoption. Anthropic, OpenAI, and many open-source projects support it. The key advantage is **write once, use everywhere** — a tool implemented as an MCP server works with any compatible agent framework.`,
      3,
    ]
  );

  // Challenge 8.3.1: Explain how MCP standardizes tool integration
  db.run(
    `INSERT INTO challenges (id, concept_id, type, title, description, starter_code, solution_code, hints, difficulty, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      nanoid(),
      concept8_3Id,
      "explain",
      "How does MCP standardize tool integration?",
      `Explain why a standard protocol like the Model Context Protocol (MCP) is needed for LLM tool integration.

Consider these aspects:
1. **Current fragmentation** — Why is the current state of LLM tool integration problematic?
2. **The MCP solution** — How does separating tool servers from agent clients help?
3. **The USB analogy** — How does this compare to how USB standardized hardware interfaces?
4. **Practical benefits** — What does this mean for developers building AI applications?

Write a clear explanation (3-4 paragraphs).`,
      null,
      `## The Fragmentation Problem

Today, every LLM framework and provider has its own proprietary format for defining tools. LangChain uses Python decorators and docstrings, OpenAI expects a specific JSON schema format in API calls, and Anthropic has its own tool block format. If you build a suite of tools for one framework, switching to another requires rewriting every tool definition. This fragmentation means developers are locked into ecosystems, tool sharing across projects is difficult, and the community wastes effort re-implementing the same tools in different formats.

## The MCP Architecture

MCP solves this by introducing a clear separation between tool implementation (MCP servers) and tool consumption (MCP clients). An MCP server hosts one or more tools and exposes them through a standardized protocol — any client that speaks MCP can discover what tools are available, understand their parameters, invoke them, and receive results. This means you implement a tool once as an MCP server, and it automatically works with any MCP-compatible agent, regardless of which LLM framework the agent uses.

## The USB Analogy

The comparison to USB is apt. Before USB, every hardware device had its own proprietary connector — printers, keyboards, cameras all needed different ports. USB created a universal interface: any device works with any computer. MCP does the same for AI tools. Before MCP, every "device" (tool) needed a framework-specific "connector" (definition format). With MCP, there's one universal protocol. Just as you don't think about connector compatibility when plugging in a USB device, developers using MCP don't need to worry about whether their tools will work with a particular agent framework.

## Practical Impact

For developers, MCP means building tools once and using them everywhere. A company that builds an internal knowledge-base search tool as an MCP server can use it with LangChain agents, OpenAI assistants, or custom agent frameworks without rewriting anything. It also enables a tool marketplace — open-source MCP servers for common tasks (web search, database queries, file operations) that any developer can plug into their agents. While MCP is still in its early stages, its adoption by major players like Anthropic and OpenAI signals that it's likely to become the standard interface for LLM tool integration.`,
      JSON.stringify([
        "Think about what happens when you build 10 tools for LangChain and then want to switch to a different framework",
        "MCP separates the 'tool server' (implements the function) from the 'agent client' (decides when to call it)",
        "USB eliminated the need for proprietary connectors — MCP eliminates the need for proprietary tool formats",
      ]),
      "intermediate",
      1,
    ]
  );

  // ============================================
  // LESSON 9: INFERENCE-TIME REASONING
  // ============================================
  const lesson9Id = nanoid();
  db.run(
    `INSERT INTO lessons (id, title, slug, description, order_index, is_published)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      lesson9Id,
      "Inference-Time Reasoning",
      "inference-time-reasoning",
      "Techniques for improving LLM reasoning at inference time without retraining. Covers chain-of-thought prompting, self-consistency, sequential revision, and tree-of-thoughts search.",
      9,
      1,
    ]
  );

  // Concept 9.1: Chain-of-Thought Prompting
  const concept9_1Id = nanoid();
  db.run(
    `INSERT INTO concepts (id, lesson_id, title, explanation, order_index)
     VALUES (?, ?, ?, ?, ?)`,
    [
      concept9_1Id,
      lesson9Id,
      "Chain-of-Thought Prompting",
      `# Chain-of-Thought Prompting

Chain-of-Thought (CoT) prompting gets LLMs to reason step-by-step at inference time — no retraining required. By showing the model *how* to think through a problem, you unlock latent reasoning capabilities.

## Two Variants

### Zero-Shot CoT

Simply append **"Let's think step by step"** to your prompt. This triggers the model's latent reasoning without needing any examples.

\`\`\`python
prompt = """What is 47 * 83?

Let's think step by step."""

# Model output:
# Step 1: 47 * 80 = 3,760
# Step 2: 47 * 3 = 141
# Step 3: 3,760 + 141 = 3,901
# Answer: 3,901
\`\`\`

**Best for**: Quick baseline reasoning. Works surprisingly well for arithmetic, logic, and common-sense problems.

### Few-Shot CoT

Provide **examples** of step-by-step reasoning before asking your question. This gives you control over the reasoning format and style.

\`\`\`python
prompt = """Use the [GIVEN]/[FIND]/[SOLVE]/[ANSWER] format.

Q: A store sells apples for $2 each. If I buy 5, how much do I spend?
[GIVEN] Price per apple = $2, Quantity = 5
[FIND] Total cost
[SOLVE] Total = price × quantity = $2 × 5
[ANSWER] $10

Q: A train travels at 60 mph for 2.5 hours. How far does it go?"""
\`\`\`

**Best for**: When you need consistent output format, or when the reasoning task is domain-specific.

## Base vs Instruction-Tuned Models

| Model Type | Zero-Shot CoT | Few-Shot CoT |
|------------|---------------|--------------|
| **Base models** | Moderate benefit — triggers basic reasoning | Strong benefit — teaches reasoning patterns |
| **Instruction-tuned** | Already reasons internally | Benefits from *format control* (e.g., [GIVEN]/[FIND]/[SOLVE]) |

## Key Insight

Instruction-tuned models (GPT-4, Claude, etc.) already reason well by default. Few-shot CoT is most valuable for **controlling output format** rather than teaching the model to reason.`,
      1,
    ]
  );

  // Challenge 9.1.1: Build a few-shot CoT prompt formatter
  const challenge9_1_1Id = nanoid();
  db.run(
    `INSERT INTO challenges (id, concept_id, type, title, description, starter_code, solution_code, hints, difficulty, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      challenge9_1_1Id,
      concept9_1Id,
      "implement",
      "Build a few-shot CoT prompt formatter",
      `Implement a \`format_few_shot_prompt\` function that assembles a few-shot chain-of-thought prompt.

**Parameters:**
- \`examples\` — a list of dicts, each with keys \`"question"\`, \`"reasoning"\`, and \`"answer"\`
- \`question\` — the new question to answer
- \`format_instruction\` — a string describing the desired reasoning format

**Returns** a single formatted string:
1. The format instruction
2. Two newlines
3. Each example formatted as: \`Q: {question}\\n{reasoning}\\nAnswer: {answer}\\n\\n\`
4. The new question as: \`Q: {question}\\n\`

**Example:**
\`\`\`python
examples = [{"question": "2+2?", "reasoning": "2+2=4", "answer": "4"}]
format_few_shot_prompt(examples, "3+3?", "Show your work.")
# => "Show your work.\\n\\nQ: 2+2?\\n2+2=4\\nAnswer: 4\\n\\nQ: 3+3?\\n"
\`\`\``,
      `def format_few_shot_prompt(examples, question, format_instruction):
    # Your code here
    pass`,
      `def format_few_shot_prompt(examples, question, format_instruction):
    parts = [format_instruction, ""]
    for ex in examples:
        parts.append(f"Q: {ex['question']}\\n{ex['reasoning']}\\nAnswer: {ex['answer']}\\n")
    parts.append(f"Q: {question}\\n")
    return "\\n".join(parts)`,
      JSON.stringify([
        "Start with the format_instruction, then add an empty string to get a blank line when joined",
        "Loop through each example and format it as Q: {question}\\n{reasoning}\\nAnswer: {answer}\\n",
        "End with Q: {question}\\n for the new question",
        "Join all parts with \\n",
      ]),
      "beginner",
      1,
    ]
  );

  for (const tc of [
    {
      input: [
        [{ question: "2+2?", reasoning: "2+2=4", answer: "4" }],
        "3+3?",
        "Show your work.",
      ],
      expected: "Show your work.\n\nQ: 2+2?\n2+2=4\nAnswer: 4\n\nQ: 3+3?\n",
      desc: "Single example with simple question",
      order: 1,
    },
    {
      input: [
        [
          { question: "5*2?", reasoning: "5 times 2 equals 10", answer: "10" },
          { question: "3+7?", reasoning: "3 plus 7 equals 10", answer: "10" },
        ],
        "8-3?",
        "Think step by step.",
      ],
      expected:
        "Think step by step.\n\nQ: 5*2?\n5 times 2 equals 10\nAnswer: 10\n\nQ: 3+7?\n3 plus 7 equals 10\nAnswer: 10\n\nQ: 8-3?\n",
      desc: "Multiple examples included with proper separators",
      order: 2,
    },
    {
      input: [[], "What is AI?", "Be concise."],
      expected: "Be concise.\n\nQ: What is AI?\n",
      desc: "Empty examples list returns instruction + question only",
      order: 3,
    },
    {
      input: [
        [
          {
            question: "Explain gravity",
            reasoning: "Step 1: gravity is a force\nStep 2: it attracts objects",
            answer: "A fundamental force of attraction",
          },
        ],
        "Explain light",
        "Use steps.",
      ],
      expected:
        "Use steps.\n\nQ: Explain gravity\nStep 1: gravity is a force\nStep 2: it attracts objects\nAnswer: A fundamental force of attraction\n\nQ: Explain light\n",
      desc: "Example with multiline reasoning preserved correctly",
      order: 4,
    },
  ]) {
    db.run(
      `INSERT INTO test_cases (id, challenge_id, input, expected_output, description, order_index)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nanoid(),
        challenge9_1_1Id,
        JSON.stringify(tc.input),
        JSON.stringify(tc.expected),
        tc.desc,
        tc.order,
      ]
    );
  }

  // Challenge 9.1.2: Explain zero-shot vs few-shot CoT
  db.run(
    `INSERT INTO challenges (id, concept_id, type, title, description, starter_code, solution_code, hints, difficulty, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      nanoid(),
      concept9_1Id,
      "explain",
      "Explain zero-shot vs few-shot CoT",
      `When should you use **zero-shot CoT** vs **few-shot CoT**?

Consider these aspects in your answer:
1. **Simplicity vs control** — When is the simpler approach (zero-shot) sufficient?
2. **Base models vs instruction-tuned models** — How does the model type affect your choice?
3. **When format matters** — In what scenarios is few-shot CoT clearly better?

Write a clear explanation (3-4 paragraphs).`,
      null,
      `## Zero-Shot CoT: The Simple Baseline

Zero-shot CoT — simply appending "Let's think step by step" — is the right starting point when you need quick reasoning improvements with minimal prompt engineering. It works well with instruction-tuned models (GPT-4, Claude, etc.) that already have strong reasoning capabilities built in during training. For straightforward tasks like arithmetic, basic logic, or common-sense reasoning, zero-shot CoT often provides sufficient improvement without the overhead of crafting examples.

## Few-Shot CoT: Control and Consistency

Few-shot CoT becomes essential when you need to control the *format* and *style* of reasoning. By providing worked examples, you show the model exactly how you want it to think through problems. This is particularly valuable in domain-specific tasks (medical diagnosis, legal analysis, scientific reasoning) where the reasoning structure matters as much as the final answer. If you need consistent output that follows a specific template like [GIVEN]/[FIND]/[SOLVE]/[ANSWER], few-shot CoT is the clear choice.

## Model Type Matters

The choice also depends on your model. Base models (not instruction-tuned) benefit significantly from few-shot CoT because they haven't been trained to reason step-by-step — the examples teach them the pattern. Instruction-tuned models already reason well by default, so few-shot CoT primarily helps with format control rather than enabling reasoning itself. For instruction-tuned models, zero-shot CoT is often "good enough" unless you have strict output format requirements.

## Practical Guideline

Start with zero-shot CoT as your baseline. If the output quality or format isn't meeting your needs, invest in crafting few-shot examples. The extra effort of few-shot CoT is justified when you need reproducible output format, domain-specific reasoning patterns, or are working with base models that need reasoning scaffolding.`,
      JSON.stringify([
        "Think about the trade-off between prompt engineering effort and output quality",
        "Consider how instruction-tuned models already have reasoning built in",
        "Few-shot CoT is most valuable for format control, not just reasoning quality",
      ]),
      "beginner",
      2,
    ]
  );

  // Concept 9.2: Self-Consistency
  const concept9_2Id = nanoid();
  db.run(
    `INSERT INTO concepts (id, lesson_id, title, explanation, order_index)
     VALUES (?, ?, ?, ?, ?)`,
    [
      concept9_2Id,
      lesson9Id,
      "Self-Consistency",
      `# Self-Consistency

Self-consistency improves reasoning reliability by sampling **multiple independent reasoning paths** and using **majority voting** to select the final answer.

## The Algorithm

1. **Sample N reasoning traces** — use temperature > 0 so each trace takes a different path
2. **Extract the final answer** from each trace
3. **Majority vote** — the most frequent answer wins

## Example: "What is 23 × 17?"

\`\`\`
Trace 1: "23 × 17 = 23 × 10 + 23 × 7 = 230 + 161 = 391"   → Answer: 391
Trace 2: "23 × 17 = 20 × 17 + 3 × 17 = 340 + 51 = 391"     → Answer: 391
Trace 3: "23 × 17 = 25 × 17 - 2 × 17 = 425 - 34 = 391"     → Answer: 391
Trace 4: "23 × 17 ≈ 23 × 20 - 23 × 3 = 460 - 69 = 391"     → Answer: 391
                                                                  Winner: 391 (4/4)
\`\`\`

Now consider a harder problem where errors creep in:

\`\`\`
Trace 1: "... = 12"   ← correct
Trace 2: "... = 12"   ← correct
Trace 3: "... = 10"   ← arithmetic error in step 3
Trace 4: "... = 12"   ← correct
                          Winner: 12 (3/4 votes)
\`\`\`

Even though one reasoning path went wrong, the majority still finds the correct answer.

## Why It Works

Different reasoning paths make **different errors**. If errors are somewhat random, majority voting filters them out — similar to how ensemble methods work in machine learning.

## Trade-offs

| Aspect | Consideration |
|--------|--------------|
| **Cost** | N × the cost of a single generation |
| **Latency** | Can be parallelized (all traces run independently) |
| **Best for** | Arithmetic, multi-step reasoning, factual questions with clear answers |
| **Not great for** | Open-ended creative tasks (no single "correct" answer to vote on) |

## Temperature Setting

Use **moderate temperature** (0.5–0.8) for diversity without too much randomness. Temperature 0 would give identical traces, defeating the purpose.`,
      2,
    ]
  );

  // Challenge 9.2.1: Extract answers from reasoning traces
  const challenge9_2_1Id = nanoid();
  db.run(
    `INSERT INTO challenges (id, concept_id, type, title, description, starter_code, solution_code, hints, difficulty, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      challenge9_2_1Id,
      concept9_2Id,
      "implement",
      "Extract answers from reasoning traces",
      `Implement an \`extract_answer\` function that pulls the final answer from a reasoning trace string.

**Rules (checked in order):**
1. Look for \`"Answer: X"\` or \`"answer: X"\` — return X (stripped)
2. Look for \`"the answer is X"\` (case-insensitive) — return X (stripped)
3. Look for \`"= X"\` at the end of the trace — return X (stripped)
4. If no pattern matches, return \`None\`

**Examples:**
\`\`\`python
extract_answer("Step 1: 5+7=12. Answer: 12")  # => "12"
extract_answer("I'm not sure")                  # => None
\`\`\``,
      `import re

def extract_answer(trace):
    # Your code here
    pass`,
      `import re

def extract_answer(trace):
    # Pattern 1: "Answer: X" (case-insensitive)
    match = re.search(r'[Aa]nswer:\\s*(.+)', trace)
    if match:
        return match.group(1).strip()

    # Pattern 2: "the answer is X" (case-insensitive)
    match = re.search(r'the answer is\\s+(.+)', trace, re.IGNORECASE)
    if match:
        return match.group(1).strip()

    # Pattern 3: "= X" at the end
    match = re.search(r'=\\s*(.+?)\\s*$', trace)
    if match:
        return match.group(1).strip()

    return None`,
      JSON.stringify([
        "Use re.search() to find patterns in the trace string",
        "Check patterns in order: Answer: X, the answer is X, = X at end",
        "Use .strip() on the captured group to remove whitespace",
        "Return None if no pattern matches",
      ]),
      "beginner",
      1,
    ]
  );

  for (const tc of [
    {
      input: ["Step 1: 5+7=12. Answer: 12"],
      expected: "12",
      desc: "Matches 'Answer: X' pattern",
      order: 1,
    },
    {
      input: ["Let me calculate... the answer is 42"],
      expected: "42",
      desc: "Matches 'the answer is X' pattern",
      order: 2,
    },
    {
      input: ["5 + 3 = 8"],
      expected: "8",
      desc: "Matches '= X' at end pattern",
      order: 3,
    },
    {
      input: ["I'm not sure about this problem"],
      expected: null,
      desc: "No pattern found returns None",
      order: 4,
    },
    {
      input: ["The capital is... Answer: Paris"],
      expected: "Paris",
      desc: "Non-numeric answer extraction",
      order: 5,
    },
  ]) {
    db.run(
      `INSERT INTO test_cases (id, challenge_id, input, expected_output, description, order_index)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nanoid(),
        challenge9_2_1Id,
        JSON.stringify(tc.input),
        JSON.stringify(tc.expected),
        tc.desc,
        tc.order,
      ]
    );
  }

  // Challenge 9.2.2: Implement self-consistency majority voting
  const challenge9_2_2Id = nanoid();
  db.run(
    `INSERT INTO challenges (id, concept_id, type, title, description, starter_code, solution_code, hints, difficulty, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      challenge9_2_2Id,
      concept9_2Id,
      "implement",
      "Implement self-consistency majority voting",
      `Implement a \`majority_vote\` function that takes a list of reasoning trace strings, extracts the answer from each, and returns the majority winner.

**Parameters:**
- \`traces\` — a list of reasoning trace strings

**Answer extraction:** For each trace, look for \`"Answer: X"\` (case-insensitive). If found, X (stripped) is the answer. Otherwise, the trace has no extractable answer.

**Returns** a dict:
\`\`\`python
{"winner": most_common_answer, "votes": {"ans1": count1, "ans2": count2}, "total": num_valid}
\`\`\`

- If no valid answers, return \`{"winner": None, "votes": {}, "total": 0}\`
- If there's a tie, any of the tied answers is acceptable as winner

**Example:**
\`\`\`python
traces = [
    "23*17=391. Answer: 391",
    "Let me see... Answer: 391",
    "I think... Answer: 390",
    "Calculating: Answer: 391",
]
majority_vote(traces)
# => {"winner": "391", "votes": {"391": 3, "390": 1}, "total": 4}
\`\`\``,
      `import re
from collections import Counter

def majority_vote(traces):
    # Your code here
    pass`,
      `import re
from collections import Counter

def majority_vote(traces):
    answers = []
    for trace in traces:
        match = re.search(r'[Aa]nswer:\\s*(.+)', trace)
        if match:
            answers.append(match.group(1).strip())

    if not answers:
        return {"winner": None, "votes": {}, "total": 0}

    vote_counts = dict(Counter(answers))
    winner = max(vote_counts, key=vote_counts.get)
    return {"winner": winner, "votes": vote_counts, "total": len(answers)}`,
      JSON.stringify([
        "Use re.search with r'[Aa]nswer:\\s*(.+)' to extract answers from each trace",
        "Filter out traces where no answer is found",
        "Use collections.Counter to count votes for each unique answer",
        "The winner is the answer with the highest count — use max() with a key function",
      ]),
      "intermediate",
      2,
    ]
  );

  for (const tc of [
    {
      input: [
        [
          "23*17=391. Answer: 391",
          "Let me see... Answer: 391",
          "I think... Answer: 390",
          "Calculating: Answer: 391",
        ],
      ],
      expected: { winner: "391", votes: { "391": 3, "390": 1 }, total: 4 },
      desc: "3 of 4 traces agree on 391",
      order: 1,
    },
    {
      input: [
        ["Answer: yes", "answer: yes", "Answer: yes"],
      ],
      expected: { winner: "yes", votes: { yes: 3 }, total: 3 },
      desc: "All traces agree on same answer",
      order: 2,
    },
    {
      input: [
        [
          "I have no idea",
          "This is confusing",
          "Not sure at all",
        ],
      ],
      expected: { winner: null, votes: {}, total: 0 },
      desc: "No extractable answers returns empty result",
      order: 3,
    },
    {
      input: [
        ["Answer: A", "Answer: B"],
      ],
      expected: { votes: { A: 1, B: 1 }, total: 2 },
      desc: "Tie between two answers — votes dict is correct",
      order: 4,
    },
  ]) {
    db.run(
      `INSERT INTO test_cases (id, challenge_id, input, expected_output, description, order_index)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nanoid(),
        challenge9_2_2Id,
        JSON.stringify(tc.input),
        JSON.stringify(tc.expected),
        tc.desc,
        tc.order,
      ]
    );
  }

  // Concept 9.3: Sequential Revision
  const concept9_3Id = nanoid();
  db.run(
    `INSERT INTO concepts (id, lesson_id, title, explanation, order_index)
     VALUES (?, ?, ?, ?, ?)`,
    [
      concept9_3Id,
      lesson9Id,
      "Sequential Revision",
      `# Sequential Revision

Sequential revision improves an initial answer through **multiple rounds of self-critique**. Instead of generating one final answer, you iteratively refine a draft — each revision building on the previous one.

## The Process

\`\`\`
Question
    │
    ▼
Generate Initial Draft
    │
    ▼
Revise Draft (Round 1) ──→ Improved Answer
    │
    ▼
Revise Draft (Round 2) ──→ Further Improved
    │
    ▼
Revise Draft (Round N) ──→ Final Answer
\`\`\`

## How It Works

1. **Generate** an initial answer to the question
2. **Feed the draft back** with an instruction to revise and improve
3. Each revision is **conditioned on the previous answer** — the model sees what it already wrote
4. After N rounds, take the final revision as the answer

## Key Principles

- **Short, focused revisions** — each round should make targeted improvements, not complete rewrites
- **Accumulates improvements** — typos fixed in round 1 stay fixed in rounds 2, 3, etc.
- **Diminishing returns** — most improvement happens in the first 1-2 revisions

## Analogy: Editing Writing Drafts

This mirrors how humans write:
1. Write a rough first draft (get ideas down)
2. First edit: fix structure and clarity
3. Second edit: polish language and details
4. Third edit: final proofread

## Implementation Pattern

\`\`\`python
messages = [
    {"role": "user", "content": f"Question: {q}\\n\\nProvide an initial answer."}
]
answer = llm(messages)

for i in range(num_revisions):
    messages.append({"role": "assistant", "content": answer})
    messages.append({
        "role": "user",
        "content": f"Please revise and improve this answer. Be concise and focused."
    })
    answer = llm(messages)
\`\`\`

## Trade-offs

| Rounds | Quality | Cost |
|--------|---------|------|
| 0 (no revision) | Baseline | 1× |
| 1 revision | Significant improvement | 2× |
| 2 revisions | Diminishing returns | 3× |
| 3+ revisions | Minimal additional gain | 4×+ |`,
      3,
    ]
  );

  // Challenge 9.3.1: Build a revision prompt chain
  const challenge9_3_1Id = nanoid();
  db.run(
    `INSERT INTO challenges (id, concept_id, type, title, description, starter_code, solution_code, hints, difficulty, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      challenge9_3_1Id,
      concept9_3Id,
      "implement",
      "Build a revision prompt chain",
      `Implement a \`build_revision_chain\` function that constructs a list of message dicts representing a multi-round revision conversation.

**Parameters:**
- \`question\` — the question to answer
- \`initial_answer\` — the first draft answer
- \`num_revisions\` — how many revision rounds (0 means no revision)

**Returns** a list of message dicts with \`"role"\` and \`"content"\` keys:
1. First message: \`{"role": "user", "content": "Question: {question}\\n\\nProvide an initial answer."}\`
2. Second message: \`{"role": "assistant", "content": initial_answer}\`
3. For each revision round, add:
   - \`{"role": "user", "content": "Question: {question}\\n\\nPlease revise and improve this answer. Be concise and focused."}\`
   - \`{"role": "assistant", "content": "revision_{i}"}\` where i starts at 1

If \`num_revisions\` is 0, return just the first two messages (question + initial answer).

**Example:**
\`\`\`python
build_revision_chain("What is ML?", "ML is...", 1)
# => [
#   {"role": "user", "content": "Question: What is ML?\\n\\nProvide an initial answer."},
#   {"role": "assistant", "content": "ML is..."},
#   {"role": "user", "content": "Question: What is ML?\\n\\nPlease revise and improve this answer. Be concise and focused."},
#   {"role": "assistant", "content": "revision_1"},
# ]
\`\`\``,
      `def build_revision_chain(question, initial_answer, num_revisions):
    # Your code here
    pass`,
      `def build_revision_chain(question, initial_answer, num_revisions):
    messages = [
        {"role": "user", "content": f"Question: {question}\\n\\nProvide an initial answer."},
        {"role": "assistant", "content": initial_answer},
    ]

    for i in range(1, num_revisions + 1):
        messages.append({
            "role": "user",
            "content": f"Question: {question}\\n\\nPlease revise and improve this answer. Be concise and focused.",
        })
        messages.append({
            "role": "assistant",
            "content": f"revision_{i}",
        })

    return messages`,
      JSON.stringify([
        "Start with two messages: the initial question prompt and the initial_answer as assistant response",
        "For each revision round, add a user message asking to revise, then an assistant placeholder",
        "The revision placeholder is f'revision_{i}' where i starts at 1",
        "If num_revisions is 0, you only return the initial question + answer",
      ]),
      "intermediate",
      1,
    ]
  );

  for (const tc of [
    {
      input: ["What is ML?", "ML is machine learning.", 1],
      expected: [
        { role: "user", content: "Question: What is ML?\n\nProvide an initial answer." },
        { role: "assistant", content: "ML is machine learning." },
        { role: "user", content: "Question: What is ML?\n\nPlease revise and improve this answer. Be concise and focused." },
        { role: "assistant", content: "revision_1" },
      ],
      desc: "One revision round produces 4 messages",
      order: 1,
    },
    {
      input: ["What is AI?", "AI is artificial intelligence.", 0],
      expected: [
        { role: "user", content: "Question: What is AI?\n\nProvide an initial answer." },
        { role: "assistant", content: "AI is artificial intelligence." },
      ],
      desc: "Zero revisions returns just initial question + answer",
      order: 2,
    },
    {
      input: ["Explain gravity", "Gravity pulls things down.", 3],
      expected: [
        { role: "user", content: "Question: Explain gravity\n\nProvide an initial answer." },
        { role: "assistant", content: "Gravity pulls things down." },
        { role: "user", content: "Question: Explain gravity\n\nPlease revise and improve this answer. Be concise and focused." },
        { role: "assistant", content: "revision_1" },
        { role: "user", content: "Question: Explain gravity\n\nPlease revise and improve this answer. Be concise and focused." },
        { role: "assistant", content: "revision_2" },
        { role: "user", content: "Question: Explain gravity\n\nPlease revise and improve this answer. Be concise and focused." },
        { role: "assistant", content: "revision_3" },
      ],
      desc: "Three revisions produce 8 messages total",
      order: 3,
    },
    {
      input: ["What is Python?", "A language.", 1],
      expected: [
        { role: "user", content: "Question: What is Python?\n\nProvide an initial answer." },
        { role: "assistant", content: "A language." },
        { role: "user", content: "Question: What is Python?\n\nPlease revise and improve this answer. Be concise and focused." },
        { role: "assistant", content: "revision_1" },
      ],
      desc: "Each revision prompt includes the original question",
      order: 4,
    },
  ]) {
    db.run(
      `INSERT INTO test_cases (id, challenge_id, input, expected_output, description, order_index)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nanoid(),
        challenge9_3_1Id,
        JSON.stringify(tc.input),
        JSON.stringify(tc.expected),
        tc.desc,
        tc.order,
      ]
    );
  }

  // Concept 9.4: Tree-of-Thoughts & Beam Search
  const concept9_4Id = nanoid();
  db.run(
    `INSERT INTO concepts (id, lesson_id, title, explanation, order_index)
     VALUES (?, ?, ?, ?, ?)`,
    [
      concept9_4Id,
      lesson9Id,
      "Tree-of-Thoughts & Beam Search",
      `# Tree-of-Thoughts & Beam Search

Tree-of-Thoughts (ToT) reframes reasoning as a **search problem** over a tree of possible thinking paths. Instead of following a single chain of thought, you explore multiple branches and prune bad ones.

## Core Algorithm

\`\`\`
Level 0:  [Initial State]
              │
Level 1:  [A]  [B]  [C]     ← Expand: generate candidates
              │       │
Level 2:  [A1][A2] [C1][C2]  ← Score & Prune: keep top-K
              │       │
Level 3:  [A1a]   [C1a]      ← Final frontier: pick best
\`\`\`

1. **Expand** — generate multiple candidate next-thoughts from each current state
2. **Score** — evaluate how promising each candidate is
3. **Prune** — keep only the top-K candidates (beam width)
4. Repeat for N depth levels

## Two Variants

### Algorithmic ToT
Used when the problem space is well-defined. Pure code, no LLM needed.

**Example: Word Ladder** (change one letter at a time)
\`\`\`
hit → hot → dot → dog → cog
\`\`\`

- **Expand**: change one letter, check if result is a valid word
- **Score**: edit distance to target word (lower = better)
- **Prune**: keep top-K closest words

### LLM-based ToT
For open-ended problems. The LLM both **proposes** next thoughts and **evaluates** them.

\`\`\`python
# The LLM generates candidate next-steps
candidates = [llm(f"Given {state}, what's the next step?") for _ in range(3)]

# The LLM scores each candidate
scores = [llm(f"Rate this reasoning step 1-10: {c}") for c in candidates]
\`\`\`

## Beam Search

Beam search is the core algorithm powering ToT. The **beam width** controls the trade-off:

| Beam Width | Behavior |
|------------|----------|
| 1 | Greedy search — always pick the single best |
| 3–5 | Good balance of exploration vs cost |
| 10+ | Thorough but expensive |

## When to Use ToT

- **Puzzles and games** with well-defined state spaces
- **Planning tasks** where you need to evaluate multiple strategies
- **Complex reasoning** where a single chain of thought often fails
- **Not recommended** for simple factual questions (overkill)`,
      4,
    ]
  );

  // Challenge 9.4.1: Implement word ladder neighbors
  const challenge9_4_1Id = nanoid();
  db.run(
    `INSERT INTO challenges (id, concept_id, type, title, description, starter_code, solution_code, hints, difficulty, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      challenge9_4_1Id,
      concept9_4Id,
      "implement",
      "Implement word ladder neighbors",
      `Implement a \`get_neighbors\` function for a word ladder problem.

**Parameters:**
- \`word\` — a lowercase string
- \`vocabulary\` — a set of valid words

**Returns** a sorted list of all words that:
1. Differ from \`word\` by exactly one letter
2. Exist in \`vocabulary\`
3. Are not the original word itself

**Example:**
\`\`\`python
get_neighbors("hit", {"hot", "dot", "hat", "bit", "hit"})
# => ["bit", "hat", "hot"]
\`\`\``,
      `def get_neighbors(word, vocabulary):
    # Your code here
    pass`,
      `def get_neighbors(word, vocabulary):
    neighbors = []
    for i in range(len(word)):
        for c in 'abcdefghijklmnopqrstuvwxyz':
            if c != word[i]:
                candidate = word[:i] + c + word[i+1:]
                if candidate in vocabulary:
                    neighbors.append(candidate)
    return sorted(neighbors)`,
      JSON.stringify([
        "Iterate through each position in the word",
        "At each position, try replacing with all 26 lowercase letters",
        "Skip the letter that's already there (c != word[i])",
        "Check if the resulting word is in the vocabulary set",
        "Return the sorted list of valid neighbors",
      ]),
      "intermediate",
      1,
    ]
  );

  for (const tc of [
    {
      input: ["hit", ["hot", "dot", "hat", "bit", "hit"]],
      expected: ["bit", "hat", "hot"],
      desc: "Standard word with multiple neighbors",
      order: 1,
    },
    {
      input: ["dog", ["dog", "dot", "cog", "log", "bog"]],
      expected: ["bog", "cog", "dot", "log"],
      desc: "Word with 4 neighbors",
      order: 2,
    },
    {
      input: ["abc", []],
      expected: [],
      desc: "Empty vocabulary returns empty list",
      order: 3,
    },
    {
      input: ["a", ["b", "c", "a"]],
      expected: ["b", "c"],
      desc: "Single-letter word",
      order: 4,
    },
  ]) {
    db.run(
      `INSERT INTO test_cases (id, challenge_id, input, expected_output, description, order_index)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nanoid(),
        challenge9_4_1Id,
        JSON.stringify(tc.input),
        JSON.stringify(tc.expected),
        tc.desc,
        tc.order,
      ]
    );
  }

  // Challenge 9.4.2: Implement beam search
  const challenge9_4_2Id = nanoid();
  db.run(
    `INSERT INTO challenges (id, concept_id, type, title, description, starter_code, solution_code, hints, difficulty, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      challenge9_4_2Id,
      concept9_4Id,
      "implement",
      "Implement beam search",
      `Implement a \`beam_search\` function that explores a state space using beam search.

**Parameters:**
- \`initial_state\` — the starting state (any value)
- \`expand_fn\` — a function that takes a state and returns a list of next states
- \`score_fn\` — a function that takes a state and returns a numeric score (higher is better)
- \`depth\` — number of levels to expand
- \`beam_width\` — how many candidates to keep at each level

**Returns** a tuple \`(best_state, best_score)\` — the highest-scored state in the final frontier.

**Algorithm:**
1. Start with frontier = [initial_state]
2. For each depth level:
   - Expand all frontier states (collect all children)
   - Score each child
   - Keep only the top beam_width children (sorted by score, descending)
3. Return the best state in the final frontier
4. If the frontier is ever empty, return \`(None, 0)\`

**Example:**
\`\`\`python
beam_search(0, lambda s: [s+1, s+2, s+3], lambda s: -(abs(s - 10)), 3, 2)
# Depth 0: [0]
# Depth 1: expand → [1,2,3], keep top 2 by score → [3, 2]
# Depth 2: expand → [4,5,6, 3,4,5], keep top 2 → [6, 5]
# Depth 3: expand → [7,8,9, 6,7,8], keep top 2 → [9, 8]
# Best: (9, -1)
\`\`\``,
      `def beam_search(initial_state, expand_fn, score_fn, depth, beam_width):
    # Your code here
    pass`,
      `def beam_search(initial_state, expand_fn, score_fn, depth, beam_width):
    frontier = [initial_state]

    for _ in range(depth):
        candidates = []
        for state in frontier:
            candidates.extend(expand_fn(state))

        if not candidates:
            return (None, 0)

        scored = [(s, score_fn(s)) for s in candidates]
        scored.sort(key=lambda x: x[1], reverse=True)
        frontier = [s for s, _ in scored[:beam_width]]

    if not frontier:
        return (None, 0)

    best = max(frontier, key=score_fn)
    return (best, score_fn(best))`,
      JSON.stringify([
        "Start with frontier = [initial_state] and loop for 'depth' iterations",
        "At each level, expand ALL frontier states and collect all children into one list",
        "Score each candidate and sort by score descending",
        "Keep only the top beam_width candidates as the new frontier",
        "After all levels, return the best-scored state from the final frontier",
        "Handle the empty frontier case by returning (None, 0)",
      ]),
      "advanced",
      2,
    ]
  );

  for (const tc of [
    {
      input: ["__BEAM_TEST_1__"],
      expected: [9, -1],
      desc: "Numeric search: initial=0, expand=[s+1,s+2,s+3], score=-(abs(s-10)), depth=3, width=2",
      order: 1,
    },
    {
      input: ["__BEAM_TEST_2__"],
      expected: [5, 5],
      desc: "Single path: expand=[s+1], score=s, depth=5, width=1",
      order: 2,
    },
    {
      input: ["__BEAM_TEST_3__"],
      expected: [3, 3],
      desc: "Greedy width-1: expand=[s+1,s+2,s+3], score=s, depth=1, width=1",
      order: 3,
    },
    {
      input: ["__BEAM_TEST_4__"],
      expected: [null, 0],
      desc: "Empty expand returns (None, 0)",
      order: 4,
    },
  ]) {
    db.run(
      `INSERT INTO test_cases (id, challenge_id, input, expected_output, description, order_index)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nanoid(),
        challenge9_4_2Id,
        JSON.stringify(tc.input),
        JSON.stringify(tc.expected),
        tc.desc,
        tc.order,
      ]
    );
  }

  // ============================================
  // LESSON 10: DEEP RESEARCH SYSTEMS
  // ============================================
  const lesson10Id = nanoid();
  db.run(
    `INSERT INTO lessons (id, title, slug, description, order_index, is_published)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      lesson10Id,
      "Deep Research Systems",
      "deep-research",
      "How to train reasoning models, evaluate reasoning quality with reward models, and build multi-agent deep research systems that decompose complex queries into parallel research tasks.",
      10,
      1,
    ]
  );

  // Concept 10.1: Training Reasoning Models
  const concept10_1Id = nanoid();
  db.run(
    `INSERT INTO concepts (id, lesson_id, title, explanation, order_index)
     VALUES (?, ?, ?, ?, ?)`,
    [
      concept10_1Id,
      lesson10Id,
      "Training Reasoning Models",
      `# Training Reasoning Models

While inference-time techniques (CoT, self-consistency) improve reasoning without changing the model, **training-time approaches** bake reasoning ability directly into the model's weights.

## CoT Training (Fine-Tuning on Rationales)

Standard fine-tuning trains on (question, answer) pairs. CoT training uses **(question, rationale, answer) triples** — teaching the model *how* to think, not just what to answer.

\`\`\`
Standard:  Q: "What is 47 × 83?"  →  A: "3901"
CoT:       Q: "What is 47 × 83?"  →  R: "47×80=3760, 47×3=141, 3760+141=3901"  →  A: "3901"
\`\`\`

The rationale R teaches the model to decompose problems step-by-step during training, so it naturally reasons at inference time.

## STaR: Self-Taught Reasoner

STaR is an iterative process that improves reasoning through self-generated rationales:

\`\`\`
┌──────────────────────────────────────────────┐
│  1. Collect questions with known answers       │
│  2. Teacher model generates rationales         │
│  3. Filter: keep only correct (rationale→answer)│
│  4. Fine-tune student on filtered data         │
│  5. Student becomes the new teacher            │
│  6. Repeat from step 2                         │
└──────────────────────────────────────────────┘
\`\`\`

Each iteration, the student model improves because it's trained on increasingly better rationales.

## Training vs Inference-Time Reasoning

| Aspect | Training-Time (CoT fine-tuning) | Inference-Time (CoT prompting) |
|--------|-------------------------------|-------------------------------|
| **Cost** | High upfront (training), cheap per query | No training cost, per-query prompt overhead |
| **Quality** | Consistently high (baked in) | Varies by prompt quality |
| **Flexibility** | Fixed to trained patterns | Can adapt prompts per task |
| **Data needed** | (Q, rationale, A) triples | Just examples in the prompt |
| **Model size** | Can work with smaller models | Larger models reason better |

## Key Insight

Training-time and inference-time reasoning are **complementary**. Modern frontier models (GPT-4, Claude, DeepSeek-R1) combine both: they're trained on reasoning data AND benefit from CoT prompting at inference time.`,
      1,
    ]
  );

  // Challenge 10.1.1: Explain CoT training vs inference-time CoT
  db.run(
    `INSERT INTO challenges (id, concept_id, type, title, description, starter_code, solution_code, hints, difficulty, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      nanoid(),
      concept10_1Id,
      "explain",
      "Explain CoT training vs inference-time CoT",
      `Compare **training-time CoT** (fine-tuning on rationales) with **inference-time CoT** (prompt engineering).

Consider these aspects:
1. **When each approach is appropriate** — What situations favor one over the other?
2. **Cost trade-offs** — Training costs vs per-query costs
3. **Quality differences** — Consistency and reliability of reasoning
4. **Data requirements** — What each approach needs to work well

Write a clear comparison (3-4 paragraphs).`,
      null,
      `## When to Use Each Approach

Training-time CoT (fine-tuning on rationales) is the right choice when you have a specific domain with recurring reasoning patterns and can invest in data collection upfront. For example, a math tutoring system that always needs to show work, or a medical diagnosis tool that must explain its reasoning. Once trained, every query benefits from built-in reasoning at no extra prompt cost. Inference-time CoT (prompt engineering) is better when you need flexibility across many different tasks, are experimenting with reasoning approaches, or simply can't afford the training investment.

## Cost Structure

The cost profiles are fundamentally different. Training-time CoT requires significant upfront investment: collecting or generating (question, rationale, answer) triples, running fine-tuning jobs, and iterating on data quality. However, once trained, each inference is cheap — the model naturally reasons without needing long prompts. Inference-time CoT has zero upfront cost but pays per query: few-shot examples in prompts consume tokens, and techniques like self-consistency multiply the cost by N samples. For high-volume applications, the training investment often pays for itself.

## Quality and Consistency

Training-time CoT produces more consistent reasoning because the patterns are baked into the model's weights. Every response follows the learned reasoning style without needing careful prompt engineering. Inference-time CoT quality depends heavily on the prompt: good examples produce good reasoning, but results can be brittle — small prompt changes sometimes cause large quality swings. However, inference-time approaches are more flexible: you can adapt prompts for new tasks without retraining.

## The Modern Approach: Both Together

In practice, the best systems combine both approaches. Frontier models like GPT-4 and Claude are trained on reasoning data (training-time CoT) AND respond well to CoT prompting (inference-time CoT). This layered approach gives you a strong reasoning baseline from training, with the flexibility to further guide reasoning through prompts. The STaR approach takes this further by iteratively improving training data quality, creating a virtuous cycle where each generation of the model produces better rationales for training the next.`,
      JSON.stringify([
        "Think about the cost structure: training is expensive upfront but cheap per query",
        "Inference-time CoT is flexible but requires careful prompt engineering every time",
        "Training-time CoT bakes reasoning into the model — it always reasons, even without CoT prompts",
        "Modern systems combine both: train on reasoning data AND use CoT prompts",
      ]),
      "intermediate",
      1,
    ]
  );

  // Concept 10.2: Reward Models & Reasoning Evaluation
  const concept10_2Id = nanoid();
  db.run(
    `INSERT INTO concepts (id, lesson_id, title, explanation, order_index)
     VALUES (?, ?, ?, ?, ?)`,
    [
      concept10_2Id,
      lesson10Id,
      "Reward Models & Reasoning Evaluation",
      `# Reward Models & Reasoning Evaluation

How do you evaluate whether an LLM's reasoning is actually good? Reward models provide automated scoring, and reasoning tokens make internal thinking visible.

## Outcome Reward Model (ORM)

An ORM scores only the **final answer** — right or wrong.

\`\`\`
Reasoning: "47 × 83 = 47 × 80 + 47 × 3 = 3760 + 141 = 3901"
Answer: 3901
ORM Score: ✓ Correct (1.0)
\`\`\`

**Pros:** Easy to train — just need correct/incorrect labels. Fast evaluation.
**Cons:** Can't tell you *where* reasoning went wrong. A correct answer might have flawed reasoning (lucky cancellation of errors).

## Process Reward Model (PRM)

A PRM scores **each reasoning step** individually.

\`\`\`
Step 1: "47 × 83 = 47 × 80 + 47 × 3"     → Score: 0.95 (correct decomposition)
Step 2: "47 × 80 = 3760"                    → Score: 0.99 (correct)
Step 3: "47 × 3 = 142"                      → Score: 0.10 (ERROR! Should be 141)
Step 4: "3760 + 142 = 3902"                 → Score: 0.85 (correct given step 3)
\`\`\`

**Pros:** Pinpoints exactly which step went wrong. Much better feedback for model improvement.
**Cons:** Requires step-level annotations (expensive to create). More complex to train.

## ORM vs PRM Comparison

| Aspect | ORM | PRM |
|--------|-----|-----|
| **Trains on** | Final answer labels | Step-by-step annotations |
| **Feedback** | "Right or wrong" | "Step 3 is wrong" |
| **Data cost** | Low (answer labels are easy) | High (step annotations are expensive) |
| **Training complexity** | Simple classification | Sequence labeling |
| **Use case** | Quick evaluation, filtering | Detailed feedback, RL training |

## Reasoning Tokens

Models like DeepSeek-R1 produce explicit **thinking blocks** before their final answer:

\`\`\`
<think>
Let me work through this step by step.
47 × 83...
I'll decompose: 47 × 80 = 3,760 and 47 × 3 = 141
So 3,760 + 141 = 3,901
</think>

The answer is 3,901.
\`\`\`

- The \`<think>...</think>\` block shows internal reasoning
- In production, thinking tokens are **hidden from users** (only the final answer is shown)
- Valuable for **debugging** and **evaluation** — you can see exactly how the model reasoned
- PRMs can score each step within the thinking block

## RL Training Loop

Reward models feed into Reinforcement Learning to improve reasoning:

\`\`\`
Generate answer → Score with RM → Update model weights → Repeat
\`\`\`

Higher-scored reasoning patterns get reinforced, lower-scored patterns get suppressed.`,
      2,
    ]
  );

  // Challenge 10.2.1: Parse thinking tokens from model output
  const challenge10_2_1Id = nanoid();
  db.run(
    `INSERT INTO challenges (id, concept_id, type, title, description, starter_code, solution_code, hints, difficulty, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      challenge10_2_1Id,
      concept10_2Id,
      "implement",
      "Parse thinking tokens from model output",
      `Implement a \`parse_reasoning_output\` function that separates a model's thinking from its final answer.

**Input:** A text string that may contain \`<think>...</think>\` tags.

**Returns** a dict with two keys:
- \`"thinking"\` — the content between \`<think>\` and \`</think>\` tags, or \`None\` if no tags present
- \`"answer"\` — everything after the \`</think>\` tag (stripped), or the full text (stripped) if no tags

**Examples:**
\`\`\`python
parse_reasoning_output("<think>Step 1: 5+3=8.</think>The answer is 8.")
# => {"thinking": "Step 1: 5+3=8.", "answer": "The answer is 8."}

parse_reasoning_output("The answer is 42.")
# => {"thinking": None, "answer": "The answer is 42."}
\`\`\``,
      `import re

def parse_reasoning_output(text):
    # Your code here
    pass`,
      `import re

def parse_reasoning_output(text):
    match = re.search(r'<think>(.*?)</think>(.*)', text, re.DOTALL)
    if match:
        return {
            "thinking": match.group(1),
            "answer": match.group(2).strip(),
        }
    return {"thinking": None, "answer": text.strip()}`,
      JSON.stringify([
        "Use re.search with re.DOTALL flag so '.' matches newlines too",
        "Pattern: r'<think>(.*?)</think>(.*)'  — non-greedy match inside tags",
        "Group 1 is the thinking content, group 2 is everything after </think>",
        "If no match, return thinking=None and answer=full text stripped",
      ]),
      "beginner",
      1,
    ]
  );

  for (const tc of [
    {
      input: ["<think>Let me work through this step by step. 5+3=8.</think>The answer is 8."],
      expected: { thinking: "Let me work through this step by step. 5+3=8.", answer: "The answer is 8." },
      desc: "Standard think block with answer after",
      order: 1,
    },
    {
      input: ["The answer is 42."],
      expected: { thinking: null, answer: "The answer is 42." },
      desc: "No think tags returns full text as answer",
      order: 2,
    },
    {
      input: ["<think>Hmm, complex problem.\nStep 1: analyze.\nStep 2: solve.</think>\n\nFinal: 99"],
      expected: { thinking: "Hmm, complex problem.\nStep 1: analyze.\nStep 2: solve.", answer: "Final: 99" },
      desc: "Multiline thinking content preserved",
      order: 3,
    },
    {
      input: ["<think></think>Simple."],
      expected: { thinking: "", answer: "Simple." },
      desc: "Empty think block returns empty string for thinking",
      order: 4,
    },
  ]) {
    db.run(
      `INSERT INTO test_cases (id, challenge_id, input, expected_output, description, order_index)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nanoid(),
        challenge10_2_1Id,
        JSON.stringify(tc.input),
        JSON.stringify(tc.expected),
        tc.desc,
        tc.order,
      ]
    );
  }

  // Challenge 10.2.2: Explain ORM vs PRM trade-offs
  db.run(
    `INSERT INTO challenges (id, concept_id, type, title, description, starter_code, solution_code, hints, difficulty, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      nanoid(),
      concept10_2Id,
      "explain",
      "Explain ORM vs PRM trade-offs",
      `Compare **Outcome Reward Models (ORM)** with **Process Reward Models (PRM)** for evaluating LLM reasoning.

Consider these aspects:
1. **Data collection difficulty** — What annotations does each approach need?
2. **Feedback granularity** — How detailed is the feedback each provides?
3. **Training complexity** — How hard is each to build and train?
4. **Use cases** — When would you choose one over the other?

Write a clear comparison (3-4 paragraphs).`,
      null,
      `## Data Collection: The Fundamental Difference

The biggest practical difference between ORMs and PRMs is what data they need. An ORM only requires final answer labels — "correct" or "incorrect" — which are cheap and easy to collect. For math problems, you can automatically check answers. For factual questions, you compare against known answers. A PRM requires step-by-step annotations: for every reasoning trace, a human (or stronger model) must label each individual step as correct or incorrect. This is dramatically more expensive — annotating a 5-step reasoning trace requires 5 judgments instead of 1, and each judgment requires understanding the reasoning context.

## Feedback Quality: Precision vs Simplicity

ORMs give binary feedback: the answer is right or wrong. This is sufficient for filtering (keep good answers, discard bad ones) but tells you nothing about where reasoning went wrong. A model could get the right answer through flawed reasoning (errors canceling out), and an ORM would score it positively. PRMs provide surgical feedback — they can pinpoint exactly which step introduced an error. This is invaluable for debugging model reasoning and for RL training, where you want to reinforce good reasoning steps and penalize bad ones, not just reward lucky outcomes.

## Training and Deployment

ORMs are simpler to train: they're essentially binary classifiers that take (reasoning + answer) as input and output a correctness score. Standard classification techniques work well. PRMs are more complex: they need to score each step in a sequence, which requires sequence labeling architectures and careful handling of step boundaries. PRMs also need more compute at inference time since they evaluate every step, while ORMs only look at the final answer. However, the extra complexity of PRMs pays off in training quality — RL with PRM feedback converges faster and produces better reasoning models.

## Choosing Between Them

Use ORMs when you need quick evaluation at scale, when answer correctness is easily verifiable, or when you're building filtering pipelines (e.g., best-of-N sampling). Use PRMs when you're doing serious RL training to improve reasoning, when you need to debug model failures, or when answer correctness alone isn't sufficient (e.g., the reasoning quality matters for trust and safety). In practice, many teams start with ORMs for their simplicity and graduate to PRMs when they need finer-grained control over reasoning quality.`,
      JSON.stringify([
        "Think about what data each approach needs — answer labels vs step-by-step annotations",
        "ORM says 'right or wrong'; PRM says 'step 3 is where it went wrong'",
        "PRMs are harder to train but give much better feedback for improving models",
        "Consider when each is most practical given resource constraints",
      ]),
      "intermediate",
      2,
    ]
  );

  // Concept 10.3: Multi-Agent Deep Research
  const concept10_3Id = nanoid();
  db.run(
    `INSERT INTO concepts (id, lesson_id, title, explanation, order_index)
     VALUES (?, ?, ?, ?, ?)`,
    [
      concept10_3Id,
      lesson10Id,
      "Multi-Agent Deep Research",
      `# Multi-Agent Deep Research

Complex research questions rarely have a single search query that answers them. Multi-agent deep research systems **decompose** complex queries, **research** sub-questions in parallel, and **synthesize** findings into coherent reports.

## The Planner-Researcher-Synthesizer Architecture

\`\`\`
         ┌─────────────────────────────┐
         │         User Query           │
         │ "Compare React vs Vue for    │
         │  enterprise applications"    │
         └─────────────┬───────────────┘
                       │
                       ▼
              ┌──────────────┐
              │   PLANNER     │
              │ Decomposes    │
              │ into 1-5      │
              │ sub-questions │
              └──────┬───────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
   ┌─────────┐ ┌─────────┐ ┌─────────┐
   │RESEARCHER│ │RESEARCHER│ │RESEARCHER│
   │ "React   │ │ "Vue     │ │ "Enter-  │
   │  features│ │  features│ │  prise   │
   │  & perf" │ │  & perf" │ │  needs"  │
   └────┬─────┘ └────┬─────┘ └────┬─────┘
        │            │            │
        └────────────┼────────────┘
                     ▼
            ┌──────────────┐
            │  SYNTHESIZER  │
            │  Combines all │
            │  findings into│
            │  final report │
            └──────────────┘
\`\`\`

## The Three Roles

### 1. Planner
Takes the complex query and decomposes it into **focused sub-questions**:
- "What are React's key features for enterprise use?"
- "What are Vue's key features for enterprise use?"
- "What do enterprise applications typically need from a framework?"

### 2. Researchers (Parallel)
Each researcher handles one sub-question:
- Searches for relevant information
- Summarizes findings
- Runs **in parallel** for speed (independent sub-questions)

### 3. Synthesizer
Combines all research findings into a coherent report:
- Identifies common themes across findings
- Resolves contradictions
- Produces a structured, readable output

## Why This Pattern Works

| Single Agent | Multi-Agent |
|-------------|-------------|
| One search query for complex question | Targeted queries for each aspect |
| May miss important angles | Systematic coverage of all aspects |
| Sequential processing | Parallel research for speed |
| Overloaded context window | Each agent has focused context |

## Production Examples

- **Perplexity**: Decomposes queries, runs parallel searches, synthesizes
- **Google AI Overviews**: Multi-source research combined into summaries
- **OpenAI Deep Research**: Hours-long research with multiple agent rounds

## Design Considerations

1. **Max sub-questions**: Limit decomposition (3-5 is typical) to control cost
2. **Researcher timeout**: Set time limits so one slow researcher doesn't block everything
3. **Dedup**: Overlapping sub-questions waste effort — the planner should ensure distinct angles
4. **Synthesis quality**: The synthesizer is often the most important agent — it determines the final output quality`,
      3,
    ]
  );

  // Challenge 10.3.1: Implement a task decomposer
  const challenge10_3_1Id = nanoid();
  db.run(
    `INSERT INTO challenges (id, concept_id, type, title, description, starter_code, solution_code, hints, difficulty, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      challenge10_3_1Id,
      concept10_3Id,
      "implement",
      "Implement a task decomposer",
      `Implement a \`decompose_query\` function that breaks a complex query into focused sub-questions.

**Parameters:**
- \`query\` — a string containing the research question
- \`max_subquestions\` — maximum number of sub-questions to return (default 3)

**Splitting strategy** (in order of priority):
1. Split on \`" and "\` (case-insensitive)
2. If no split found, split on \`" vs "\` or \`" versus "\` (case-insensitive)
3. If no split found, split on \`"; "\` (semicolons)
4. If still no split found, return \`[query]\` as-is (it's already simple)

**Post-processing each sub-question:**
- Strip whitespace
- Remove empty strings
- Add "?" at the end if not already present
- Limit to \`max_subquestions\` items

**Examples:**
\`\`\`python
decompose_query("What is ML and how does it differ from DL?")
# => ["What is ML?", "how does it differ from DL?"]

decompose_query("What is the capital of France?")
# => ["What is the capital of France?"]
\`\`\``,
      `import re

def decompose_query(query, max_subquestions=3):
    # Your code here
    pass`,
      `import re

def decompose_query(query, max_subquestions=3):
    # Try splitting strategies in order
    parts = None

    # Strategy 1: split on " and "
    if re.search(r'\\band\\b', query, re.IGNORECASE):
        parts = re.split(r'\\s+and\\s+', query, flags=re.IGNORECASE)

    # Strategy 2: split on " vs " or " versus "
    if parts is None or len(parts) <= 1:
        if re.search(r'\\b(?:vs|versus)\\b', query, re.IGNORECASE):
            parts = re.split(r'\\s+(?:vs|versus)\\s+', query, flags=re.IGNORECASE)

    # Strategy 3: split on "; "
    if parts is None or len(parts) <= 1:
        if '; ' in query:
            parts = query.split('; ')

    # Strategy 4: no split found
    if parts is None or len(parts) <= 1:
        q = query.strip()
        if not q.endswith('?'):
            q += '?'
        return [q]

    # Post-process
    result = []
    for p in parts:
        p = p.strip()
        if p:
            if not p.endswith('?'):
                p += '?'
            result.append(p)

    return result[:max_subquestions]`,
      JSON.stringify([
        "Try splitting on ' and ' first, then ' vs '/' versus ', then '; '",
        "Use re.split with case-insensitive flag for 'and', 'vs', 'versus'",
        "After splitting, strip whitespace and filter empty strings",
        "Add '?' to sub-questions that don't already end with one",
        "Slice the result to max_subquestions",
      ]),
      "intermediate",
      1,
    ]
  );

  for (const tc of [
    {
      input: ["What is machine learning and how does it differ from deep learning?"],
      expected: ["What is machine learning?", "how does it differ from deep learning?"],
      desc: "Splits on 'and' into two sub-questions",
      order: 1,
    },
    {
      input: ["Compare Python vs JavaScript for web development"],
      expected: ["Compare Python?", "JavaScript for web development?"],
      desc: "Splits on 'vs' into two parts",
      order: 2,
    },
    {
      input: ["What is the capital of France?"],
      expected: ["What is the capital of France?"],
      desc: "Simple query with no split returns as-is",
      order: 3,
    },
    {
      input: ["Explain RAG; describe embeddings; compare vector stores"],
      expected: ["Explain RAG?", "describe embeddings?", "compare vector stores?"],
      desc: "Splits on semicolons into three sub-questions",
      order: 4,
    },
    {
      input: ["A and B and C and D", 2],
      expected: ["A?", "B?"],
      desc: "Limits to max_subquestions",
      order: 5,
    },
  ]) {
    db.run(
      `INSERT INTO test_cases (id, challenge_id, input, expected_output, description, order_index)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nanoid(),
        challenge10_3_1Id,
        JSON.stringify(tc.input),
        JSON.stringify(tc.expected),
        tc.desc,
        tc.order,
      ]
    );
  }

  // Challenge 10.3.2: Build a research result synthesizer
  const challenge10_3_2Id = nanoid();
  db.run(
    `INSERT INTO challenges (id, concept_id, type, title, description, starter_code, solution_code, hints, difficulty, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      challenge10_3_2Id,
      concept10_3Id,
      "implement",
      "Build a research result synthesizer",
      `Implement a \`synthesize_findings\` function that combines research findings into a formatted markdown report.

**Parameters:**
- \`query\` — the original research question
- \`findings\` — a list of dicts, each with \`"question"\` and \`"summary"\` keys

**Returns** a markdown-formatted string with this structure:
\`\`\`
# Research Report: {query}

## Findings

### {finding_1_question}
{finding_1_summary}

### {finding_2_question}
{finding_2_summary}

## Summary
This report covers {N} research areas related to: {query}
\`\`\`

**Special case:** If findings is empty, the Findings section should contain only \`"No findings available."\` and the summary should say "0 research areas".

**Example:**
\`\`\`python
synthesize_findings("What is AI?", [{"question": "What is ML?", "summary": "ML is..."}])
\`\`\``,
      `def synthesize_findings(query, findings):
    # Your code here
    pass`,
      `def synthesize_findings(query, findings):
    lines = [f"# Research Report: {query}", "", "## Findings", ""]

    if not findings:
        lines.append("No findings available.")
    else:
        for i, f in enumerate(findings):
            lines.append(f"### {f['question']}")
            lines.append(f"{f['summary']}")
            if i < len(findings) - 1:
                lines.append("")

    lines.append("")
    lines.append("## Summary")
    lines.append(f"This report covers {len(findings)} research areas related to: {query}")

    return "\\n".join(lines)`,
      JSON.stringify([
        "Build the report as a list of lines, then join with newlines",
        "Start with the title: # Research Report: {query}",
        "Add each finding as ### {question} followed by the summary",
        "Handle the empty findings case with 'No findings available.'",
        "End with ## Summary showing the count of research areas",
      ]),
      "intermediate",
      2,
    ]
  );

  for (const tc of [
    {
      input: [
        "What is AI?",
        [{ question: "What is ML?", summary: "ML is a subset of AI focused on learning from data." }],
      ],
      expected:
        "# Research Report: What is AI?\n\n## Findings\n\n### What is ML?\nML is a subset of AI focused on learning from data.\n\n## Summary\nThis report covers 1 research areas related to: What is AI?",
      desc: "Single finding produces correct report",
      order: 1,
    },
    {
      input: [
        "Compare frameworks",
        [
          { question: "What is React?", summary: "React is a UI library." },
          { question: "What is Vue?", summary: "Vue is a progressive framework." },
        ],
      ],
      expected:
        "# Research Report: Compare frameworks\n\n## Findings\n\n### What is React?\nReact is a UI library.\n\n### What is Vue?\nVue is a progressive framework.\n\n## Summary\nThis report covers 2 research areas related to: Compare frameworks",
      desc: "Multiple findings all present with correct headers",
      order: 2,
    },
    {
      input: ["Test query", []],
      expected:
        "# Research Report: Test query\n\n## Findings\n\nNo findings available.\n\n## Summary\nThis report covers 0 research areas related to: Test query",
      desc: "Empty findings shows 'No findings available.'",
      order: 3,
    },
    {
      input: [
        "Special chars",
        [{ question: "What about C++ & Rust?", summary: "Both are systems languages with <different> approaches." }],
      ],
      expected:
        "# Research Report: Special chars\n\n## Findings\n\n### What about C++ & Rust?\nBoth are systems languages with <different> approaches.\n\n## Summary\nThis report covers 1 research areas related to: Special chars",
      desc: "Special characters preserved correctly",
      order: 4,
    },
  ]) {
    db.run(
      `INSERT INTO test_cases (id, challenge_id, input, expected_output, description, order_index)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nanoid(),
        challenge10_3_2Id,
        JSON.stringify(tc.input),
        JSON.stringify(tc.expected),
        tc.desc,
        tc.order,
      ]
    );
  }

  // Challenge 10.3.3: Explain multi-agent deep research architecture
  db.run(
    `INSERT INTO challenges (id, concept_id, type, title, description, starter_code, solution_code, hints, difficulty, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      nanoid(),
      concept10_3Id,
      "explain",
      "Explain multi-agent deep research architecture",
      `Explain the **Planner-Researcher-Synthesizer** pattern used in multi-agent deep research systems.

Consider these aspects:
1. **Why decomposition helps** — Why can't a single agent handle complex research questions?
2. **Benefits of parallel research** — What does running researchers in parallel gain?
3. **How synthesis creates coherent output** — What's the synthesizer's role and why is it critical?

Write a clear explanation (3-4 paragraphs).`,
      null,
      `## Why Decomposition Is Essential

Complex research questions are rarely answerable by a single search query. "Compare React vs Vue for enterprise applications" requires understanding React's features, Vue's features, and enterprise requirements — three distinct research threads. A single agent trying to handle this in one pass would either produce a superficial answer (not enough depth on any aspect) or an unfocused one (trying to cover everything at once). The Planner decomposes the complex query into 3-5 focused sub-questions, each of which can be thoroughly researched. This decomposition mirrors how human researchers work: break a big question into manageable pieces, research each one, then combine the results.

## The Power of Parallel Research

Once sub-questions are defined, each Researcher handles one independently. This parallelism provides two key benefits: speed and focus. Speed is straightforward — three parallel searches complete in the time of one, rather than three sequential searches. Focus is subtler but equally important: each Researcher agent has a narrow context window focused on its specific sub-question. It doesn't need to juggle multiple threads of inquiry or decide which aspect to prioritize. This focused attention typically produces higher-quality findings per sub-question than a single agent trying to research everything at once.

## The Critical Role of Synthesis

The Synthesizer is often the most important component in the pipeline. Raw findings from individual Researchers are fragmented — each covers one aspect in isolation. The Synthesizer's job is to weave these fragments into a coherent narrative: identifying common themes, resolving contradictions between findings, adding comparative analysis, and structuring the output for readability. Without good synthesis, you just have a collection of separate summaries. With it, you have an integrated research report that's greater than the sum of its parts.

## Production Impact

This pattern is used by major production systems. Perplexity decomposes user queries and runs parallel web searches before synthesizing results. Google's AI Overviews pull from multiple sources simultaneously. The pattern scales well: you can adjust the number of sub-questions for depth vs. cost, add specialist researchers for different domains (web search, academic papers, code repositories), and even run multiple synthesis rounds for quality. The key architectural insight is that decomposition + parallel research + synthesis consistently outperforms single-agent approaches on complex questions.`,
      JSON.stringify([
        "Think about why a single search query fails for complex multi-part questions",
        "Parallel research is faster AND produces better results due to focused context",
        "The synthesizer turns fragmented findings into a coherent report",
        "This pattern is used in production by Perplexity, Google AI Overviews, and OpenAI",
      ]),
      "beginner",
      3,
    ]
  );

  console.log("Database seeded successfully!");
  console.log("- 10 lessons");
  console.log("- 31 concepts");
  console.log("- 50 challenges");
}

seed();
