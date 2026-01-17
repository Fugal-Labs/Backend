import { Request, Response } from 'express';
import * as problemService from '@/services/problem.service';
import { ApiResponse } from '@/utils/api-response';
import { asyncHandler } from '@/utils/asyncHandler';
import {
  createProblemSchema,
  slugParamSchema,
  updateProblemSchema,
} from '@/validations/problem.validator';

// create problem
export const createProblem = asyncHandler(async (req: Request, res: Response) => {
  const payload = createProblemSchema.parse(req.body);

  const problemData = {
    title: payload.title,
    slug: payload.slug,
    difficulty: payload.difficulty,
    description: payload.description,
    constraints: payload.constraints,
    examples: payload.examples ?? [],
    tags: payload.tags ?? [],

    // templates
    templates: {
      python: payload.templates.python,
      java: payload.templates.java,
      cpp: payload.templates.cpp,
      c: payload.templates.c,
    },

    // system generated
    status: 'pending' as const,
    totalSubmissions: 0,
    acceptedSubmissions: 0,
  };

  const problem = await problemService.createProblem(problemData);

  res.status(201).json(new ApiResponse(201, problem, 'Problem created successfully'));
});

//get all problems

export const getProblems = asyncHandler(async (_req: Request, res: Response) => {
  const problems = await problemService.getAllProblems();

  res.status(200).json(new ApiResponse(200, problems, 'Problems fetched successfully'));
});

//get single problem
export const getProblemBySlug = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = slugParamSchema.parse(req.params);

  const problem = await problemService.getProblemBySlug(slug);

  res.status(200).json(new ApiResponse(200, problem, 'Problem fetched successfully'));
});

// get updated problem
export const updateProblem = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = slugParamSchema.parse(req.params);
  const payload = updateProblemSchema.parse(req.body);

  const updated = await problemService.updateProblemBySlug(slug, payload);

  res.status(200).json(new ApiResponse(200, updated, 'Problem updated successfully'));
});

// delete problem

export const deleteProblem = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = slugParamSchema.parse(req.params);

  await problemService.deleteProblemBySlug(slug);

  res.status(200).json(new ApiResponse(200, null, 'Problem deleted successfully'));
});
