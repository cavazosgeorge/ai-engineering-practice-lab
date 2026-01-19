# AI Engineering Practice Lab

A learning application for practicing AI/ML engineering fundamentals, designed to reinforce concepts from the AI Engineering cohort and prepare for technical interviews.

## Quick Start

```bash
# Install dependencies
bun install

# Seed the database with lessons
bun run db:seed

# Start development server
bun dev
```

The app will be available at `http://localhost:5173` (frontend) and `http://localhost:3000` (API).

## Current Lessons

| # | Lesson | Concepts | Source |
|---|--------|----------|--------|
| 1 | Tokenization | Word-level, Character-level, BPE/Subword | Project 1 |
| 2 | Language Models | Linear Layers, Softmax | Project 1 |
| 3 | Text Generation (Decoding) | Greedy, Top-k, Top-p, Temperature | Project 1 |
| 4 | Completion vs Instruction-Tuned | Base LLMs, Instruction-tuning, Chat Templates | Project 1 |
| 5 | Building LLM Applications | The Complete LLM Pipeline | Project 1 |

## Adding New Lessons

When new content becomes available from the AI Engineering cohort (Projects 2-6), follow these steps to add lessons:

### 1. Review the Source Material

Look at the Jupyter notebook or course materials for the new project. Identify:
- Main topics (these become **Lessons**)
- Sub-topics within each (these become **Concepts**)
- Coding exercises (these become **Challenges**)

### 2. Edit the Seed Script

Open `server/scripts/seed-lessons.ts` and add your new lesson following the existing pattern:

```typescript
// ============================================
// LESSON X: YOUR NEW LESSON
// ============================================
const lessonXId = nanoid();
db.run(
  `INSERT INTO lessons (id, title, slug, description, order_index, is_published)
   VALUES (?, ?, ?, ?, ?, ?)`,
  [
    lessonXId,
    "Your Lesson Title",
    "your-lesson-slug",  // URL-friendly, lowercase with hyphens
    "Description of what this lesson covers.",
    6,  // Next order_index after existing lessons
    1,  // 1 = published, 0 = draft
  ]
);
```

### 3. Add Concepts

Each lesson should have 2-5 concepts. Concepts contain the educational explanation:

```typescript
const conceptX_1Id = nanoid();
db.run(
  `INSERT INTO concepts (id, lesson_id, title, explanation, order_index)
   VALUES (?, ?, ?, ?, ?)`,
  [
    conceptX_1Id,
    lessonXId,
    "Concept Title",
    `# Concept Title

Your explanation in Markdown format.

## How it works
1. Step one
2. Step two

## Example
\`\`\`javascript
// Code example
\`\`\`

## Key Points
- Point 1
- Point 2`,
    1,  // order within the lesson
  ]
);
```

### 4. Add Challenges

Challenges are the practice exercises. There are four types:

#### `implement` - Write code that passes tests

```typescript
const challengeId = nanoid();
db.run(
  `INSERT INTO challenges (id, concept_id, type, title, description, starter_code, solution_code, hints, difficulty, order_index)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [
    challengeId,
    conceptX_1Id,
    "implement",
    "Implement function name",
    `Description of what to implement.

**Example:**
\`\`\`javascript
myFunction(input); // => expected output
\`\`\``,
    `function myFunction(param) {
  // Your code here
}`,
    `function myFunction(param) {
  // Solution code
  return result;
}`,
    JSON.stringify([
      "Hint 1",
      "Hint 2",
      "Hint 3",
    ]),
    "beginner",  // beginner, intermediate, advanced
    1,
  ]
);

