import { NextFunction, Request, RequestHandler, Response } from "express";

interface IAsyncHandlerFunc {
  (req: Request, res: Response, next: NextFunction): Promise<any>;
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
    } catch (error: any) {
      res.status(error.statusCode || 401).json({
        success: false,
        message: error.message,
      });
    }
  };

export { asyncHandler };
