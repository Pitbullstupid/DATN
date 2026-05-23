import jwt from "jsonwebtoken";
import { prisma } from "../config/db.js";

// ─────────────────────────────────────────────────────────────
// SSE không hỗ trợ custom headers → token truyền qua query param
// Dùng middleware này thay authMiddleware cho route /notifications/stream
// ─────────────────────────────────────────────────────────────
export const sseAuthMiddleware = async (req, res, next) => {
  try {
    const token = req.query.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
      res.setHeader("Content-Type", "text/event-stream");
      res.status(401).end(`data: ${JSON.stringify({ event: "error", message: "Unauthorized" })}\n\n`);
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, role: true, name: true },
    });

    if (!user) {
      res.setHeader("Content-Type", "text/event-stream");
      res.status(401).end(`data: ${JSON.stringify({ event: "error", message: "User not found" })}\n\n`);
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    res.setHeader("Content-Type", "text/event-stream");
    res.status(401).end(`data: ${JSON.stringify({ event: "error", message: "Invalid token" })}\n\n`);
  }
};