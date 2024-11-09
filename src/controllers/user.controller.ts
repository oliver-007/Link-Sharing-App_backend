import jwt, { JwtPayload } from "jsonwebtoken";
import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { User } from "../models/user.model";
import { ApiResponse } from "../utils/ApiResponse";
import {
  IAuthenticatedRequest,
  // IGetUserByIdRequest,
  IRegisterLoginUserRequest,
  IUpdateUserRequest,
} from "../types";
import { isValidObjectId } from "mongoose";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary";

// ++++++++++++ GENERATE ACCESS & REFRESH TOKEN  SIMULTANEOUSLY +++++++++++++
const generateAccessAndRefreshToken = async (userId: string) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(401, "User not found !");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;

    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error: any) {
    throw new ApiError(500, error?.message);
  }
};

// ++++++++++++ REGISTER +++++++++++
const registerUser = asyncHandler(
  async (req: IRegisterLoginUserRequest, res: Response) => {
    const { email, password } = req.body;

    if (
      [email, password].some((field) => {
        return field?.trim() === "";
      })
    ) {
      throw new ApiError(401, "All fields are required!");
    }

    const userExist = await User.findOne({
      email,
    });
    if (userExist) {
      throw new ApiError(401, "This email id already have been used !");
    }

    // CREATE USER
    const user = await User.create({
      email,
      password,
    });

    if (!user) {
      throw new ApiError(401, "Somehting went wrong while registering user!");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "User created Successfully."));
  }
);

// ++++++++++ LOGIN ++++++++++++
const loginUser = asyncHandler(
  async (req: IRegisterLoginUserRequest, res: Response) => {
    const { email, password } = req.body;

    if (
      [email, password].some((field) => {
        return field.trim() === "";
      })
    ) {
      throw new ApiError(401, "All fields are required!");
    }

    const user = await User.findOne({ email });

    if (!user) {
      throw new ApiError(401, "User not found !");
    }

    //  +++++++++++ PASSWORD VALIDATION +++++++++++
    // const isPasswordValid = await user.isPasswordCorrect(password);
    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
      throw new ApiError(401, " Invalid credentials - wrong password !");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id
    );

    const loggedInUser = await User.findById(user._id).select(
      "-password -refreshToken -profileImg_public_id"
    );

    // ++++++++ COOKIE OPTIONS +++++++++
    const options = {
      httpOnly: true,
      secure: true, // for https
      // secure: false, // for http. development phase
      sameSite:
        process.env.NODE_ENV === "production"
          ? ("none" as const)
          : ("lax" as const), // To allow cookies across different domains (if backend and frontend are on different domains). For same domain- smaeSite: "Lax" (default)
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { user: loggedInUser, accessToken, refreshToken },
          "User logged in Successfully ."
        )
      );
  }
);

// ++++++++++++ LOGOUT ++++++++++++++
const logoutUser = asyncHandler(
  async (req: IAuthenticatedRequest, res: Response) => {
    const loggedInUserId = req.user?._id;

    // ++++++++++ REMOVING REFRESH TOKEN FORM DB ++++++++++
    await User.findByIdAndUpdate(
      loggedInUserId,
      {
        $unset: {
          refreshToken: 1,
        },
      },
      {
        new: true,
      }
    );

    // ++++++++++ REMOVING COOKIES ++++++++++
    const options = {
      httpOnly: true,
      secure: true,
      // secure: false,
      sameSite:
        process.env.NODE_ENV === "production"
          ? ("none" as const)
          : ("lax" as const), // To allow cookies across different domains (if backend and frontend are on different domains). For same domain- smaeSite: "Lax" (default)
    };

    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(200, {}, "User logged out Successfully."));
  }
);

// ++++++++++ GET LOGGED-IN USER +++++++++++
const getLoggedInUser = asyncHandler(
  async (req: IAuthenticatedRequest, res: Response) => {
    const loggedInUser = req.user;

    if (!loggedInUser) {
      throw new ApiError(401, "You must log in first !");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          loggedInUser,
          "Logged In user data fetched Successfully ."
        )
      );
  }
);

