import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { questions } from "@db/schema";
import { eq } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  // Get all questions
  app.get("/api/questions", async (req, res) => {
    try {
      const allQuestions = await db.select().from(questions);
      res.json(allQuestions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch questions" });
    }
  });

  // Add a new question
  app.post("/api/questions", async (req, res) => {
    try {
      const { question, answers, correct } = req.body;
      
      if (!question || !answers || !correct) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const [newQuestion] = await db.insert(questions).values({
        question,
        answers,
        correct
      }).returning();

      res.status(201).json(newQuestion);
    } catch (error) {
      res.status(500).json({ error: "Failed to add question" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
