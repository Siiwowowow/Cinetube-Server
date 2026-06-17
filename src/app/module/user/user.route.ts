import { Router } from "express";
import { Role } from "@prisma/client";
import { checkAuth } from "../../middleware/checkAuth.js"; 
import { validateRequest } from "../../middleware/validateRequest.js";
import { UserController } from "./user.controller.js";
import { updateMyProfileMiddleware } from "./user.middlewares.js";
import { multerUpload } from "../../config/multer.config.js";
import { UserValidation } from "./user.validation.js";

const router = Router();

// Existing routes
router.patch(
  "/update-my-profile",
  checkAuth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  multerUpload.fields([{ name: "profilePhoto", maxCount: 1 }]),
  updateMyProfileMiddleware,
  validateRequest(UserValidation.updateUserProfileZodSchema),
  UserController.updateMyProfile
);

router.delete(
  "/remove-profile-photo",
  checkAuth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  UserController.removeProfilePhoto
);

// ✅ ADD THESE NEW ROUTES
router.get(
  "/me",
  checkAuth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  UserController.getMyProfile
);

router.get(
  "/me/watchlist",
  checkAuth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  UserController.getMyWatchlist
);

router.get(
  "/me/reviews",
  checkAuth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  UserController.getMyReviews
);

router.get(
  "/me/purchases",
  checkAuth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  UserController.getMyPurchases
);

router.get(
  "/me/activity",
  checkAuth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  UserController.getMyActivity
);

router.get(
  "/me/stats",
  checkAuth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
  UserController.getMyStats
);

export const UserRoutes = router;