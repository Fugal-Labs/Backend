import ProblemModel from "@/models/problems.model";
import { ApiError } from "@/utils/api-errors";
import type { Problem } from "@/types/problems.type";

// create problem
export const createProblem = async (data: Partial<Problem>) => {
  const existing = await ProblemModel.findOne({ slug: data.slug });
  if (existing) {
    throw new ApiError(409, "Problem with this slug already exists");
  }

  const problem = await ProblemModel.create(data);
  return problem;
};

export const getAllProblems = async () => {
  return ProblemModel.find().sort({ createdAt: -1 });
};

export const getProblemBySlug = async (slug: string) => {
  const problem = await ProblemModel.findOne({ slug });
  if (!problem) {
    throw new ApiError(404, "Problem not found");
  }
  return problem;
};

export const updateProblemBySlug = async (
  slug: string,
  data: Partial<Problem>
) => {
  const updated = await ProblemModel.findOneAndUpdate(
    { slug },
    data,
    { new: true }
  );

  if (!updated) {
    throw new ApiError(404, "Problem not found");
  }

  return updated;
};

export const deleteProblemBySlug = async (slug: string) => {
  const deleted = await ProblemModel.findOneAndDelete({ slug });
  if (!deleted) {
    throw new ApiError(404, "Problem not found");
  }
};
