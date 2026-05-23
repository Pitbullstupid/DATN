import express from "express";
import {
  sseStream,
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../controllers/notificationControllers.js";
import { authMiddleware }    from "../middleware/adthMiddleware.js";
import { sseAuthMiddleware } from "../middleware/sseAuthMiddleware.js";

const router = express.Router();

// SSE — dùng sseAuthMiddleware (token qua query param)
router.get("/stream",       sseAuthMiddleware, sseStream);

// REST — dùng authMiddleware bình thường
router.get("/",             authMiddleware, getNotifications);
router.patch("/read-all",   authMiddleware, markAllAsRead);
router.patch("/:id/read",   authMiddleware, markAsRead);
router.delete("/:id",       authMiddleware, deleteNotification);

export default router;