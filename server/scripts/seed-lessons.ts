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
\`\`\`javascript
const vocab = { "hello": 0, "world": 1, "the": 2 };
// "hello world" -> [0, 1]
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
      `Create an \`encode\` function that takes a string and a vocabulary mapping, and returns an array of token IDs.

The function should:
- Split the input text on whitespace
- Look up each word in the vocabulary
- Return an array of token IDs

**Example:**
\`\`\`javascript
const vocab = { "hello": 0, "world": 1 };
encode("hello world", vocab); // => [0, 1]
\`\`\``,
      `function encode(text, vocab) {
  // Your code here
}`,
      `function encode(text, vocab) {
  return text.split(' ').map(word => vocab[word]);
}`,
      JSON.stringify([
        "Start by splitting the text on whitespace using split(' ')",
        "Use map() to transform each word into its vocabulary ID",
        "For each word, look it up in the vocab object: vocab[word]",
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
      `Create a \`decode\` function that takes an array of token IDs and a vocabulary mapping, and returns the original text.

The function should:
- Build a reverse mapping from IDs to words
- Convert each ID back to its word
- Join the words with spaces

**Example:**
\`\`\`javascript
const vocab = { "hello": 0, "world": 1 };
decode([0, 1], vocab); // => "hello world"
\`\`\``,
      `function decode(ids, vocab) {
  // Your code here
}`,
      `function decode(ids, vocab) {
  const reverseVocab = Object.fromEntries(
    Object.entries(vocab).map(([word, id]) => [id, word])
  );
  return ids.map(id => reverseVocab[id]).join(' ');
}`,
      JSON.stringify([
        "You need to create a reverse mapping: ID -> word",
        "Use Object.entries() to get [word, id] pairs, then swap them",
        "Object.fromEntries() can convert the swapped pairs back to an object",
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
\`\`\`javascript
const vocab = { "[UNK]": 0, "hello": 1, "world": 2 };
encode("hello universe", vocab); // => [1, 0]
// "universe" is not in vocab, so we use [UNK]'s ID (0)
\`\`\``,
      `function encode(text, vocab) {
  // Your code here
  // vocab["[UNK]"] contains the ID for unknown words
}`,
      `function encode(text, vocab) {
  const unkId = vocab["[UNK]"];
  return text.split(' ').map(word =>
    word in vocab ? vocab[word] : unkId
  );
}`,
      JSON.stringify([
        "Store the [UNK] token ID at the start: vocab['[UNK]']",
        "Check if each word exists in vocab before looking it up",
        "Use the 'in' operator or hasOwnProperty to check: word in vocab",
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
- Return the vocabulary as an object mapping characters to IDs

**Example:**
\`\`\`javascript
buildVocab("hello"); // => { "h": 0, "e": 1, "l": 2, "o": 3 }
// Note: "l" appears twice but only gets one ID
\`\`\``,
      `function buildVocab(text) {
  // Your code here
}`,
      `function buildVocab(text) {
  const chars = [...new Set(text)];
  return Object.fromEntries(chars.map((char, i) => [char, i]));
}`,
      JSON.stringify([
        "Use new Set() to get unique characters",
        "Spread the Set into an array: [...new Set(text)]",
        "Use map with index to assign IDs, then Object.fromEntries()",
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
\`\`\`javascript
const W = [[1, 2], [3, 4]];  // 2x2 matrix
const b = [1, 1];            // bias vector
const x = [1, 1];            // input vector

linear(x, W, b); // => [4, 8]
// W @ x = [1*1 + 2*1, 3*1 + 4*1] = [3, 7]
// + b = [3+1, 7+1] = [4, 8]
\`\`\``,
      `function linear(x, W, b) {
  // x: input vector (array of numbers)
  // W: weight matrix (array of arrays)
  // b: bias vector (array of numbers)
  // Return: output vector
}`,
      `function linear(x, W, b) {
  return W.map((row, i) => {
    const dot = row.reduce((sum, w, j) => sum + w * x[j], 0);
    return dot + b[i];
  });
}`,
      JSON.stringify([
        "For each row of W, compute the dot product with x",
        "A dot product is: sum of (w[i] * x[i]) for all i",
        "Use reduce to compute the sum, then add the corresponding bias",
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
\`\`\`
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
- Return an array of probabilities that sum to 1

**Example:**
\`\`\`javascript
softmax([1, 2, 3]); // => [0.09, 0.24, 0.67] (approximately)
\`\`\``,
      `function softmax(logits) {
  // logits: array of numbers (raw scores)
  // Return: array of probabilities
}`,
      `function softmax(logits) {
  const maxVal = Math.max(...logits);
  const exps = logits.map(x => Math.exp(x - maxVal));
  const sumExps = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / sumExps);
}`,
      JSON.stringify([
        "First subtract the max value from all logits for numerical stability",
        "Apply Math.exp() to each shifted value",
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

  console.log("Database seeded successfully!");
  console.log("- 2 lessons");
  console.log("- 5 concepts");
  console.log("- 7 challenges");
}

seed();
