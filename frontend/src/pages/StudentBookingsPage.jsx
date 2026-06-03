import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  FaCalendarAlt,
  FaClock,
  FaBookOpen,
  FaTimesCircle,
  FaChevronLeft,
  FaChevronRight,
  FaInbox,
} from "react-icons/fa";
import { getMyBookingsAsStudent, cancelBooking } from "../api/bookingApi";
import { getDateLocale } from "../i18n/dateLocale";

const STATUS_TAB_KEYS = [
  { key: "all", value: "" },
  { key: "pending", value: "PENDING" },
  { key: "accepted", value: "ACCEPTED" },
  { key: "rejected", value: "REJECTED" },
  { key: "cancelled", value: "CANCELLED" },
];

const STATUS_BADGE = {
  PENDING: "badge-warning",
  ACCEPTED: "badge-success",
  REJECTED: "badge-error",
  CANCELLED: "badge-ghost",
};

const formatPreferredStudyTime = (startDate, preferredTime, dateLocale) => {
  if (!startDate && !preferredTime) return "";
  const date = startDate
    ? new Date(startDate).toLocaleDateString(dateLocale, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "";
  return [date, preferredTime].filter(Boolean).join(" - ");
};

const BookingCard = ({ booking, onCancel, t, dateLocale }) => {
  const {
    tutorProfile,
    subject,
    message,
    status,
    tutorNote,
    createdAt,
    startDate,
    preferredTime,
  } = booking;
  const badge = STATUS_BADGE[status] ?? "badge-ghost";
  const statusLabel = status
    ? t(`bookings:status.${status.toLowerCase()}`)
    : status;
  const preferredStudyTime = formatPreferredStudyTime(
    startDate,
    preferredTime,
    dateLocale,
  );

  const fmt = (iso) =>
    iso
      ? new Date(iso).toLocaleDateString(dateLocale, {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : "—";

  return (
    <div className="bg-base-100 border border-base-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <img
            src={
              tutorProfile?.user?.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(tutorProfile?.user?.name || "T")}&size=80&background=random`
            }
            alt={tutorProfile?.user?.name}
            className="w-11 h-11 rounded-full object-cover border-2 border-base-200"
          />
          <div>
            <p className="font-semibold text-base-content text-sm">
              {tutorProfile?.user?.name || "—"}
            </p>
            <p className="text-xs text-base-content/50">
              {tutorProfile?.subjects?.[0]
                ? t("bookings:student.tutor_role", {
                    subject: tutorProfile.subjects[0],
                  })
                : t("tutors:card.tutor")}
            </p>
          </div>
        </div>
        <span className={`badge ${badge} badge-sm font-medium`}>
          {statusLabel}
        </span>
      </div>

      <div className="space-y-2 text-sm mb-4">
        <div className="flex items-center gap-2 text-base-content/70">
          <FaBookOpen size={12} className="text-primary shrink-0" />
          <span>
            {t("bookings:student.subject")}:{" "}
            <strong className="text-base-content">{subject}</strong>
          </span>
        </div>
        {preferredStudyTime && (
          <div className="flex items-center gap-2 text-base-content/70">
            <FaClock size={12} className="text-primary shrink-0" />
            <span>
              {t("bookings:student.preferred_time")}:{" "}
              <strong className="text-base-content">
                {preferredStudyTime}
              </strong>
            </span>
          </div>
        )}
        <div className="flex items-center gap-2 text-base-content/70">
          <FaCalendarAlt size={12} className="text-primary shrink-0" />
          <span>
            {t("bookings:student.sent")}: {fmt(createdAt)}
          </span>
        </div>
        {tutorProfile?.pricePerHour != null && (
          <div className="flex items-center gap-2 text-base-content/70">
            <FaClock size={12} className="text-success shrink-0" />
            <span>
              {t("bookings:student.per_hour", {
                price: Number(tutorProfile.pricePerHour).toFixed(2),
              })}
            </span>
          </div>
        )}
      </div>

      <div className="bg-base-200/60 rounded-xl px-4 py-3 text-sm text-base-content/70 mb-3 line-clamp-2">
        {message}
      </div>

      {tutorNote && (
        <div className="bg-error/10 border border-error/20 rounded-xl px-4 py-3 text-sm text-error mb-3">
          <span className="font-medium">
            {t("bookings:student.tutor_note")}{" "}
          </span>
          {tutorNote}
        </div>
      )}

      {status === "PENDING" && (
        <button
          className="btn btn-sm btn-error btn-outline w-full gap-2 mt-1"
          onClick={() => onCancel(booking.id)}
        >
          <FaTimesCircle size={12} /> {t("bookings:student.cancel_request")}
        </button>
      )}
    </div>
  );
};

const Skeleton = () => (
  <div className="bg-base-100 border border-base-200 rounded-2xl p-5 animate-pulse">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-11 h-11 rounded-full bg-base-300" />
      <div className="space-y-1.5 flex-1">
        <div className="h-3.5 bg-base-300 rounded w-1/2" />
        <div className="h-3 bg-base-200 rounded w-1/3" />
      </div>
    </div>
    <div className="space-y-2 mb-4">
      <div className="h-3 bg-base-200 rounded w-3/4" />
      <div className="h-3 bg-base-200 rounded w-1/2" />
    </div>
    <div className="h-12 bg-base-200 rounded-xl" />
  </div>
);

export default function StudentBookingsPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(["bookings", "tutors", "toast"]);
  const dateLocale = getDateLocale(i18n.language);

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [cancelling, setCancelling] = useState(null);

  const statusTabs = useMemo(
    () =>
      STATUS_TAB_KEYS.map(({ key, value }) => ({
        value,
        label: t(`bookings:status.${key}`),
      })),
    [t],
  );

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyBookingsAsStudent({
        status: activeTab,
        page,
        limit: 9,
      });
      setBookings(res.data?.data?.bookings || []);
      setPagination(res.data?.data?.pagination ?? { total: 0, totalPages: 1 });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  // Thêm useEffect này vào trong StudentBookingsPage component
  useEffect(() => {
    const handler = () => fetch();
    window.addEventListener("new-notification", handler);
    return () => window.removeEventListener("new-notification", handler);
  }, [fetch]);
  const handleTabChange = (val) => {
    setActiveTab(val);
    setPage(1);
  };

  const handleCancel = async (id) => {
    if (!window.confirm(t("toast:cancel_confirm"))) return;
    setCancelling(id);
    try {
      await cancelBooking(id);
      toast.success(t("toast:cancel_success"));
      fetch();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCancelling(null);
    }
  };

  return (
    <div className="min-h-screen bg-base-200">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-base-content">
            {t("bookings:student.title")}
          </h1>
          <p className="text-base-content/50 text-sm mt-1">
            {t("bookings:student.subtitle")}
          </p>
        </div>

        <div className="flex gap-1 bg-base-100 border border-base-200 rounded-xl p-1 mb-6 overflow-x-auto">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleTabChange(tab.value)}
              className={`btn btn-sm flex-1 min-w-max rounded-lg transition-all ${
                activeTab === tab.value
                  ? "btn-primary shadow-sm"
                  : "btn-ghost text-base-content/60"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 text-base-content/40 gap-3">
            <FaInbox size={44} className="opacity-25" />
            <p className="font-medium">{t("bookings:student.empty")}</p>
            <button
              className="btn btn-sm btn-primary"
              onClick={() => navigate("/tutors")}
            >
              {t("bookings:student.find_tutor")}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bookings.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                onCancel={cancelling === b.id ? () => {} : handleCancel}
                t={t}
                dateLocale={dateLocale}
              />
            ))}
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <button
              className="btn btn-sm btn-outline btn-primary"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <FaChevronLeft size={11} />
            </button>
            {Array.from({ length: pagination.totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`btn btn-sm ${page === i + 1 ? "btn-primary" : "btn-outline btn-primary"}`}
              >
                {i + 1}
              </button>
            ))}
            <button
              className="btn btn-sm btn-outline btn-primary"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <FaChevronRight size={11} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