// Add test cases
for (const tc of [
  { input: [arg1, arg2], expected: result, desc: "Test description", order: 1 },
  { input: [arg1, arg2], expected: result, desc: "Another test", order: 2 },
]) {
  db.run(
    `INSERT INTO test_cases (id, challenge_id, input, expected_output, description, order_index)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      nanoid(),
      challengeId,
      JSON.stringify(tc.input),
      JSON.stringify(tc.expected),
      tc.desc,
      tc.order,
    ]
  );
}
```

#### `explain` - Written explanation (no code tests)

```typescript
db.run(
  `INSERT INTO challenges (id, concept_id, type, title, description, starter_code, solution_code, hints, difficulty, order_index)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [
    nanoid(),
    conceptId,
    "explain",
    "Explain the concept",
    `Write an explanation covering:
1. Point one
2. Point two
3. Point three`,
    null,  // No starter code for explain
    null,  // No solution code
    JSON.stringify(["Hint about what to cover"]),
    "intermediate",
    1,
  ]
);
```

### 5. Update the Summary Count

At the end of the seed script, update the console.log counts:

```typescript
console.log("Database seeded successfully!");
console.log("- X lessons");      // Update this
console.log("- Y concepts");     // Update this
console.log("- Z challenges");   // Update this
```

### 6. Run the Seed Script

```bash
# This clears existing data and reseeds everything
bun run db:seed
```

### 7. Verify in the App

Start the dev server and check that your new lessons appear:
- Dashboard should show all lessons
- Each lesson should have its concepts
- Challenges should load with their test cases

## Example: Adding RAG Content (Project 2)

When Project 2 (RAG) becomes available, you might add:

```typescript
// LESSON 6: RETRIEVAL-AUGMENTED GENERATION (RAG)
const lesson6Id = nanoid();
db.run(`INSERT INTO lessons...`, [
  lesson6Id,
  "Retrieval-Augmented Generation",
  "rag",
  "Learn how to enhance LLM responses with external knowledge retrieval.",
  6, 1,
]);

// Concept 6.1: Embeddings
// Concept 6.2: Vector Databases
// Concept 6.3: Semantic Search
// Concept 6.4: RAG Pipeline

// Challenges:
// - Implement cosine similarity
// - Implement k-nearest neighbors
// - Build a simple retrieval pipeline
```

## Project Structure

```
server/
├── db/
│   ├── index.ts           # Database connection + migration runner
│   └── migrations/        # SQL migration files
├── routes/
│   ├── lessons.ts         # GET /api/lessons
│   ├── challenges.ts      # GET/POST /api/challenges
│   └── progress.ts        # User progress tracking
├── services/
│   ├── code-validator.ts  # Runs user code against tests
│   └── spaced-repetition.ts  # SM-2 algorithm
└── scripts/
    └── seed-lessons.ts    # ← ADD NEW LESSONS HERE
```

## Database Schema

| Table | Purpose |
|-------|---------|
| `lessons` | Top-level topics (Tokenization, RAG, etc.) |
| `concepts` | Sub-topics with explanations |
| `challenges` | Practice problems |
| `test_cases` | Input/output pairs for validation |
| `user_progress` | SM-2 spaced repetition tracking |
| `submissions` | User code submission history |

## Tips for Good Challenges

1. **Start simple** - First test case should be the simplest possible
2. **Build complexity** - Each test adds a new edge case
3. **Match the course** - Use similar examples to the Jupyter notebooks
4. **Provide good hints** - 3 hints that progressively reveal the solution
5. **Test your solution** - Run the seed, then try solving the challenge yourself

## Expected Future Lessons

Based on the AI Engineering cohort curriculum:

| Week | Project | Potential Lessons |
|------|---------|-------------------|
| 2 | RAG | Embeddings, Vector DBs, Semantic Search |
| 3 | Agents | Tool Use, ReAct Pattern, Agent Loops |
| 4 | Fine-tuning | LoRA, Dataset Preparation, Training |
| 5 | Evaluation | Metrics, Benchmarks, A/B Testing |
| 6 | Production | Deployment, Monitoring, Optimization |

## Commands Reference

```bash
bun dev           # Start development (client + server)
bun run build     # Production build
bun run db:seed   # Seed/reseed database
bun run lint      # Run ESLint
```
