import { Request, Response } from 'express';
import { createProblemService } from '@/services/problem.service';
import { getProblemsService } from "@/services/problem.service";
import { getProblemBySlugService } from "@/services/problem.service";
import { updateProblemService } from '@/services/problem.service';
import { deleteProblemService } from "@/services/problem.service";


//create problems

export const createProblem = async (req: Request, res: Response) => {
  try {
    const problem = await createProblemService({
      data: req.body,
    });

    res.status(201).json({
      success: true,
      message: "Problem created successfully",
      data: problem,
    });

  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Something went wrong",
      errors: error.errors || [],
    });
  }
};

//read problems

export const getProblems = async (_: Request, res: Response) => {
  try {
    const problems = await getProblemsService();

    res.status(200).json({
      success: true,
      message: "Problems fetched successfully",
      total: problems.length,
      data: problems,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch problems",
    });
  }
};


//get by slug

export const getProblemBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const problem = await getProblemBySlugService({ slug });

    res.status(200).json({
      success: true,
      message: "Problem fetched successfully",
      data: problem,
    });

  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to fetch problem",
    });
  }
};



//update problem


export const updateProblem = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const updatedProblem = await updateProblemService({
      slug,
      payload: req.body,
    });

    res.status(200).json({
      success: true,
      message: "Problem updated successfully",
      data: updatedProblem,
    });

  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to update problem",
      errors: error.errors || [],
    });
  }
};




//delete problem

export const deleteProblem = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    await deleteProblemService({ slug });

    res.status(200).json({
      success: true,
      message: "Problem deleted successfully",
    });

  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to delete problem",
    });
  }
};

