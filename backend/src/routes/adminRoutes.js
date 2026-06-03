import express from "express";
import {
  getStats,
  getUsers,
  getUserById,
  toggleSuspendUser,
  getTutorApprovals,
  getTutorDetail,
  approveTutor,
  rejectTutor,
  getCourses,
  getCourseById,
  getPayments,
  getWithdrawals,
  processWithdrawal,
  getReviews,
  deleteReview,
  getSubjectsAdmin,
  createSubject,
  updateSubject,
  deleteSubject,
  isAdmin,
} from "../controllers/adminControllers.js";
import { authMiddleware } from "../middleware/adthMiddleware.js";

const router = express.Router();

// Áp dụng authMiddleware + isAdmin cho toàn bộ route admin
router.use(authMiddleware, isAdmin);

// ── Thống kê ─────────────────────────────────────────────────
router.get("/stats", getStats);

// ── Users ─────────────────────────────────────────────────────
router.get("/users", getUsers);
router.get("/users/:id", getUserById);
router.patch("/users/:id/suspend", toggleSuspendUser);

// ── Duyệt gia sư ──────────────────────────────────────────────
router.get("/tutor-approvals", getTutorApprovals);
router.get("/tutors/:id", getTutorDetail);
router.patch("/tutors/:id/approve", approveTutor);
router.patch("/tutors/:id/reject", rejectTutor);

// ── Khoá học ──────────────────────────────────────────────────
router.get("/courses", getCourses);
router.get("/courses/:id", getCourseById);

// ── Thanh toán ────────────────────────────────────────────────
router.get("/payments", getPayments);
router.get("/withdrawals", getWithdrawals);
router.patch("/withdrawals/:id/process", processWithdrawal);

// ── Đánh giá ──────────────────────────────────────────────────
router.get("/reviews", getReviews);
router.delete("/reviews/:id", deleteReview);

// ── Môn học ───────────────────────────────────────────────────
router.get("/subjects", getSubjectsAdmin);
router.post("/subjects", createSubject);
router.patch("/subjects/:id", updateSubject);
router.delete("/subjects/:id", deleteSubject);

export default router;
