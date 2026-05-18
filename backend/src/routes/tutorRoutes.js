import express from "express";
import {
  getMyProfile,
  updateStep1,
  updateStep2,
  updateStep3,
  updateSocialMedia,
  updateEducation,
  deleteEducation,
  submitProfile,
  getTutorById,
  getAllTutors,
} from "../controllers/tutorControllers.js";
import { authMiddleware } from "../middleware/adthMiddleware.js";
import {
  step1Schema,
  step2Schema,
  step3Schema,
  socialMediaSchema,
  educationSchema,
} from "../validators/tutorValidators.js";
import { validate } from "../middleware/validate.js";


const router = express.Router();

// Middleware kiểm tra role TUTOR (dùng nội bộ trong file này)
const isTutor = (req, res, next) => {
  if (req.user.role !== "TUTOR") {
    return res.status(403).json({ message: "Chỉ gia sư mới có quyền thực hiện hành động này" });
  }
  next();
};

// ── Tutor only (đặt TRƯỚC /:id để không bị nuốt bởi param :id) ──
router.get   ("/me/profile",          authMiddleware, isTutor, getMyProfile);
router.patch ("/me/step1",            authMiddleware, isTutor, validate(step1Schema),       updateStep1);
router.patch ("/me/step2",            authMiddleware, isTutor, validate(step2Schema),       updateStep2);
router.patch ("/me/step3",            authMiddleware, isTutor, validate(step3Schema),       updateStep3);
router.patch ("/me/social-media",     authMiddleware, isTutor, validate(socialMediaSchema), updateSocialMedia);
router.post  ("/me/education",        authMiddleware, isTutor, validate(educationSchema),   updateEducation);
router.delete("/me/education/:eduId", authMiddleware, isTutor, deleteEducation);
router.post  ("/me/submit",           authMiddleware, isTutor, submitProfile);

// ── Public ───────────────────────────────────────────────────
router.get("/", getAllTutors);
router.get("/:id", getTutorById);

export default router;