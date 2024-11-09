import { Router } from "express";
import {
  getLoggedInUser,
  getUserById,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateUser,
} from "../controllers/user.controller";
import { verifyJwt } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/multer.middleware";

const router = Router();

// ++++++++ REGISTER ROUTE ++++++++++
router.route("/register").post(registerUser);

// ++++++++++ LOGIN ROUTE +++++++++++
router.route("/login").post(loginUser);

// ++++++++++++ LOGOUT ROUTE +++++++++++++
router.route("/logout").post(verifyJwt, logoutUser);

// ++++++++++ GET CURRENT LOGGED-IN USER DATA ROUTE ++++++++++++
router.route("/current-user-data").get(verifyJwt, getLoggedInUser);

// +++++++++++ GET USER BY ID ROUTE +++++++++++
router.route("/user-by-id").get(getUserById);

// +++++++++++ REFRESH ACCESS TOKEN ROUTE +++++++++++
router.route("/refresh-token").post(refreshAccessToken);

// ++++++++++++ UPDATE USER-DATA ROUTE +++++++++++++++++
router
  .route("/update-user-data")
  .patch(verifyJwt, upload.single("profileImg"), updateUser);
export default router;
