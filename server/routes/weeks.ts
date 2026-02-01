import { Hono } from "hono";
import { getPublishedWeeks, getWeekDetail } from "../services/week-service";

const app = new Hono();

/**
 * GET /api/weeks
 * List all published weeks with lesson/vocabulary counts
 */
app.get("/", (c) => {
  const weeks = getPublishedWeeks();

  return c.json(
    weeks.map((w) => ({
      id: w.id,
      weekNumber: w.week_number,
      slug: w.slug,
      title: w.title,
      description: w.description,
      startDate: w.start_date,
      endDate: w.end_date,
      orderIndex: w.order_index,
      lessonCount: w.lessonCount,
      vocabularyCount: w.vocabularyCount,
    }))
  );
});

/**
 * GET /api/weeks/:slug
 * Get week detail with lessons and their counts
 */
app.get("/:slug", (c) => {
  const slug = c.req.param("slug");
  const week = getWeekDetail(slug);

  if (!week) {
    return c.json({ error: "Week not found" }, 404);
  }

  return c.json({
    id: week.id,
    weekNumber: week.week_number,
    slug: week.slug,
    title: week.title,
    description: week.description,
    startDate: week.start_date,
    endDate: week.end_date,
    orderIndex: week.order_index,
    isPublished: week.is_published === 1,
    lessons: week.lessons,
  });
});

export default app;
