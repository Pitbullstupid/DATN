import { useState, useEffect, useCallback, useRef } from "react";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";

// ─────────────────────────────────────────────────────────────
// useNotifications — SSE + fetch + CRUD
// ─────────────────────────────────────────────────────────────
export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const eventSourceRef = useRef(null);

  // ── Fetch từ API ───────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await axiosInstance.get("/notifications", {
        params: { limit: 30 },
      });
      setNotifications(res.data?.data?.notifications || []);
      setUnreadCount(res.data?.data?.unreadCount || 0);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  // ── SSE connection ─────────────────────────────────────────
  const connectSSE = useCallback(() => {
    if (!user?.id) return;

    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;

    // Đóng kết nối cũ nếu có
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // SSE không hỗ trợ custom headers → truyền token qua query param
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5001/api";
    const url = `${baseUrl}/notifications/stream?token=${token}`;
    const es = new EventSource(url);

    es.onopen = () => console.log("SSE connected");

    es.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.event === "connected") return;

        if (payload.event === "notification") {
          const newNotif = payload.data;
          setNotifications((prev) => [newNotif, ...prev]);
          setUnreadCount((c) => c + 1);
          window.dispatchEvent(
            new CustomEvent("new-notification", { detail: newNotif }),
          );
        }
      } catch {}
    };

    es.onerror = () => {
      es.close();
      // Reconnect sau 5s
      setTimeout(connectSSE, 5000);
    };

    eventSourceRef.current = es;
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    connectSSE();
    return () => eventSourceRef.current?.close();
  }, [user, fetchNotifications, connectSSE]);

  // ── Actions ────────────────────────────────────────────────
  const markAsRead = async (id) => {
    try {
      await axiosInstance.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  const markAllAsRead = async () => {
    try {
      await axiosInstance.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  };

  const deleteNotification = async (id) => {
    try {
      await axiosInstance.delete(`/notifications/${id}`);
      const target = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (target && !target.isRead) setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: fetchNotifications,
  };
};
