import ProblemModel from "@/models/problems.model";
import { createProblemSchema } from "@/validations/problem.validation";

interface CreateProblemInput {
  data: unknown;
}

//create problem

export const createProblemService = async ({ data }: CreateProblemInput) => {

  // Zod validation
  const parsed = createProblemSchema.safeParse(data);

  if (!parsed.success) {
      // Map Zod errors to friendly messages
      const formattedErrors = parsed.error.issues.map(err => {
        const field = err.path.join(".");
        return `${field}: ${err.message}`;
      });

    throw {
      statusCode: 400,
      success: false,
      message: "Validation failed",
      errors: formattedErrors,
    };
  }

  const {
    title,
    slug,
    difficulty,
    description,
    constraints,
    tags,
    templates,
  } = parsed.data;

  //Duplicate slug check
  const exists = await ProblemModel.findOne({ slug });
  if (exists) {
    throw {
      statusCode: 409,
      message: "Problem with this slug already exists",
    };
  }

  //  Template mapping
  const problemData = {
    title,
    slug,
    difficulty,
    description,
    constraints,
    tags: tags ?? [],
    templates: {
      python: templates?.python?.files?.[0]?.content ?? "",
      java: templates?.java?.files?.[0]?.content ?? "",
      cpp: templates?.cpp?.files?.[0]?.content ?? "",
      c: templates?.c?.files?.[0]?.content ?? "",
    },
    totalSubmissions: 0,
    acceptedSubmissions: 0,
  };

  // Save to DB
  const problem = await ProblemModel.create(problemData);

  return problem;
};

// read problem

export const getProblemsService = async () => {

//   Fetch & sort
  const problems = await ProblemModel.find()
    .select("-__v")
    .sort({ createdAt: -1 });

  return problems;
};

//get by slug

interface GetProblemBySlugInput {
  slug: string;
}

export const getProblemBySlugService = async ({
  slug,
}: GetProblemBySlugInput) => {

  // 🔒fetch by slug
  const problem = await ProblemModel.findOne({ slug });

  if (!problem) {
    throw {
      statusCode: 404,
      message: "Problem not found",
    };
  }

  return problem;
};

//update 

interface UpdateProblemInput {
  slug: string;
  payload: unknown;
}

export const updateProblemService = async ({
  slug,
  payload,
}: UpdateProblemInput) => {

  //  Validate update payload
  // (Partial update allowed)
  const parsed = createProblemSchema.partial().safeParse(payload);

  if (!parsed.success) {
    const errors = parsed.error.issues.map(err => ({
      field: err.path.join("."),
      message: err.message,
    }));

    throw {
      statusCode: 400,
      message: "Validation failed",
      errors,
    };
  }

  //  Update DB
  const updatedProblem = await ProblemModel.findOneAndUpdate(
    { slug },
    parsed.data,
    { new: true }
  );

  if (!updatedProblem) {
    throw {
      statusCode: 404,
      message: "Problem not found",
    };
  }

  return updatedProblem;
};

//delete

interface DeleteProblemInput {
  slug: string;
}

export const deleteProblemService = async ({
  slug,
}: DeleteProblemInput) => {

  // Delete by slug
  const deletedProblem = await ProblemModel.findOneAndDelete({ slug });

  if (!deletedProblem) {
    throw {
      statusCode: 404,
      message: "Problem not found",
    };
  }

  return true;
};




