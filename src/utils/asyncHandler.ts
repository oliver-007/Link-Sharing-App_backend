import { NextFunction, Request, RequestHandler, Response } from "express";

interface IAsyncHandlerFunc {
  (req: Request, res: Response, next: NextFunction): Promise<any>;
}

interface CustomError extends Error {
  statusCode?: number;
}

// ++++++ PROMISE APPROACH +++++++
// const asyncHandler = (func: IAsyncHandlerFunc): RequestHandler => {
//   return (req, res, next) => {
//     Promise.resolve(func(req, res, next)).catch((error) => next(error));
//   };
// };

// +++++ TRY-CATCH APPROACH +++++

const asyncHandler =
  (func: IAsyncHandlerFunc): RequestHandler =>
  async (req, res, next) => {
    try {
      await func(req, res, next);
    } catch (error: unknown) {
      const customError = error as CustomError;
      res.status(customError.statusCode || 500).json({
        success: false,
        message: customError.message || "An unexpected error occurred.",
      });
    }
  };

export { asyncHandler };
