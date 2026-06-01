import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaBell, FaCheck, FaTrash, FaBookOpen, FaCreditCard, FaStar,  FaCircleInfo } from "react-icons/fa6";
import {FaCalendarAlt,} from "react-icons/fa";
import { useNotifications } from "../hook/useNotifications";

// ─── Icon theo loại notification ─────────────────────────────
const NOTIF_ICON = {
  TUTOR_PROFILE_SUBMITTED: <FaCircleInfo  className="text-info"      />,
  WITHDRAWAL_REQUESTED: <FaCreditCard  className="text-warning"   />,
  WITHDRAWAL_COMPLETED: <FaCreditCard  className="text-success"   />,
  COURSE_ACTIVATED:     <FaCalendarAlt className="text-success"   />,
  REVIEW_CREATED:       <FaStar        className="text-warning"   />,
  BOOKING_RECEIVED:    <FaBookOpen    className="text-primary"   />,
  BOOKING_ACCEPTED:    <FaCheck       className="text-success"   />,
  BOOKING_REJECTED:    <FaCircleInfo  className="text-error"     />,
  BOOKING_CANCELLED:   <FaCircleInfo  className="text-error"     />,
  PAYMENT_REQUIRED:    <FaCreditCard  className="text-warning"   />,
  PAYMENT_SUCCESS:     <FaCreditCard  className="text-success"   />,
  PAYMENT_RECEIVED:    <FaCreditCard  className="text-success"   />,
  PAYMENT_RELEASED:    <FaCreditCard  className="text-success"   />,
  COURSE_STARTED:      <FaCalendarAlt className="text-info"      />,
  COURSE_COMPLETED:    <FaCheck       className="text-success"   />,
  COURSE_CANCELLED:    <FaCircleInfo  className="text-error"     />,
  SESSION_CONFIRMED:   <FaCheck       className="text-success"   />,
  SESSION_CONFIRM_WAIT:<FaCalendarAlt className="text-warning"   />,
  END_COURSE_REQUESTED:<FaCircleInfo  className="text-warning"   />,
  END_COURSE_WAITING:  <FaCircleInfo  className="text-info"      />,
};

const fmtTime = (iso) => {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const min  = Math.floor(diff / 60000);
  if (min < 1)  return "Vừa xong";
  if (min < 60) return `${min} phút trước`;
  const hr = Math.floor(min / 60);
  if (hr < 24)  return `${hr} giờ trước`;
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
};

// ─── Single notification item ─────────────────────────────────
const NotifItem = ({ notif, onRead, onDelete, onNavigate }) => {
  const icon = NOTIF_ICON[notif.type] ?? <FaCircleInfo className="text-base-content/40" />;

  const handleClick = () => {
    if (!notif.isRead) onRead(notif.id);
    if (notif.courseId) onNavigate(`/courses/${notif.courseId}`);  //
    else if (notif.bookingId) onNavigate(`/tutor/bookings`); ///${notif.bookingId}
  };

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 hover:bg-base-200/50 transition-colors cursor-pointer group ${
        !notif.isRead ? "bg-primary/5 border-l-2 border-primary" : ""
      }`}
      onClick={handleClick}
    >
      {/* Icon */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${!notif.isRead ? "bg-primary/10" : "bg-base-200"}`}>
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-tight ${!notif.isRead ? "font-semibold text-base-content" : "text-base-content/80"}`}>
          {notif.title}
        </p>
        <p className="text-xs text-base-content/50 mt-0.5 line-clamp-2">{notif.body}</p>
        <p className="text-[10px] text-base-content/30 mt-1">{fmtTime(notif.createdAt)}</p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {!notif.isRead && (
          <button
            className="btn btn-ghost btn-xs btn-circle text-primary"
            onClick={(e) => { e.stopPropagation(); onRead(notif.id); }}
            title="Đánh dấu đã đọc"
          >
            <FaCheck size={10} />
          </button>
        )}
        <button
          className="btn btn-ghost btn-xs btn-circle text-error"
          onClick={(e) => { e.stopPropagation(); onDelete(notif.id); }}
          title="Xoá"
        >
          <FaTrash size={10} />
        </button>
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────
export default function NotificationBell() {
  const navigate   = useNavigate();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  // Click outside để đóng
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNavigate = (path) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        className="btn btn-ghost btn-circle relative"
        onClick={() => setOpen((v) => !v)}
      >
        <FaBell size={18} className="text-base-content/70" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-error text-error-content text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-base-100 rounded-2xl shadow-xl border border-base-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-base-200">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-base-content">Thông báo</h3>
              {unreadCount > 0 && (
                <span className="badge badge-primary badge-sm">{unreadCount} mới</span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                className="text-xs text-primary hover:underline"
                onClick={markAllAsRead}
              >
                Đọc tất cả
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <span className="loading loading-spinner loading-sm text-primary" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-base-content/30 gap-2">
                <FaBell size={28} className="opacity-30" />
                <p className="text-sm">Chưa có thông báo nào</p>
              </div>
            ) : (
              <div className="divide-y divide-base-200">
                {notifications.map((n) => (
                  <NotifItem
                    key={n.id}
                    notif={n}
                    onRead={markAsRead}
                    onDelete={deleteNotification}
                    onNavigate={handleNavigate}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-base-200 px-4 py-2 text-center">
              <button
                className="text-xs text-primary hover:underline"
                onClick={() => { setOpen(false); navigate("/notifications"); }}
              >
                Xem tất cả thông báo →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
