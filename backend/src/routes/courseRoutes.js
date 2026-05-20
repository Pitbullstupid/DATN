import express from "express";
import {
  createCourse,
  getMyCoursesAsStudent,
  getMyCoursesAsTutor,
  getCourseById,
  startCourse,
  requestEndCourse,
  cancelCourse,
  confirmSession,
  updateSession,
  reviewCourse,
  getMessages,
  sendMessage,
} from "../controllers/courseControllers.js";
import { authMiddleware } from "../middleware/adthMiddleware.js";

const router = express.Router();

const isStudent = (req, res, next) => {
  if (req.user.role !== "STUDENT")
    return res
      .status(403)
      .json({ message: "Chỉ học sinh mới có quyền thực hiện hành động này" });
  next();
};
const isTutor = (req, res, next) => {
  if (req.user.role !== "TUTOR")
    return res
      .status(403)
      .json({ message: "Chỉ gia sư mới có quyền thực hiện hành động này" });
  next();
};

// ── Tutor tạo lớp ────────────────────────────────────────────
router.post("/", authMiddleware, isTutor, createCourse);

// ── Student ──────────────────────────────────────────────────
router.get("/student", authMiddleware, isStudent, getMyCoursesAsStudent);
router.post("/:id/review", authMiddleware, isStudent, reviewCourse);

// ── Tutor ────────────────────────────────────────────────────
router.get("/tutor", authMiddleware, isTutor, getMyCoursesAsTutor);
router.patch("/:id/start", authMiddleware, isTutor, startCourse);
router.patch(
  "/:id/sessions/:sessionId",
  authMiddleware,
  isTutor,
  updateSession,
);

// ── Chung (cả 2 role) ────────────────────────────────────────
router.get("/:id", authMiddleware, getCourseById);
router.patch("/:id/cancel", authMiddleware, cancelCourse);

// Xác nhận hoàn thành buổi học (2 chiều)
router.patch(
  "/:id/sessions/:sessionId/confirm",
  authMiddleware,
  confirmSession,
);

// Yêu cầu / xác nhận kết thúc khóa (2 chiều)
router.patch("/:id/request-end", authMiddleware, requestEndCourse);

// Chat
router.get("/:id/messages", authMiddleware, getMessages);
router.post("/:id/messages", authMiddleware, sendMessage);

export default router;
