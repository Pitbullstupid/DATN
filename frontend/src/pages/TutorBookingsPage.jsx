import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  FaBookOpen,
  FaEnvelope,
  FaCheck,
  FaChevronLeft,
  FaChevronRight,
  FaInbox,
  FaClock,
  FaXmark,
} from "react-icons/fa6";
import { FaCalendarAlt, FaTimes } from "react-icons/fa";
import { getMyBookingsAsTutor, rejectBooking } from "../api/bookingApi";
import { getDateLocale } from "../i18n/dateLocale";
import { getMyProfile } from "../api/tutorApi";
import AcceptBookingModal from "../components/AcceptBookingModal";

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

const STAT_STATUS_MAP = {
  pending: "PENDING",
  accepted: "ACCEPTED",
  rejected: "REJECTED",
  cancelled: "CANCELLED",
};

const STAT_STYLE = {
  pending: { color: "text-warning", bg: "bg-warning/10" },
  accepted: { color: "text-success", bg: "bg-success/10" },
  rejected: { color: "text-error", bg: "bg-error/10" },
  cancelled: { color: "text-base-content/40", bg: "bg-base-200" },
};

const fmtDatetimeLocal = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// const AcceptModal = ({ booking, onClose, onSuccess }) => {
//   const { t } = useTranslation(["bookings", "toast"]);
//   const [form, setForm] = useState({
//     scheduledAt: fmtDatetimeLocal(new Date(Date.now() + 86400000).toISOString()),
//     durationMin: 60,
//     tutorNote: "",
//   });
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const handleSubmit = async () => {
//     if (!form.scheduledAt) {
//       setError(t("toast:select_schedule"));
//       return;
//     }
//     setLoading(true);
//     try {
//       await acceptBooking(booking.id, {
//         scheduledAt: new Date(form.scheduledAt).toISOString(),
//         durationMin: parseInt(form.durationMin),
//         tutorNote: form.tutorNote || undefined,
//       });
//       toast.success(t("toast:accept_success"));
//       onSuccess();
//       onClose();
//     } catch (err) {
//       toast.error(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <dialog open className="modal modal-bottom sm:modal-middle">
//       <div className="modal-box w-full max-w-md p-0 rounded-2xl overflow-hidden">
//         <div className="flex items-center justify-between px-6 py-4 border-b border-base-200">
//           <h3 className="font-bold text-base-content text-lg">{t("bookings:modal.accept_title")}</h3>
//           <button className="btn btn-ghost btn-sm btn-circle" onClick={onClose}>
//             <FaXmark size={15} />
//           </button>
//         </div>

//         <div className="px-6 pt-4 pb-2">
//           <div className="flex items-center gap-3 p-3 bg-base-200/60 rounded-xl mb-4">
//             <img
//               src={
//                 booking.student?.avatar ||
//                 `https://ui-avatars.com/api/?name=${encodeURIComponent(booking.student?.name || "S")}&size=80&background=random`
//               }
//               alt={booking.student?.name}
//               className="w-10 h-10 rounded-full object-cover"
//             />
//             <div>
//               <p className="font-semibold text-sm text-base-content">{booking.student?.name}</p>
//               <p className="text-xs text-base-content/50">{booking.subject}</p>
//             </div>
//           </div>

//           <div className="space-y-4">
//             <div>
//               <label className="text-sm font-medium text-base-content mb-1 block">
//                 {t("bookings:modal.scheduled")} <span className="text-error">*</span>
//               </label>
//               <input
//                 type="datetime-local"
//                 value={form.scheduledAt}
//                 min={fmtDatetimeLocal(new Date().toISOString())}
//                 onChange={(e) => {
//                   setForm((f) => ({ ...f, scheduledAt: e.target.value }));
//                   setError("");
//                 }}
//                 className="input input-bordered w-full focus:outline-none focus:border-primary"
//               />
//               {error && <p className="text-error text-xs mt-1">{error}</p>}
//             </div>

//             <div>
//               <label className="text-sm font-medium text-base-content mb-1 block">
//                 {t("bookings:modal.duration")}
//               </label>
//               <select
//                 value={form.durationMin}
//                 onChange={(e) => setForm((f) => ({ ...f, durationMin: e.target.value }))}
//                 className="select select-bordered w-full focus:outline-none focus:border-primary"
//               >
//                 {[30, 45, 60, 90, 120, 150, 180].map((m) => (
//                   <option key={m} value={m}>
//                     {t("bookings:modal.minutes", { count: m })}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             <div>
//               <label className="text-sm font-medium text-base-content mb-1 block">
//                 {t("bookings:modal.note_student")}{" "}
//                 <span className="text-base-content/40 font-normal">{t("bookings:modal.optional")}</span>
//               </label>
//               <textarea
//                 rows={3}
//                 placeholder={t("bookings:modal.note_placeholder")}
//                 value={form.tutorNote}
//                 onChange={(e) => setForm((f) => ({ ...f, tutorNote: e.target.value }))}
//                 className="textarea textarea-bordered w-full resize-none focus:outline-none focus:border-primary text-sm"
//               />
//             </div>
//           </div>
//         </div>

//         <div className="px-6 pb-6 pt-2 flex gap-2">
//           <button className="btn btn-ghost flex-1" onClick={onClose} disabled={loading}>
//             {t("bookings:modal.cancel")}
//           </button>
//           <button className="btn btn-success flex-1 gap-2" onClick={handleSubmit} disabled={loading}>
//             {loading ? (
//               <span className="loading loading-spinner loading-sm" />
//             ) : (
//               <FaCheck size={12} />
//             )}
//             {t("bookings:modal.confirm_accept")}
//           </button>
//         </div>
//       </div>
//       <div className="modal-backdrop" onClick={onClose} />
//     </dialog>
//   );
// };

const RejectModal = ({ booking, onClose, onSuccess }) => {
  const { t } = useTranslation(["bookings", "toast"]);
  const [tutorNote, setTutorNote] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await rejectBooking(booking.id, { tutorNote: tutorNote || undefined });
      toast.success(t("toast:reject_success"));
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <dialog open className="modal modal-bottom sm:modal-middle">
      <div className="modal-box w-full max-w-md p-0 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-base-200">
          <h3 className="font-bold text-base-content text-lg">
            {t("bookings:modal.reject_title")}
          </h3>
          <button className="btn btn-ghost btn-sm btn-circle" onClick={onClose}>
            <FaXmark size={15} />
          </button>
        </div>

        <div className="px-6 py-5">
          <div className="flex items-center gap-3 p-3 bg-error/10 rounded-xl mb-4 border border-error/20">
            <img
              src={
                booking.student?.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(booking.student?.name || "S")}&size=80&background=random`
              }
              alt={booking.student?.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <p className="font-semibold text-sm text-base-content">
                {booking.student?.name}
              </p>
              <p className="text-xs text-base-content/50">{booking.subject}</p>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-base-content mb-1 block">
              {t("bookings:modal.reason")}{" "}
              <span className="text-base-content/40 font-normal">
                {t("bookings:modal.optional")}
              </span>
            </label>
            <textarea
              rows={3}
              placeholder={t("bookings:modal.reject_placeholder")}
              value={tutorNote}
              onChange={(e) => setTutorNote(e.target.value)}
              className="textarea textarea-bordered w-full resize-none focus:outline-none focus:border-error text-sm"
            />
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-2">
          <button
            className="btn btn-ghost flex-1"
            onClick={onClose}
            disabled={loading}
          >
            {t("bookings:modal.back")}
          </button>
          <button
            className="btn btn-error flex-1 gap-2"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <FaTimes size={12} />
            )}
            {t("bookings:modal.confirm_reject")}
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </dialog>
  );
};

const BookingCard = ({ booking, onAccept, onReject, t, dateLocale }) => {
  const {
    student,
    subject,
    message,
    name,
    email,
    status,
    tutorNote,
    createdAt,
  } = booking;
  const badge = STATUS_BADGE[status] ?? "badge-ghost";
  const statusLabel = status
    ? t(`bookings:status.${status.toLowerCase()}`)
    : status;

  const fmt = (iso) =>
    iso
      ? new Date(iso).toLocaleDateString(dateLocale, {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : "—";

  return (
    <div className="bg-base-100 border border-base-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <img
            src={
              student?.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(student?.name || "S")}&size=80&background=random`
            }
            alt={student?.name}
            className="w-11 h-11 rounded-full object-cover border-2 border-base-200"
          />
          <div>
            <p className="font-semibold text-base-content text-sm">
              {student?.name || name || "—"}
            </p>
            <p className="text-xs text-base-content/50">
              {student?.email || email}
            </p>
          </div>
        </div>
        <span className={`badge ${badge} badge-sm font-medium shrink-0`}>
          {statusLabel}
        </span>
      </div>

      <div className="space-y-2 text-sm mb-4 flex-1">
        <div className="flex items-center gap-2 text-base-content/70">
          <FaBookOpen size={11} className="text-primary shrink-0" />
          <span>
            {t("bookings:tutor.subject")}:{" "}
            <strong className="text-base-content">{subject}</strong>
          </span>
        </div>
        <div className="flex items-center gap-2 text-base-content/70">
          <FaEnvelope size={11} className="text-primary shrink-0" />
          <span className="truncate">{student?.email || email}</span>
        </div>
        <div className="flex items-center gap-2 text-base-content/70">
          <FaCalendarAlt size={11} className="text-primary shrink-0" />
          <span>
            {t("bookings:tutor.received")}: {fmt(createdAt)}
          </span>
        </div>
      </div>

      <div className="bg-base-200/60 rounded-xl px-4 py-3 text-sm text-base-content/70 mb-3 line-clamp-2">
        {message}
      </div>

      {tutorNote && (
        <div className="bg-base-200 rounded-xl px-4 py-3 text-sm text-base-content/60 mb-3">
          <span className="font-medium">{t("bookings:tutor.your_note")} </span>
          {tutorNote}
        </div>
      )}

      {status === "PENDING" && (
        <div className="flex gap-2 mt-auto pt-1">
          <button
            className="btn btn-sm btn-error btn-outline flex-1 gap-1.5"
            onClick={() => onReject(booking)}
          >
            <FaTimes size={11} /> {t("bookings:tutor.reject")}
          </button>
          <button
            className="btn btn-sm btn-success flex-1 gap-1.5"
            onClick={() => onAccept(booking)}
          >
            <FaCheck size={11} /> {t("bookings:tutor.accept")}
          </button>
        </div>
      )}

      {status === "ACCEPTED" && booking.classSession && (
        <div className="flex items-center gap-2 text-xs text-success bg-success/10 border border-success/20 rounded-xl px-3 py-2 mt-auto">
          <FaClock size={11} />
          <span>
            {t("bookings:tutor.session")}{" "}
            {new Date(booking.classSession.scheduledAt).toLocaleString(
              dateLocale,
            )}
            {" · "}
            {booking.classSession.durationMin} {t("bookings:tutor.min")}
          </span>
        </div>
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
        <div className="h-3 bg-base-200 rounded w-2/3" />
      </div>
    </div>
    <div className="space-y-2 mb-4">
      <div className="h-3 bg-base-200 rounded w-3/4" />
      <div className="h-3 bg-base-200 rounded w-1/2" />
    </div>
    <div className="h-12 bg-base-200 rounded-xl mb-3" />
    <div className="flex gap-2">
      <div className="h-8 bg-base-300 rounded-lg flex-1" />
      <div className="h-8 bg-base-300 rounded-lg flex-1" />
    </div>
  </div>
);

const StatsBar = ({ bookings, t }) => {
  const counts = bookings.reduce((acc, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {Object.keys(STAT_STYLE).map((key) => {
        const statusKey = STAT_STATUS_MAP[key];
        const { color, bg } = STAT_STYLE[key];
        const value = counts[statusKey] || 0;
        return (
          <div
            key={key}
            className={`${bg} rounded-xl px-4 py-3 flex items-center gap-3 border border-base-200`}
          >
            <span className={`text-2xl font-bold ${color}`}>{value}</span>
            <span className="text-xs text-base-content/50">
              {t(`bookings:status.${key}`)}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default function TutorBookingsPage() {
  const { t, i18n } = useTranslation(["bookings", "toast"]);
  const dateLocale = getDateLocale(i18n.language);

  const [bookings, setBookings] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [acceptTarget, setAcceptTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [profile, setProfile] = useState(null);

  const statusTabs = useMemo(
    () =>
      STATUS_TAB_KEYS.map(({ key, value }) => ({
        value,
        label: t(`bookings:status.${key}`),
      })),
    [t],
  );

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyBookingsAsTutor({
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

  const fetchAll = useCallback(async () => {
    try {
      const res = await getMyBookingsAsTutor({ limit: 100 });
      setAllBookings(res.data?.data?.bookings || []);
    } catch {
      /* stats only */
    }
  }, []);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await getMyProfile();
        if (alive) setProfile(data?.data?.profile ?? null);
      } catch {
        if (alive) toast.error("Failed to load profile");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleTabChange = (val) => {
    setActiveTab(val);
    setPage(1);
  };

  const handleSuccess = () => {
    fetchBookings();
    fetchAll();
  };

  return (
    <div className="min-h-screen bg-base-200">
      {acceptTarget && (
        <AcceptBookingModal
          booking={acceptTarget}
          tutorPricePerHour={profile?.pricePerHour || 0}
          onClose={() => setAcceptTarget(null)}
          onSuccess={handleSuccess}
        />
      )}
      {rejectTarget && (
        <RejectModal
          booking={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onSuccess={handleSuccess}
        />
      )}

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-base-content">
            {t("bookings:tutor.title")}
          </h1>
          <p className="text-base-content/50 text-sm mt-1">
            {t("bookings:tutor.subtitle")}
          </p>
        </div>

        {allBookings.length > 0 && <StatsBar bookings={allBookings} t={t} />}

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
            <p className="font-medium">{t("bookings:tutor.empty_title")}</p>
            <p className="text-sm">{t("bookings:tutor.empty_subtitle")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bookings.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                onAccept={setAcceptTarget}
                onReject={setRejectTarget}
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
