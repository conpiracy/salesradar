#!/usr/bin/env tsx

/**
 * Development seed script
 * Populates the database with lessons and opportunities
 *
 * Usage: npm run seed
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import lessonsData from "./fixtures/lessons.json";
import opportunitiesData from "./fixtures/opportunities.json";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;

if (!CONVEX_URL) {
  console.error("Error: CONVEX_URL not found in environment variables");
  console.error("Please set NEXT_PUBLIC_CONVEX_URL or CONVEX_URL");
  console.error("Run 'npx convex dev' to start Convex and get your deployment URL");
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

async function seed() {
  console.log("🌱 Starting seed process...\n");

  // Seed lessons
  console.log("📚 Seeding lessons...");
  try {
    const lessonResults = await client.mutation(api.courses.seedLessons, {
      lessons: lessonsData,
    });
    console.log(`✓ Seeded ${lessonResults.length} lessons\n`);
  } catch (error: any) {
    console.error("✗ Error seeding lessons:", error.message);
  }

  // Seed opportunities
  console.log("💼 Seeding opportunities...");
  try {
    const oppResults = await client.mutation(api.opportunities.ingestBatch, {
      source: "Seed Data",
      items: opportunitiesData,
    });
    console.log(`✓ Seeded ${oppResults.length} opportunities\n`);
  } catch (error: any) {
    console.error("✗ Error seeding opportunities:", error.message);
  }

  console.log("🎉 Seed complete!\n");
  console.log("Next steps:");
  console.log("1. Visit http://localhost:3000/start to create a seller account");
  console.log("2. Complete lessons at http://localhost:3000/lessons");
  console.log("3. Browse opportunities at http://localhost:3000/opps");
  console.log("4. Check the leaderboard at http://localhost:3000/leaderboard\n");
}

seed().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
