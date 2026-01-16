import { z } from "zod";

export const slugParamSchema = z.object({
  slug: z.string().min(1, "Slug is required"),
});

const problemExampleSchema = z.object({
  input: z.string().min(1, "Input is required"),
  output: z.string().min(1, "Output is required"),
  explanation: z.string().optional(),
});

export const createProblemSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  difficulty: z.enum(["easy", "medium", "hard"]),
  description: z.string().min(1),
  examples: z.array(problemExampleSchema).optional(),
  constraints: z.string().min(1),
  tags: z.array(z.string()).optional(),
  templates: z.object({
    python: z.any().optional(),
    java: z.any().optional(),
    cpp: z.any().optional(),
    c: z.any().optional(),
  }),
});

export const updateProblemSchema = createProblemSchema.partial();
