/**
 * Seed weeks and link existing lessons to their corresponding weeks.
 *
 * Week-to-lesson mapping based on the AI Engineering cohort curriculum:
 *   Week 1: Tokenization, Language Models
 *   Week 2: Text Generation (Decoding)
 *   Week 3: Completion vs Instruction-Tuned Models, Building LLM Applications
 *   Week 4: RAG
 *   Week 5: Tool Calling, AI Agents
 *   Week 6: Inference-Time Reasoning, Deep Research Systems
 *
 * Usage: bun run db:seed-weeks
 */

import { nanoid } from "nanoid";
import { db, runMigrations } from "../db";

runMigrations();

console.log("Seeding weeks...");

// Clear existing weeks (CASCADE will clear data_sources, generation_jobs)
db.run("UPDATE lessons SET week_id = NULL");
db.run("DELETE FROM weeks");

const weeks = [
  {
    id: nanoid(),
    weekNumber: 1,
    slug: "week-1",
    title: "Week 1: Foundations — Tokenization & Language Models",
    description:
      "Introduction to how text becomes numbers. Covers tokenization strategies (word, character, BPE) and the building blocks of language models (linear layers, softmax).",
    lessonSlugs: ["tokenization", "language-models"],
  },
  {
    id: nanoid(),
    weekNumber: 2,
    slug: "week-2",
    title: "Week 2: Text Generation & Decoding Strategies",
    description:
      "How language models generate text. Explores greedy decoding, top-k sampling, top-p (nucleus) sampling, and temperature scaling.",
    lessonSlugs: ["text-generation"],
  },
  {
    id: nanoid(),
    weekNumber: 3,
    slug: "week-3",
    title: "Week 3: Model Types & LLM Applications",
    description:
      "Understanding completion vs instruction-tuned models, chat templates, and building end-to-end LLM applications.",
    lessonSlugs: ["model-types", "llm-applications"],
  },
  {
    id: nanoid(),
    weekNumber: 4,
    slug: "week-4",
    title: "Week 4: Retrieval-Augmented Generation (RAG)",
    description:
      "Building RAG systems: text chunking, embeddings, vector similarity search, and context-augmented prompting.",
    lessonSlugs: ["rag"],
  },
  {
    id: nanoid(),
    weekNumber: 5,
    slug: "week-5",
    title: "Week 5: Agents & Tool Calling",
    description:
      "AI agents that reason and act. Covers tool-calling patterns, multi-step planning, and agent architectures.",
    lessonSlugs: ["tool-calling", "ai-agents"],
  },
  {
    id: nanoid(),
    weekNumber: 6,
    slug: "week-6",
    title: "Week 6: Inference-Time Reasoning & Deep Research",
    description:
      "Advanced reasoning techniques at inference time. Covers chain-of-thought prompting, self-consistency, tree-of-thoughts, and building multi-agent deep research systems.",
    lessonSlugs: ["inference-time-reasoning", "deep-research"],
  },
];

const now = new Date().toISOString();

db.transaction(() => {
  for (let i = 0; i < weeks.length; i++) {
    const week = weeks[i];

    db.run(
      `INSERT INTO weeks (id, week_number, slug, title, description, is_published, order_index, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        week.id,
        week.weekNumber,
        week.slug,
        week.title,
        week.description,
        1, // published
        i,
        now,
        now,
      ]
    );

    // Link lessons to this week
    for (const lessonSlug of week.lessonSlugs) {
      const result = db.run(
        `UPDATE lessons SET week_id = ? WHERE slug = ?`,
        [week.id, lessonSlug]
      );

      if (result.changes > 0) {
        console.log(`  Linked lesson "${lessonSlug}" → ${week.slug}`);
      } else {
        console.log(`  Warning: lesson "${lessonSlug}" not found`);
      }
    }
  }
})();

console.log(`Seeded ${weeks.length} weeks.`);
