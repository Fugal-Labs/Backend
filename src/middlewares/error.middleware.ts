import { Request,Response,NextFunction } from "express";
import mongoose, { mongo } from "mongoose";
import { ApiError } from "../utils/api-errors";


export const errorHandler = (
    err:any,
    req:Request,
    res: Response,
    next:NextFunction,
) => {
    let error = err;

    if(!(error instanceof ApiError)){
        const isMongooseError = error instanceof mongoose.Error;
        const statusCode = error.statusCode
        ? error.statusCode
        :isMongooseError
        ?400
        :500;

        const message = error.message || "Something went wrong";
        error = new ApiError(statusCode,message,error?.errors || [], error.stack);
    }

    const response = {
        success: false,
        statusCode:error.statusCode,
        message:error.message,
        errors:error.errors || [],
        ...(process.env.NODE_ENV === "development"?{stack:error.stack}:{}),
    };

    return res.status(error.statusCode).json(response)
}