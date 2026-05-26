import { prisma } from "../config/db.js";
import { addClient, removeClient } from "../services/notificationService.js";

// ─────────────────────────────────────────────────────────────
// GET /notifications/stream
// SSE endpoint — client kết nối 1 lần, nhận events liên tục
// ─────────────────────────────────────────────────────────────
export const sseStream = (req, res) => {
  // SSE headers
  res.setHeader("Content-Type",  "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection",    "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // tắt nginx buffering
  res.flushHeaders();

  const { id: userId, role } = req.user;

  // Gửi ping ngay khi connect để client biết stream đã sẵn sàng
  res.write(`data: ${JSON.stringify({ event: "connected", userId })}\n\n`);

  // Đăng ký client — truyền isAdmin để sseManager theo dõi riêng
  addClient(userId, res, role === "ADMIN");

  // Giữ kết nối bằng heartbeat mỗi 30s
  const heartbeat = setInterval(() => {
    try { res.write(": heartbeat\n\n"); }
    catch { clearInterval(heartbeat); }
  }, 30000);

  // Cleanup khi client disconnect
  req.on("close", () => {
    clearInterval(heartbeat);
    removeClient(userId, res);
  });
};

// ─────────────────────────────────────────────────────────────
// GET /notifications
// Lấy danh sách thông báo của user (phân trang)
// ─────────────────────────────────────────────────────────────
export const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = { userId: req.user.id };
    if (unreadOnly === "true") where.isRead = false;

    const [notifications, total, unreadCount] = await prisma.$transaction([
      prisma.notification.findMany({
        where, skip, take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId: req.user.id, isRead: false } }),
    ]);

    res.status(200).json({
      status: "success",
      data: {
        notifications,
        unreadCount,
        pagination: {
          total, page: parseInt(page), limit: take,
          totalPages: Math.ceil(total / take),
        },
      },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /notifications/:id/read
// ─────────────────────────────────────────────────────────────
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findFirst({
      where: { id, userId: req.user.id },
    });
    if (!notification) return res.status(404).json({ status: "error", message: "Không tìm thấy thông báo" });

    await prisma.notification.update({
      where: { id },
      data:  { isRead: true },
    });

    res.status(200).json({ status: "success", message: "Đã đánh dấu đã đọc" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /notifications/read-all
// ─────────────────────────────────────────────────────────────
export const markAllAsRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data:  { isRead: true },
    });
    res.status(200).json({ status: "success", message: "Đã đọc tất cả thông báo" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE /notifications/:id
// ─────────────────────────────────────────────────────────────
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await prisma.notification.findFirst({
      where: { id, userId: req.user.id },
    });
    if (!notification) return res.status(404).json({ status: "error", message: "Không tìm thấy thông báo" });

    await prisma.notification.delete({ where: { id } });
    res.status(200).json({ status: "success", message: "Đã xoá thông báo" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};