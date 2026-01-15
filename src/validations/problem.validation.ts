import { z } from "zod";

// zod validation
const templateFileSchema = z.object({
  content: z.string().min(1, "Template content is required"),
});

const languageTemplateSchema = z.object({
  files: z.array(templateFileSchema).min(1, "At least one file is required"),
});

// Problem schema
export const createProblemSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  difficulty: z.enum(["easy", "medium", "hard"]),
  description: z.string().min(1, "Description is required"),
  constraints: z.string().min(1, "Constraints are required"),
  tags: z.array(z.string()).optional(),
  templates: z.object({
    python: languageTemplateSchema.optional(),
    java: languageTemplateSchema.optional(),
    cpp: languageTemplateSchema.optional(),
    c: languageTemplateSchema.optional(),
  }),
});