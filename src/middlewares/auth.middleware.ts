import jwt, { JwtPayload } from "jsonwebtoken";

import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { User } from "../models/user.model";
import { NextFunction, Response } from "express";
import { IAuthenticatedRequest, IUser } from "../types";

const verifyJwt = asyncHandler(
  async (req: IAuthenticatedRequest, _: Response, next: NextFunction) => {
    try {
      const token =
        req.cookies.accessToken ||
        req.header("Authorization")?.replace("Bearer ", "");

      if (!token) {
        throw new ApiError(401, "Token not found ! You must Login first.");
      }

      const secretKey = process.env.ACCESS_TOKEN_SECRET;

      if (!secretKey) {
        throw new ApiError(401, "missing ACCESS_TOKEN_SECRET env");
      }

      const decodedToken = jwt.verify(token, secretKey) as JwtPayload;

      const user = await User.findById(decodedToken._id)
        .select("-password -refreshToken")
        .lean<IUser>()
        .exec();

      if (!user) {
        throw new ApiError(401, "Invalid Access Token || User not found !");
      }

      req.user = user;

      next();
    } catch (error: any) {
      throw new ApiError(401, error?.message || "Invalid Access Token");
    }
  }
);

export { verifyJwt };
