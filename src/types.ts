import { Request } from "express";
import { Document } from "mongoose";

export interface ILink {
  // platform: string;
  // link: string;
}

export interface IUser extends Document {
  _id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  profileImg?: string;
  links?: ILink[];
  profileImg_public_id?: String;
  password: String;
  refreshToken: String | undefined;
  isPasswordCorrect(password: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
}

export interface IAuthenticatedRequest extends Request {
  user?: IUser | null;
}

export interface IRegisterLoginUserRequest extends Request {
  body: { email: string; password: string };
}

export interface IGetUserByIdRequest extends Request {
  query: {
    uId: string;
  };
}

export interface IUpdateUserRequest extends Request {
  user?: IUser | null;
  body: {
    firstName: string;
    lastName: string;
    email: string;
    // links: ILink[];
    links: string[]; // from frontend all links commes as array of strring, then i parsed here as object
    profileImg: string;
    profileImg_public_id: string;
  };
}
