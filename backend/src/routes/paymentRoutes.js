import express from "express";
import {
  createCheckoutSession,
  stripeWebhook,
  getPaymentByCourse,
  getMyWallet,
  requestWithdrawal,
  verifyPayment,
  getBankAccounts,
  createBankAccount,
  updateBankAccount,
  deleteBankAccount,
} from "../controllers/paymentControllers.js";
import { authMiddleware } from "../middleware/adthMiddleware.js";

const router = express.Router();

const isTutor = (req, res, next) => {
  if (req.user.role !== "TUTOR")
    return res.status(403).json({ message: "Chỉ gia sư mới có quyền" });
  next();
};
const isStudent = (req, res, next) => {
  if (req.user.role !== "STUDENT")
    return res.status(403).json({ message: "Chỉ học sinh mới có quyền" });
  next();
};

// ── Stripe Webhook — KHÔNG dùng authMiddleware, cần raw body ──
// Đăng ký trước express.json() trong app.js
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook,
);

// ── Student ──────────────────────────────────────────────────
router.post(
  "/checkout/:courseId",
  authMiddleware,
  isStudent,
  createCheckoutSession,
);
router.get("/success", authMiddleware, isStudent, verifyPayment);

// ── Tutor ────────────────────────────────────────────────────
router.get("/wallet", authMiddleware, isTutor, getMyWallet);
router.get("/bank-accounts", authMiddleware, isTutor, getBankAccounts);
router.post("/bank-accounts", authMiddleware, isTutor, createBankAccount);
router.patch("/bank-accounts/:id", authMiddleware, isTutor, updateBankAccount);
router.delete("/bank-accounts/:id", authMiddleware, isTutor, deleteBankAccount);
router.post("/withdraw", authMiddleware, isTutor, requestWithdrawal);

// ── Chung ────────────────────────────────────────────────────
router.get("/course/:courseId", authMiddleware, getPaymentByCourse);

export default router;
