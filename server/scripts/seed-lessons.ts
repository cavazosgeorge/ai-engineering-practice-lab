import { nanoid } from "nanoid";
import { db, schema } from "../db";

async function seed() {
  console.log("Seeding database...");

  // Clear existing data
  await db.delete(schema.testCases);
  await db.delete(schema.challenges);
  await db.delete(schema.concepts);
  await db.delete(schema.lessons);

  // ============================================
  // LESSON 1: TOKENIZATION
  // ============================================
  const lesson1Id = nanoid();
  await db.insert(schema.lessons).values({
    id: lesson1Id,
    title: "Tokenization",
    slug: "tokenization",
    description: "Learn how text is converted into tokens that language models can process. Covers word-level, character-level, and subword (BPE) tokenization.",
    orderIndex: 1,
    isPublished: true,
  });

  // Concept 1.1: Word-Level Tokenization
  const concept1_1Id = nanoid();
  await db.insert(schema.concepts).values({
    id: concept1_1Id,
    lessonId: lesson1Id,
    title: "Word-Level Tokenization",
    explanation: `# Word-Level Tokenization

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
    orderIndex: 1,
  });

  // Challenge 1.1.1: Implement encode()
  const challenge1_1_1Id = nanoid();
  await db.insert(schema.challenges).values({
    id: challenge1_1_1Id,
    conceptId: concept1_1Id,
    type: "implement",
    title: "Implement word-level encode()",
    description: `Create an \`encode\` function that takes a string and a vocabulary mapping, and returns an array of token IDs.

The function should:
- Split the input text on whitespace
- Look up each word in the vocabulary
- Return an array of token IDs

**Example:**
\`\`\`javascript
const vocab = { "hello": 0, "world": 1 };
encode("hello world", vocab); // => [0, 1]
\`\`\``,
    starterCode: `function encode(text, vocab) {
  // Your code here
}`,
    solutionCode: `function encode(text, vocab) {
  return text.split(' ').map(word => vocab[word]);
}`,
    hints: [
      "Start by splitting the text on whitespace using split(' ')",
      "Use map() to transform each word into its vocabulary ID",
      "For each word, look it up in the vocab object: vocab[word]"
    ],
    difficulty: "beginner",
    orderIndex: 1,
  });

  // Test cases for encode()
  await db.insert(schema.testCases).values([
    {
      id: nanoid(),
      challengeId: challenge1_1_1Id,
      input: ["hello world", { "hello": 0, "world": 1 }],
      expectedOutput: [0, 1],
      description: "Basic two-word encoding",
      orderIndex: 1,
    },
    {
      id: nanoid(),
      challengeId: challenge1_1_1Id,
      input: ["the quick fox", { "the": 0, "quick": 1, "brown": 2, "fox": 3 }],
      expectedOutput: [0, 1, 3],
      description: "Three words with unused vocab entry",
      orderIndex: 2,
    },
    {
      id: nanoid(),
      challengeId: challenge1_1_1Id,
      input: ["a", { "a": 42 }],
      expectedOutput: [42],
      description: "Single word",
      orderIndex: 3,
    },
  ]);

  // Challenge 1.1.2: Implement decode()
  const challenge1_1_2Id = nanoid();
  await db.insert(schema.challenges).values({
    id: challenge1_1_2Id,
    conceptId: concept1_1Id,
    type: "implement",
    title: "Implement word-level decode()",
    description: `Create a \`decode\` function that takes an array of token IDs and a vocabulary mapping, and returns the original text.

The function should:
- Build a reverse mapping from IDs to words
- Convert each ID back to its word
- Join the words with spaces

**Example:**
\`\`\`javascript
const vocab = { "hello": 0, "world": 1 };
decode([0, 1], vocab); // => "hello world"
\`\`\``,
    starterCode: `function decode(ids, vocab) {
  // Your code here
}`,
    solutionCode: `function decode(ids, vocab) {
  const reverseVocab = Object.fromEntries(
    Object.entries(vocab).map(([word, id]) => [id, word])
  );
  return ids.map(id => reverseVocab[id]).join(' ');
}`,
    hints: [
      "You need to create a reverse mapping: ID -> word",
      "Use Object.entries() to get [word, id] pairs, then swap them",
      "Object.fromEntries() can convert the swapped pairs back to an object"
    ],
    difficulty: "beginner",
    orderIndex: 2,
  });

  await db.insert(schema.testCases).values([
    {
      id: nanoid(),
      challengeId: challenge1_1_2Id,
      input: [[0, 1], { "hello": 0, "world": 1 }],
      expectedOutput: "hello world",
      description: "Basic two-word decoding",
      orderIndex: 1,
    },
    {
      id: nanoid(),
      challengeId: challenge1_1_2Id,
      input: [[2, 0, 1], { "the": 0, "cat": 1, "sat": 2 }],
      expectedOutput: "sat the cat",
      description: "Order matters",
      orderIndex: 2,
    },
  ]);

  // Challenge 1.1.3: Handle [UNK] tokens
  const challenge1_1_3Id = nanoid();
  await db.insert(schema.challenges).values({
    id: challenge1_1_3Id,
    conceptId: concept1_1Id,
    type: "implement",
    title: "Handle out-of-vocabulary words with [UNK]",
    description: `Modify the encode function to handle words not in the vocabulary by returning a special [UNK] token ID.

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
    starterCode: `function encode(text, vocab) {
  // Your code here
  // vocab["[UNK]"] contains the ID for unknown words
}`,
    solutionCode: `function encode(text, vocab) {
  const unkId = vocab["[UNK]"];
  return text.split(' ').map(word =>
    word in vocab ? vocab[word] : unkId
  );
}`,
    hints: [
      "Store the [UNK] token ID at the start: vocab['[UNK]']",
      "Check if each word exists in vocab before looking it up",
      "Use the 'in' operator or hasOwnProperty to check: word in vocab"
    ],
    difficulty: "beginner",
    orderIndex: 3,
  });

  await db.insert(schema.testCases).values([
    {
      id: nanoid(),
      challengeId: challenge1_1_3Id,
      input: ["hello universe", { "[UNK]": 0, "hello": 1, "world": 2 }],
      expectedOutput: [1, 0],
      description: "Unknown word becomes [UNK]",
      orderIndex: 1,
    },
    {
      id: nanoid(),
      challengeId: challenge1_1_3Id,
      input: ["foo bar baz", { "[UNK]": 99 }],
      expectedOutput: [99, 99, 99],
      description: "All unknown words",
      orderIndex: 2,
    },
    {
      id: nanoid(),
      challengeId: challenge1_1_3Id,
      input: ["the cat sat", { "[UNK]": 0, "the": 1, "cat": 2, "sat": 3 }],
      expectedOutput: [1, 2, 3],
      description: "All known words",
      orderIndex: 3,
    },
  ]);

  // Concept 1.2: Character-Level Tokenization
  const concept1_2Id = nanoid();
  await db.insert(schema.concepts).values({
    id: concept1_2Id,
    lessonId: lesson1Id,
    title: "Character-Level Tokenization",
    explanation: `# Character-Level Tokenization

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
    orderIndex: 2,
  });

  // Challenge 1.2.1: Build character vocabulary
  const challenge1_2_1Id = nanoid();
  await db.insert(schema.challenges).values({
    id: challenge1_2_1Id,
    conceptId: concept1_2Id,
    type: "implement",
    title: "Build a character vocabulary",
    description: `Create a function that builds a character-level vocabulary from a text corpus.

The function should:
- Extract all unique characters from the text
- Assign each character a unique ID starting from 0
- Return the vocabulary as an object mapping characters to IDs

**Example:**
\`\`\`javascript
buildVocab("hello"); // => { "h": 0, "e": 1, "l": 2, "o": 3 }
// Note: "l" appears twice but only gets one ID
\`\`\``,
    starterCode: `function buildVocab(text) {
  // Your code here
}`,
    solutionCode: `function buildVocab(text) {
  const chars = [...new Set(text)];
  return Object.fromEntries(chars.map((char, i) => [char, i]));
}`,
    hints: [
      "Use new Set() to get unique characters",
      "Spread the Set into an array: [...new Set(text)]",
      "Use map with index to assign IDs, then Object.fromEntries()"
    ],
    difficulty: "beginner",
    orderIndex: 1,
  });

  await db.insert(schema.testCases).values([
    {
      id: nanoid(),
      challengeId: challenge1_2_1Id,
      input: ["abc"],
      expectedOutput: { "a": 0, "b": 1, "c": 2 },
      description: "Simple three characters",
      orderIndex: 1,
    },
    {
      id: nanoid(),
      challengeId: challenge1_2_1Id,
      input: ["aaa"],
      expectedOutput: { "a": 0 },
      description: "Repeated character",
      orderIndex: 2,
    },
  ]);

  // Concept 1.3: Subword Tokenization (BPE)
  const concept1_3Id = nanoid();
  await db.insert(schema.concepts).values({
    id: concept1_3Id,
    lessonId: lesson1Id,
    title: "Subword Tokenization (BPE)",
    explanation: `# Byte-Pair Encoding (BPE)

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
    orderIndex: 3,
  });

  // Challenge 1.3.1: Explain BPE advantages
  const challenge1_3_1Id = nanoid();
  await db.insert(schema.challenges).values({
    id: challenge1_3_1Id,
    conceptId: concept1_3Id,
    type: "explain",
    title: "Why does BPE outperform word-level tokenization?",
    description: `Explain why Byte-Pair Encoding (BPE) generally works better than word-level tokenization for language models.

Consider these aspects in your answer:
1. **Vocabulary efficiency** - How does each method handle vocabulary size?
2. **Out-of-vocabulary handling** - What happens with rare or new words?
3. **Morphological awareness** - How does each handle word variations?
4. **Trade-offs** - What are the downsides of each approach?

Write a clear, concise explanation (3-5 paragraphs).`,
    starterCode: null,
    solutionCode: null,
    hints: [
      "Think about what happens when you encounter a word not in your vocabulary",
      "Consider words like 'unhappiness' - how would each method tokenize it?",
      "Think about vocabulary size: word-level needs millions of entries for good coverage"
    ],
    difficulty: "intermediate",
    orderIndex: 1,
  });

  // ============================================
  // LESSON 2: LANGUAGE MODELS
  // ============================================
  const lesson2Id = nanoid();
  await db.insert(schema.lessons).values({
    id: lesson2Id,
    title: "Language Models",
    slug: "language-models",
    description: "Understand how neural language models work, from embeddings to attention mechanisms.",
    orderIndex: 2,
    isPublished: true,
  });

  // Concept 2.1: Linear Layers
  const concept2_1Id = nanoid();
  await db.insert(schema.concepts).values({
    id: concept2_1Id,
    lessonId: lesson2Id,
    title: "Linear Layers",
    explanation: `# Linear Layers

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
    orderIndex: 1,
  });

  // Challenge 2.1.1: Implement linear layer
  const challenge2_1_1Id = nanoid();
  await db.insert(schema.challenges).values({
    id: challenge2_1_1Id,
    conceptId: concept2_1Id,
    type: "implement",
    title: "Implement a Linear layer forward pass",
    description: `Implement the forward pass of a linear layer: \`y = Wx + b\`

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
    starterCode: `function linear(x, W, b) {
  // x: input vector (array of numbers)
  // W: weight matrix (array of arrays)
  // b: bias vector (array of numbers)
  // Return: output vector
}`,
    solutionCode: `function linear(x, W, b) {
  return W.map((row, i) => {
    const dot = row.reduce((sum, w, j) => sum + w * x[j], 0);
    return dot + b[i];
  });
}`,
    hints: [
      "For each row of W, compute the dot product with x",
      "A dot product is: sum of (w[i] * x[i]) for all i",
      "Use reduce to compute the sum, then add the corresponding bias"
    ],
    difficulty: "intermediate",
    orderIndex: 1,
  });

  await db.insert(schema.testCases).values([
    {
      id: nanoid(),
      challengeId: challenge2_1_1Id,
      input: [[1, 1], [[1, 2], [3, 4]], [1, 1]],
      expectedOutput: [4, 8],
      description: "2x2 transformation",
      orderIndex: 1,
    },
    {
      id: nanoid(),
      challengeId: challenge2_1_1Id,
      input: [[1, 0], [[1, 0], [0, 1]], [0, 0]],
      expectedOutput: [1, 0],
      description: "Identity matrix, zero bias",
      orderIndex: 2,
    },
    {
      id: nanoid(),
      challengeId: challenge2_1_1Id,
      input: [[2, 3], [[1, 1]], [5]],
      expectedOutput: [10],
      description: "Projection to 1D",
      orderIndex: 3,
    },
  ]);

  // Concept 2.2: Softmax
  const concept2_2Id = nanoid();
  await db.insert(schema.concepts).values({
    id: concept2_2Id,
    lessonId: lesson2Id,
    title: "Softmax Function",
    explanation: `# Softmax Function

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
    orderIndex: 2,
  });

  // Challenge 2.2.1: Implement softmax
  const challenge2_2_1Id = nanoid();
  await db.insert(schema.challenges).values({
    id: challenge2_2_1Id,
    conceptId: concept2_2Id,
    type: "implement",
    title: "Implement the softmax function",
    description: `Implement the softmax function that converts logits to probabilities.

The function should:
- Apply the softmax formula: exp(x_i) / sum(exp(x_j))
- Handle numerical stability by subtracting the max value first
- Return an array of probabilities that sum to 1

**Example:**
\`\`\`javascript
softmax([1, 2, 3]); // => [0.09, 0.24, 0.67] (approximately)
\`\`\``,
    starterCode: `function softmax(logits) {
  // logits: array of numbers (raw scores)
  // Return: array of probabilities
}`,
    solutionCode: `function softmax(logits) {
  const maxVal = Math.max(...logits);
  const exps = logits.map(x => Math.exp(x - maxVal));
  const sumExps = exps.reduce((a, b) => a + b, 0);
  return exps.map(e => e / sumExps);
}`,
    hints: [
      "First subtract the max value from all logits for numerical stability",
      "Apply Math.exp() to each shifted value",
      "Divide each exp value by the sum of all exp values"
    ],
    difficulty: "intermediate",
    orderIndex: 1,
  });

  await db.insert(schema.testCases).values([
    {
      id: nanoid(),
      challengeId: challenge2_2_1Id,
      input: [[0, 0, 0]],
      expectedOutput: [0.3333333333333333, 0.3333333333333333, 0.3333333333333333],
      description: "Equal logits -> equal probabilities",
      orderIndex: 1,
    },
    {
      id: nanoid(),
      challengeId: challenge2_2_1Id,
      input: [[1000, 1000, 1000]],
      expectedOutput: [0.3333333333333333, 0.3333333333333333, 0.3333333333333333],
      description: "Large equal values (tests numerical stability)",
      orderIndex: 2,
    },
  ]);

  console.log("Database seeded successfully!");
  console.log("- 2 lessons");
  console.log("- 5 concepts");
  console.log("- 7 challenges");
}

seed().catch(console.error);
