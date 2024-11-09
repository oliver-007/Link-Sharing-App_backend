import { model, Schema } from "mongoose";
import { IUser } from "../types";
import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import { ApiError } from "../utils/ApiError";
// ********** LINK SUB-SCHEMA **********
const linkSchema = new Schema({
  platform: {
    type: String,
  },
  link: {
    type: String,
  },
});

// ********** USER MAIN SCHEMA **********
const userSchema = new Schema(
  {
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: [true, "E-mail is required"],
      unique: true,
    },
    profileImg: {
      type: String,
    },
    profileImg_public_id: {
      // FRROM CLOUDINARY
      type: String,
    },
    links: [linkSchema],
    refreshToken: {
      type: String,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
  },

  {
    timestamps: true,
  }
);

// ++++++++++++++ PASSWORD ENCRIPTION BEFORE SAVE ++++++++++++++
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcryptjs.hash(this.password, 10);
  next();
});

// +++++++++ CHECKING PASSWORD +++++++++++
userSchema.methods.isPasswordCorrect = async function (password: string) {
  return await bcryptjs.compare(password, this.password);
};

// +++++++++++ ACCESS TOKEN GENERATE ++++++++++++
userSchema.methods.generateAccessToken = function (): string {
  const secretKey = process.env.ACCESS_TOKEN_SECRET;

  if (!secretKey) {
    throw new ApiError(401, "Access secret key not found ");
  }

  const payload: { _id: string; email: string } = {
    _id: this._id,
    email: this.email,
  };

  return jwt.sign(payload, secretKey, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
  });
};

// +++++++++ REFRESH TOKEN GENERATE ++++++++++
userSchema.methods.generateRefreshToken = function (): string {
  const secretKey = process.env.REFRESH_TOKEN_SECRET;

  if (!secretKey) {
    throw new ApiError(401, "Refresh secret key not found");
  }

  return jwt.sign(
    {
      _id: this._id,
    },
    secretKey,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};
export const User = model<IUser>("User", userSchema);
