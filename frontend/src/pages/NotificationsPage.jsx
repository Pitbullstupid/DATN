import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBell, FaCheck, FaTrash, FaArrowLeft,
  FaBookOpen, FaCreditCard, FaCircleInfo,
} from "react-icons/fa6";
import { FaCalendarAlt } from "react-icons/fa";
import { useNotifications } from "../hook/useNotifications";

// ─── Icon + color theo loại ───────────────────────────────────
const NOTIF_CONFIG = {
  BOOKING_RECEIVED:    { icon: FaBookOpen,    color: "text-primary",   bg: "bg-primary/10"   },
  BOOKING_ACCEPTED:    { icon: FaCheck,       color: "text-success",   bg: "bg-success/10"   },
  BOOKING_REJECTED:    { icon: FaCircleInfo,  color: "text-error",     bg: "bg-error/10"     },
  BOOKING_CANCELLED:   { icon: FaCircleInfo,  color: "text-error",     bg: "bg-error/10"     },
  PAYMENT_REQUIRED:    { icon: FaCreditCard,  color: "text-warning",   bg: "bg-warning/10"   },
  PAYMENT_SUCCESS:     { icon: FaCreditCard,  color: "text-success",   bg: "bg-success/10"   },
  PAYMENT_RECEIVED:    { icon: FaCreditCard,  color: "text-success",   bg: "bg-success/10"   },
  PAYMENT_RELEASED:    { icon: FaCreditCard,  color: "text-success",   bg: "bg-success/10"   },
  COURSE_STARTED:      { icon: FaCalendarAlt, color: "text-info",      bg: "bg-info/10"      },
  COURSE_COMPLETED:    { icon: FaCheck,       color: "text-success",   bg: "bg-success/10"   },
  COURSE_CANCELLED:    { icon: FaCircleInfo,  color: "text-error",     bg: "bg-error/10"     },
  SESSION_CONFIRMED:   { icon: FaCheck,       color: "text-success",   bg: "bg-success/10"   },
  SESSION_CONFIRM_WAIT:{ icon: FaCalendarAlt, color: "text-warning",   bg: "bg-warning/10"   },
  END_COURSE_REQUESTED:{ icon: FaCircleInfo,  color: "text-warning",   bg: "bg-warning/10"   },
  END_COURSE_WAITING:  { icon: FaCircleInfo,  color: "text-info",      bg: "bg-info/10"      },
};

const fmtDateTime = (iso) =>
  iso ? new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }) : "—";

const fmtRelative = (iso) => {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const min  = Math.floor(diff / 60000);
  if (min < 1)   return "Vừa xong";
  if (min < 60)  return `${min} phút trước`;
  const hr = Math.floor(min / 60);
  if (hr < 24)   return `${hr} giờ trước`;
  const day = Math.floor(hr / 24);
  if (day < 7)   return `${day} ngày trước`;
  return fmtDateTime(iso);
};

const FILTER_TABS = [
  { label: "Tất cả",       value: "all"    },
  { label: "Chưa đọc",     value: "unread" },
  { label: "Booking",      value: "BOOKING" },
  { label: "Thanh toán",   value: "PAYMENT" },
  { label: "Khóa học",     value: "COURSE"  },
  { label: "Buổi học",     value: "SESSION" },
];

const Skeleton = () => (
  <div className="flex gap-4 p-5 animate-pulse">
    <div className="w-10 h-10 rounded-full bg-base-300 shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-base-300 rounded w-1/2" />
      <div className="h-3 bg-base-200 rounded w-3/4" />
      <div className="h-3 bg-base-200 rounded w-1/4" />
    </div>
  </div>
);

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("all");

  const {
    notifications, unreadCount, loading,
    markAsRead, markAllAsRead, deleteNotification,
  } = useNotifications();

  // Filter
  const filtered = notifications.filter((n) => {
    if (activeFilter === "all")    return true;
    if (activeFilter === "unread") return !n.isRead;
    return n.type.startsWith(activeFilter);
  });

  return (
    <div className="min-h-screen bg-base-200">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button className="btn btn-ghost btn-sm btn-circle" onClick={() => navigate(-1)}>
            <FaArrowLeft size={15} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-base-content flex items-center gap-2">
              <FaBell className="text-primary" size={20} />
              Thông báo
              {unreadCount > 0 && (
                <span className="badge badge-primary badge-sm">{unreadCount} mới</span>
              )}
            </h1>
          </div>
          {unreadCount > 0 && (
            <button
              className="btn btn-ghost btn-sm gap-1.5 text-primary"
              onClick={markAllAsRead}
            >
              <FaCheck size={12} /> Đọc tất cả
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 bg-base-100 border border-base-200 rounded-xl p-1 mb-5 overflow-x-auto">
          {FILTER_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setActiveFilter(t.value)}
              className={`btn btn-sm flex-1 min-w-max rounded-lg transition-all ${
                activeFilter === t.value
                  ? "btn-primary shadow-sm"
                  : "btn-ghost text-base-content/60"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="divide-y divide-base-200">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-base-content/30 gap-3">
              <FaBell size={40} className="opacity-20" />
              <p className="text-sm font-medium">Không có thông báo nào</p>
            </div>
          ) : (
            <div className="divide-y divide-base-200">
              {filtered.map((n) => {
                const cfg = NOTIF_CONFIG[n.type] ?? { icon: FaCircleInfo, color: "text-base-content/40", bg: "bg-base-200" };
                const Icon = cfg.icon;

                return (
                  <div
                    key={n.id}
                    className={`flex items-start gap-4 p-5 hover:bg-base-200/40 transition-colors cursor-pointer group ${
                      !n.isRead ? "border-l-4 border-primary bg-primary/5" : ""
                    }`}
                    onClick={() => {
                      if (!n.isRead) markAsRead(n.id);
                      if (n.courseId)  navigate(`/courses/${n.courseId}`);
                      else if (n.bookingId) navigate(`/tutor/bookings`);
                    }}
                  >
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-full ${cfg.bg} ${cfg.color} flex items-center justify-center shrink-0`}>
                      <Icon size={16} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm leading-snug ${!n.isRead ? "font-semibold text-base-content" : "text-base-content/80"}`}>
                          {n.title}
                        </p>
                        {!n.isRead && (
                          <div className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-xs text-base-content/55 mt-1 leading-relaxed">{n.body}</p>
                      <p className="text-[11px] text-base-content/30 mt-1.5">{fmtRelative(n.createdAt)}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      {!n.isRead && (
                        <button
                          className="btn btn-ghost btn-xs btn-circle text-primary"
                          onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }}
                          title="Đánh dấu đã đọc"
                        >
                          <FaCheck size={10} />
                        </button>
                      )}
                      <button
                        className="btn btn-ghost btn-xs btn-circle text-error"
                        onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                        title="Xoá"
                      >
                        <FaTrash size={10} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}