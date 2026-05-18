import express from "express";
import {
  createBooking,
  getMyBookingsAsStudent,
  getMyBookingsAsTutor,
  getBookingById,
  // acceptBooking,
  rejectBooking,
  cancelBooking,
} from "../controllers/bookingControllers.js";
import { authMiddleware } from "../middleware/adthMiddleware.js";

const router = express.Router();

// ── Role guards ──────────────────────────────────────────────
const isStudent = (req, res, next) => {
  if (req.user.role !== "STUDENT") {
    return res
      .status(403)
      .json({ message: "Chỉ học sinh mới có quyền thực hiện hành động này" });
  }
  next();
};

const isTutor = (req, res, next) => {
  if (req.user.role !== "TUTOR") {
    return res
      .status(403)
      .json({ message: "Chỉ gia sư mới có quyền thực hiện hành động này" });
  }
  next();
};

// ── Student ──────────────────────────────────────────────────

// Gửi yêu cầu thuê gia sư
router.post("/", authMiddleware, isStudent, createBooking);

// Xem danh sách booking của mình
router.get("/student", authMiddleware, isStudent, getMyBookingsAsStudent);

// Huỷ booking (chỉ khi PENDING)
router.patch("/:id/cancel", authMiddleware, isStudent, cancelBooking);

// ── Tutor ────────────────────────────────────────────────────

// Xem danh sách booking gửi đến mình
router.get("/tutor", authMiddleware, isTutor, getMyBookingsAsTutor);

// Chấp nhận booking → tự động tạo ClassSession
// router.patch("/:id/accept", authMiddleware, isTutor, acceptBooking);

// Từ chối booking
router.patch("/:id/reject", authMiddleware, isTutor, rejectBooking);

// ── Chung (student hoặc tutor liên quan) ─────────────────────

// Xem chi tiết 1 booking
router.get("/:id", authMiddleware, getBookingById);

export default router;
