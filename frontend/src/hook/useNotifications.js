import { useState, useEffect, useCallback, useRef } from "react";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [loading, setLoading]             = useState(true);
  const [connected, setConnected]         = useState(false); // ← MỚI: trạng thái SSE
  const eventSourceRef = useRef(null);

  // ── Fetch từ API ───────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await axiosInstance.get("/notifications", { params: { limit: 30 } });
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

    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;

    if (eventSourceRef.current) eventSourceRef.current.close();

    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5001/api";
    const es = new EventSource(`${baseUrl}/notifications/stream?token=${token}`);

    es.onopen = () => setConnected(true);

    es.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.event === "connected") return;

        if (payload.event === "notification") {
          // ── FIX: handle cả 2 format ──────────────────────
          // notify()      → { event, data: { id, type, title, ... } }  (lưu DB)
          // notifyAdmin() → { event, id, type, title, ... }             (không lưu DB)
          const newNotif = payload.data ?? payload;

          // Tránh duplicate (notifyAdmin push id dạng "admin_xxx")
          setNotifications((prev) => {
            if (prev.some((n) => n.id === newNotif.id)) return prev;
            return [newNotif, ...prev];
          });
          setUnreadCount((c) => c + 1);

          window.dispatchEvent(new CustomEvent("new-notification", { detail: newNotif }));
        }
      } catch {}
    };

    es.onerror = () => {
      setConnected(false);
      es.close();
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
    // notifyAdmin tạo id dạng "admin_xxx" — không lưu DB nên skip API call
    if (!id.startsWith("admin_")) {
      try { await axiosInstance.patch(`/notifications/${id}/read`); } catch {}
    }
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const markAllAsRead = async () => {
    try { await axiosInstance.patch("/notifications/read-all"); } catch {}
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const deleteNotification = async (id) => {
    if (!id.startsWith("admin_")) {
      try { await axiosInstance.delete(`/notifications/${id}`); } catch {}
    }
    const target = notifications.find((n) => n.id === id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (target && !target.isRead) setUnreadCount((c) => Math.max(0, c - 1));
  };

  return {
    notifications,
    unreadCount,
    loading,
    connected,   // ← export thêm để NotificationBell admin hiện dot trạng thái
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: fetchNotifications,
  };
};