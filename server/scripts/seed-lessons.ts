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

  console.log("Database seeded successfully!");
  console.log("- 6 lessons");
  console.log("- 17 concepts");
  console.log("- 26 challenges");
}

seed();
