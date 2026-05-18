import express from "express";
import {
  createCourse,
  getMyCoursesAsStudent,
  getMyCoursesAsTutor,
  getCourseById,
  startCourse,
  completeCourse,
  cancelCourse,
  updateSession,
  reviewCourse,
} from "../controllers/courseControllers.js";
import { authMiddleware } from "../middleware/adthMiddleware.js";

const router = express.Router();

const isStudent = (req, res, next) => {
  if (req.user.role !== "STUDENT")
    return res.status(403).json({ message: "Chỉ học sinh mới có quyền thực hiện hành động này" });
  next();
};

const isTutor = (req, res, next) => {
  if (req.user.role !== "TUTOR")
    return res.status(403).json({ message: "Chỉ gia sư mới có quyền thực hiện hành động này" });
  next();
};

// ── Tutor tạo lớp (khi accept booking) ──────────────────────
router.post  ("/",                             authMiddleware, isTutor,   createCourse);

// ── Student ──────────────────────────────────────────────────
router.get   ("/student",                      authMiddleware, isStudent, getMyCoursesAsStudent);
router.post  ("/:id/review",                   authMiddleware, isStudent, reviewCourse);

// ── Tutor ────────────────────────────────────────────────────
router.get   ("/tutor",                        authMiddleware, isTutor,   getMyCoursesAsTutor);
router.patch ("/:id/start",                    authMiddleware, isTutor,   startCourse);
router.patch ("/:id/complete",                 authMiddleware, isTutor,   completeCourse);
router.patch ("/:id/sessions/:sessionId",      authMiddleware, isTutor,   updateSession);

// ── Chung ────────────────────────────────────────────────────
router.get   ("/:id",                          authMiddleware,            getCourseById);
router.patch ("/:id/cancel",                   authMiddleware,            cancelCourse);

export default router;

// ─────────────────────────────────────────────────────────────
// QUAN TRỌNG: Cập nhật bookingControllers.js
// Thay hàm acceptBooking cũ bằng đoạn dưới đây.
// Giờ khi tutor accept, FE sẽ gọi POST /courses thay vì
// PATCH /bookings/:id/accept
// ─────────────────────────────────────────────────────────────
//
// export const acceptBooking = async (req, res) => {
//   // Không tạo session nữa — chỉ redirect về courseControllers.createCourse
//   // Hoặc giữ lại để reject/cancel vẫn dùng bookingControllers
//   return res.status(400).json({
//     status: "error",
//     message: "Vui lòng dùng POST /courses để tạo lớp học khi accept booking",
//   });
// };