// ++++++++++ GET ANY USER BY ID (FOR USER DETAILS WITHOUT LOGIN USING USER-ID) +++++++++++++
const getUserById = asyncHandler(async (req, res) => {
  const { uId } = req.query;

  if (!uId) {
    throw new ApiError(401, "User id is required!");
  }

  if (!isValidObjectId(uId)) {
    throw new ApiError(401, "Invalid user id !");
  }

  const userExist = await User.findById(uId).select(
    "-password -profileImg_public_id -refreshToken "
  );

  if (!userExist) {
    throw new ApiError(401, "No user found!");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, userExist, "User info fetched Successfully."));
});

// +++++++++++ RFRESH ACCESS TOKEN GENERATE ++++++++++++
const refreshAccessToken = asyncHandler(async (req, res: Response) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "UnAuthorised request !");
  }

  try {
    const secretKey = process.env.REFRESH_TOKEN_SECRET;
    if (!secretKey) {
      throw new ApiError(401, "Refresh secret key not found !");
    }

    // +++++++ REFRESH TOKEN VERIFICATION +++++++
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      secretKey
    ) as JwtPayload;

    const user = await User.findById(decodedToken._id)
      .select("-password -profileImg_public_id")
      .lean()
      .exec();

    if (!user) {
      throw new ApiError(401, "Invalid refresh token !");
    }

    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "Refresh token is expired!");
    }

    // ++++++++ NEW TOKENS GENERATE +++++++++
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id
    );

    // +++++++ COOKIE OPTIONS ++++++++
    const options = {
      httpOnly: true,
      secure: true,
      // secure: false,
      sameSite:
        process.env.NODE_ENV === "production"
          ? ("none" as const)
          : ("lax" as const), // To allow cookies across different domains (if backend and frontend are on different domains). For same domain- smaeSite: "Lax" (default)
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "Access token refreshed successfully."
        )
      );
  } catch (error: any) {
    throw new ApiError(401, error?.message || "Invalid refresh token!");
  }
});

// +++++++++++++ UPDATE USER DATA +++++++++++++
const updateUser = asyncHandler(
  async (req: IUpdateUserRequest, res: Response) => {
    const { firstName, lastName, email, links } = req.body;

    // ----- PARSED LINK ------
    const parsedLinks =
      links && links.map((singleLink) => JSON.parse(singleLink));

    const loggedInUserId = req.user?._id;
    const loggedInUserEmail = req.user?.email;

    if (!isValidObjectId(loggedInUserId)) {
      throw new ApiError(401, "Invalid user id !");
    }

    const userDataBeforeUpdate = await User.findById(loggedInUserId);

    const previousUserProfileImgPublicId =
      userDataBeforeUpdate?.profileImg_public_id;

    let profileImgLocalPath;
    if (req.file) {
      profileImgLocalPath = req.file.path;
    }
    const cloudinaryResponse =
      profileImgLocalPath && (await uploadOnCloudinary(profileImgLocalPath));

    const profileImgCloudinaryUrl =
      cloudinaryResponse && cloudinaryResponse.url;
    const profileImgCloudinaryPublicId =
      cloudinaryResponse && cloudinaryResponse.public_id;

    const updatedUserData = await User.findByIdAndUpdate(
      loggedInUserId,
      {
        $set: {
          firstName,
          lastName,
          email: email || loggedInUserEmail,
          links: parsedLinks,
          profileImg:
            profileImgCloudinaryUrl || userDataBeforeUpdate?.profileImg,
          profileImg_public_id: profileImgCloudinaryPublicId,
        },
      },
      { new: true }
    ).select(" -profile_public_id -password ");

    // -------- DELETE PREVIOUS PROFILE-IMG FROM CLOUDINARY CLOUD ---------
    profileImgCloudinaryUrl &&
      (await deleteFromCloudinary(previousUserProfileImgPublicId as string));

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          updatedUserData,
          "Your profile updated Successfully. 👍"
        )
      );
  }
);

// ++++++++++ UPDATE LINKS +++++++++++

export {
  registerUser,
  loginUser,
  logoutUser,
  getLoggedInUser,
  getUserById,
  refreshAccessToken,
  updateUser,
};
