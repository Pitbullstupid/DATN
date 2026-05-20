import express from "express";
import { getMe, updateMe, changePassword } from "../controllers/userControllers.js";
import { authMiddleware } from "../middleware/adthMiddleware.js";
import { upload } from "../config/cloudinary.js";
import { uploadAvatar } from "../controllers/userControllers.js";

const router = express.Router();

router.get   ("/me",          authMiddleware, getMe);
router.patch ("/me",          authMiddleware, updateMe);
router.patch ("/me/password", authMiddleware, changePassword);
router.post("/me/avatar", authMiddleware, upload.single("avatar"), uploadAvatar);

export default router;
