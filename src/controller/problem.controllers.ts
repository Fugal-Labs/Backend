import { Request, Response } from 'express';
import ProblemModel from '../models/problems.model';
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

//create problems

export const createProblem = async (req: Request, res: Response) => {
  try {


      // Validate request body using Zod
    const parsed = createProblemSchema.safeParse(req.body);

     if (!parsed.success) {
      // Map Zod errors to friendly messages
      const formattedErrors = parsed.error.issues.map(err => {
        const field = err.path.join(".");
        return `${field}: ${err.message}`;
      });

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: formattedErrors,
      });
    }

    // console.log(parsed);

   

    //  Extract validated data
    const {
      title,
      slug,
      difficulty,
      description,
      constraints,
      tags,
      templates,
    } = parsed.data;



    //  Extract
    // const {
    //   title,
    //   slug,
    //   difficulty,
    //   description,
    //   constraints,
    //   tags,
    //   templates,
    // } = req.body;

    // Validate
    // if (!title || !slug || !difficulty || !description || !constraints || !templates) {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Missing required fields',
    //   });
    // }

    

    //  Duplicate check
    const exists = await ProblemModel.findOne({ slug });
    if (exists) {
      return res.status(409).json({
        success: false,
        message: 'Problem with this slug already exists',
      });
    }

    //  Map templates
    const problemData = {
      title,
      slug,
      difficulty,
      description,
      constraints,
      tags: tags ?? [],

      templates: {
        python: templates?.python?.files?.[0]?.content ?? '',
        java: templates?.java?.files?.[0]?.content ?? '',
        cpp: templates?.cpp?.files?.[0]?.content ?? '',
        c: templates?.c?.files?.[0]?.content ?? '',
      },

      totalSubmissions: 0,
      acceptedSubmissions: 0,
    };

    //  Save
    const problem = await ProblemModel.create(problemData);

    //  Response
    res.status(201).json({
      success: true,
      message: 'Problem created successfully',
      data: problem,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//read problems

export const getProblems = async (_: Request, res: Response) => {
  try {
    const problems = await ProblemModel.find()
      .select('-__v')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Problems fetched successfully',
      total: problems.length,
      data: problems,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch problems',
    });
  }
};


//get by slug
export const getProblemBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const problem = await ProblemModel.findOne({ slug });

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Problem fetched successfully',
      data: problem,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch problem',
    });
  }
};


//update problem

export const updateProblem = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const updatedProblem = await ProblemModel.findOneAndUpdate(
      { slug },
      req.body,
      { new: true }
    );

    if (!updatedProblem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Problem updated successfully',
      data: updatedProblem,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update problem',
    });
  }
};



//delete problem

export const deleteProblem = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const deleted = await ProblemModel.findOneAndDelete({ slug });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Problem deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete problem',
    });
  }
};
