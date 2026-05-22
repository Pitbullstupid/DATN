import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FiMail,
  FiPhone,
  FiMapPin,
  FiUser,
  FiDollarSign,
  FiInbox,
  FiLayers,
  FiCheckCircle,
  FiCreditCard,
  FiStar,
  FiCalendar,
  FiEdit2,
  FiAlertCircle,
} from "react-icons/fi";
import { FaCheckCircle, FaTimes } from "react-icons/fa";
import { FaXmark } from "react-icons/fa6";
import { getMyProfile } from "../api/tutorApi";
import { getMyBookingsAsTutor, rejectBooking } from "../api/bookingApi";
import { getMyCoursesAsTutor } from "../api/courseApi";
import { paymentApi } from "../api/paymentApi";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getDateLocale } from "../i18n/dateLocale";
import AcceptBookingModal from "../components/AcceptBookingModal";

const PROFILE_STATUS_CLS = {
  PENDING: "badge-warning",
  INCOMPLETE: "badge-info",
  REVIEWING: "badge-warning",
  APPROVED: "badge-success",
  REJECTED: "badge-error",
  SUSPENDED: "badge-error",
};

const BOOKING_STATUS_BADGE = {
  PENDING: "badge-warning",
  ACCEPTED: "badge-success",
  REJECTED: "badge-error",
  CANCELLED: "badge-ghost",
};

const INFO_ROW_KEYS = [
  { icon: FiCalendar, labelKey: "join_date", key: "joinDate" },
  { icon: FiMail, labelKey: "email", key: "email" },
  { icon: FiPhone, labelKey: "mobile", key: "phone" },
  { icon: FiMapPin, labelKey: "address", key: "address" },
];

const TABLE_HEADER_KEYS = ["student", "subject", "message", "status", "action"];

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse rounded-lg bg-base-300 ${className}`} />
);

// ─── Accept Modal ─────────────────────────────────────────────────────────────
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
//                 onChange={(e) => { setForm((f) => ({ ...f, scheduledAt: e.target.value })); setError(""); }}
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
//                 {[30, 45, 60, 90, 120].map((m) => (
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

//         <div className="px-6 pb-6 pt-3 flex gap-2">
//           <button className="btn btn-ghost flex-1" onClick={onClose} disabled={loading}>
//             {t("bookings:modal.cancel")}
//           </button>
//           <button className="btn btn-success flex-1 gap-2" onClick={handleSubmit} disabled={loading}>
//             {loading ? <span className="loading loading-spinner loading-sm" /> : <FaCheck size={12} />}
//             {t("bookings:modal.confirm_accept")}
//           </button>
//         </div>
//       </div>
//       <div className="modal-backdrop" onClick={onClose} />
//     </dialog>
//   );
// };

// ─── Reject Modal ─────────────────────────────────────────────────────────────
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

// ═════════════════════════════════════════════════════════════════════════════
const TutorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(["dashboard", "bookings", "toast"]);
  const dateLocale = getDateLocale(i18n.language);

  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [bookingStats, setBookingStats] = useState({
    pending: 0,
    accepted: 0,
    total: 0,
  });
  const [courseStats, setCourseStats] = useState({
    total: 0,
    upcoming: 0,
    ongoing: 0,
    completed: 0,
  });
  const [walletStats, setWalletStats] = useState({
    totalEarned: 0,
    heldAmount: 0,
    balance: 0,
  });

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState("");

  // Modals
  const [acceptTarget, setAcceptTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);

  // ── Fetch profile ──────────────────────────────────────────
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await getMyProfile();
        if (alive) setProfile(data?.data?.profile ?? null);
      } catch {
        if (alive) setError(t("dashboard:load_error"));
      } finally {
        if (alive) setLoadingProfile(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [t]);

  // ── Fetch bookings ─────────────────────────────────────────
  const fetchBookings = async () => {
    setLoadingBookings(true);
    try {
      // Lấy tất cả để tính stats + hiển thị PENDING trước
      const [allRes, pendingRes] = await Promise.all([
        getMyBookingsAsTutor({ limit: 100 }),
        getMyBookingsAsTutor({ status: "PENDING", limit: 5 }),
      ]);
      const all = allRes.data?.data?.bookings || [];
      const pending = pendingRes.data?.data?.bookings || [];

      setBookings(pending);
      setBookingStats({
        pending: all.filter((b) => b.status === "PENDING").length,
        accepted: all.filter((b) => b.status === "ACCEPTED").length,
        total: all.length,
      });
    } catch {
      // silent — không block dashboard
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBookings();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const fetchDashboardStats = async () => {
    setLoadingStats(true);
    try {
      const [coursesRes, walletRes] = await Promise.all([
        getMyCoursesAsTutor({ limit: 200 }),
        paymentApi.getMyWallet(),
      ]);

      const courses = coursesRes.data?.data?.courses || [];
      const wallet = walletRes.data?.data?.wallet || {};

      setCourseStats({
        total: courses.length,
        upcoming: courses.filter((c) => c.status === "UPCOMING").length,
        ongoing: courses.filter((c) => c.status === "ONGOING").length,
        completed: courses.filter((c) => c.status === "COMPLETED").length,
      });
      setWalletStats({
        totalEarned: wallet.totalEarned ?? 0,
        heldAmount: wallet.heldAmount ?? 0,
        balance: wallet.balance ?? 0,
      });
    } catch {
      // Stats are supplemental; keep the dashboard usable if one endpoint fails.
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDashboardStats();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // ── Derived profile values ─────────────────────────────────
  const name = profile?.user?.name || user?.name || t("dashboard:default_name");
  const email = profile?.user?.email || user?.email || "—";
  const avatar = profile?.user?.avatar || user?.avatar || "";
  const phone = profile?.phone || t("dashboard:not_updated");
  const address = profile?.address || t("dashboard:not_updated");
  const rating = profile?.rating ?? 0;
  const reviews = profile?.totalReviews ?? 0;
  const status = profile?.status ?? "PENDING";
  const joinDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString(dateLocale, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

  const statusCls = PROFILE_STATUS_CLS[status] ?? PROFILE_STATUS_CLS.PENDING;
  const statusLabel = t(`dashboard:profile_status.${status}`, {
    defaultValue: t("dashboard:profile_status.PENDING"),
  });
  const infoValues = { joinDate, email, phone, address };
  const formatUsd = (value) => `$${Number(value || 0).toFixed(2)}`;

  // ── Stat cards (dynamic) ───────────────────────────────────
  const statCards = [
    {
      label: t("dashboard:stats.hiring_request"),
      value: String(bookingStats.pending),
      sub: t("dashboard:stats.pending"),
      icon: FiInbox,
      color: "text-warning",
      bg: "bg-warning/10",
      to: "/tutor/bookings",
    },
    {
      label: t("dashboard:stats.total_booking"),
      value: String(bookingStats.total),
      sub: t("dashboard:stats.all_time"),
      icon: FiLayers,
      color: "text-secondary",
      bg: "bg-secondary/10",
      to: "/tutor/bookings",
    },
    {
      label: t("dashboard:stats.accepted"),
      value: String(bookingStats.accepted),
      sub: t("dashboard:stats.sessions"),
      icon: FiCheckCircle,
      color: "text-success",
      bg: "bg-success/10",
      to: "/tutor/bookings",
    },
    {
      label: t("dashboard:stats.rating"),
      value: rating > 0 ? rating.toFixed(1) : "—",
      sub: t("dashboard:stats.reviews", { count: reviews }),
      icon: FiStar,
      color: "text-warning",
      bg: "bg-warning/10",
      to: "/tutor/profile/edit",
    },
    {
      label: t("dashboard:stats.total_payment"),
      value: formatUsd(walletStats.totalEarned),
      sub: t("dashboard:stats.usd"),
      icon: FiDollarSign,
      color: "text-success",
      bg: "bg-success/10",
      to: "/tutor/wallet",
    },
    {
      label: t("dashboard:stats.total_ticket"),
      value: String(courseStats.total),
      sub: t("dashboard:stats.tickets"),
      icon: FiCreditCard,
      color: "text-accent",
      bg: "bg-accent/10",
      to: "/courses",
    },
  ];

  const isLoading = loadingProfile || loadingBookings || loadingStats;

  const handleSuccess = () => {
    fetchBookings();
  };

  return (
    <div className="min-h-screen bg-base-200">
      {/* Accept / Reject modals */}
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
          onSuccess={fetchBookings}
        />
      )}

      {/* ── Hero banner ─────────────────────────────────────── */}
      <div className="relative bg-primary">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-12 -right-12 w-72 h-72 rounded-full bg-primary-content/5" />
          <div className="absolute top-4 right-36 w-36 h-36 rounded-full bg-primary-content/5" />
          <div className="absolute -bottom-10 left-16 w-52 h-52 rounded-full bg-primary-content/5" />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center py-12 md:py-16 gap-1">
          <p className="text-primary-content/60 text-xs font-semibold uppercase tracking-[0.2em]">
            {t("dashboard:portal")}
          </p>
          <h1 className="text-primary-content text-3xl md:text-4xl font-bold tracking-tight">
            {t("dashboard:title")}
          </h1>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ── LEFT — Profile card ──────────────────────────── */}
          <aside className="lg:col-span-4 space-y-4">
            <div className="bg-base-100 rounded-2xl shadow-sm border border-base-300 overflow-hidden">
              <div className="p-6 flex flex-col items-center text-center">
                {loadingProfile ? (
                  <Skeleton className="w-20 h-20 rounded-full" />
                ) : avatar ? (
                  <div className="relative">
                    <img
                      src={avatar}
                      alt={name}
                      className="w-20 h-20 rounded-full object-cover ring-4 ring-primary/20"
                    />
                    {status === "APPROVED" && (
                      <span className="absolute bottom-0 right-0 w-5 h-5 bg-success rounded-full border-2 border-base-100 flex items-center justify-center">
                        <FiCheckCircle
                          size={10}
                          className="text-success-content"
                        />
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full ring-4 ring-primary/20 bg-primary/10 flex items-center justify-center text-primary">
                    <FiUser size={30} />
                  </div>
                )}

                {loadingProfile ? (
                  <div className="mt-4 space-y-2 w-full">
                    <Skeleton className="h-5 w-3/4 mx-auto" />
                    <Skeleton className="h-3 w-1/2 mx-auto" />
                  </div>
                ) : (
                  <>
                    <h2 className="mt-4 text-lg font-bold text-base-content">
                      {name}
                    </h2>
                    <p className="text-base-content/40 text-xs mt-0.5">
                      @{name.toLowerCase().replace(/\s+/g, "")}
                    </p>
                    <span className={`badge badge-sm mt-2 ${statusCls}`}>
                      {statusLabel}
                    </span>
                  </>
                )}

                {!loadingProfile && (
                  <div className="flex items-center gap-1.5 mt-3">
                    <FiStar className="text-warning" size={14} />
                    <span className="text-sm font-semibold text-base-content">
                      {rating.toFixed(1)}
                    </span>
                    <span className="text-xs text-base-content/40">
                      ({t("dashboard:stats.reviews", { count: reviews })})
                    </span>
                  </div>
                )}
              </div>

              <div className="border-t border-base-200 divide-y divide-base-200 text-sm">
                {INFO_ROW_KEYS.map(({ icon: Icon, labelKey, key }) => (
                  <div
                    key={labelKey}
                    className="flex items-start gap-3 px-5 py-3"
                  >
                    <Icon size={15} className="text-primary mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-base-content/40 text-xs">
                        {t(`dashboard:info.${labelKey}`)}
                      </p>
                      {loadingProfile ? (
                        <Skeleton className="h-3 w-28 mt-1" />
                      ) : (
                        <p className="text-base-content font-medium truncate">
                          {infoValues[key]}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4">
                <button
                  onClick={() => navigate("/tutor/profile/edit")}
                  className="btn btn-primary btn-sm w-full gap-2"
                >
                  <FiEdit2 size={14} /> {t("dashboard:profile.edit")}
                </button>
              </div>
            </div>

            {!loadingProfile && status !== "APPROVED" && (
              <div className="bg-warning/10 border border-warning/30 rounded-2xl p-4 flex gap-3 text-sm">
                <FiAlertCircle
                  className="text-warning shrink-0 mt-0.5"
                  size={16}
                />
                <div>
                  <p className="font-semibold text-base-content">
                    {t("dashboard:profile.incomplete_title")}
                  </p>
                  <p className="text-base-content/60 text-xs mt-0.5">
                    {t("dashboard:profile.incomplete_desc")}
                  </p>
                  <button
                    onClick={() => navigate("/tutor/profile/edit")}
                    className="btn btn-warning btn-xs mt-2"
                  >
                    {t("dashboard:profile.complete_now")}
                  </button>
                </div>
              </div>
            )}
          </aside>

          {/* ── RIGHT — Stats + Table ────────────────────────── */}
          <div className="lg:col-span-8 space-y-6">
            {error && (
              <div className="alert alert-error rounded-2xl shadow-sm">
                <FiAlertCircle size={16} /> {error}
              </div>
            )}

            {/* Stat cards */}
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
              {statCards.map((card) => {
                const Icon = card.icon;
                return (
                  <button
                    type="button"
                    key={card.label}
                    onClick={() => navigate(card.to)}
                    className="bg-base-100 rounded-2xl p-5 shadow-sm border border-base-300 hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-200 text-left"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-base-content/50 text-xs font-medium truncate">
                          {card.label}
                        </p>
                        {isLoading ? (
                          <Skeleton className="h-6 w-12 mt-1" />
                        ) : (
                          <p className="text-base-content text-2xl font-bold mt-1 leading-none">
                            {card.value}
                          </p>
                        )}
                        <p className="text-base-content/30 text-xs mt-1">
                          {card.sub}
                        </p>
                      </div>
                      <div
                        className={`w-10 h-10 rounded-xl ${card.bg} ${card.color} flex items-center justify-center shrink-0`}
                      >
                        <Icon size={18} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* ── Hiring Request table ──────────────────────── */}
            <div className="bg-base-100 rounded-2xl shadow-sm border border-base-300 overflow-hidden">
              <div className="px-6 py-4 flex items-center justify-between border-b border-base-200">
                <div>
                  <h3 className="text-base-content font-bold">
                    {t("dashboard:table.title")}
                  </h3>
                  <p className="text-base-content/40 text-xs mt-0.5">
                    {t("dashboard:table.subtitle")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {bookingStats.pending > 0 && (
                    <span className="badge badge-warning badge-sm">
                      {t("dashboard:table.pending_badge", {
                        count: bookingStats.pending,
                      })}
                    </span>
                  )}
                  <button
                    className="btn btn-ghost btn-xs text-primary"
                    onClick={() => navigate("/tutor/bookings")}
                  >
                    {t("dashboard:table.view_all")}
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                {loadingBookings ? (
                  <div className="p-6 space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex gap-4 items-center">
                        <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                        <Skeleton className="h-3 flex-1" />
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-6 w-16 rounded-lg" />
                      </div>
                    ))}
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 text-base-content/30 py-16">
                    <FiInbox size={32} />
                    <span className="text-sm">
                      {t("dashboard:table.no_pending")}
                    </span>
                  </div>
                ) : (
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-base-200 text-base-content/50 text-xs uppercase tracking-wider">
                        {TABLE_HEADER_KEYS.map((h) => (
                          <th
                            key={h}
                            className="text-left px-5 py-3 font-semibold whitespace-nowrap"
                          >
                            {t(`dashboard:table.${h}`)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-base-200">
                      {bookings.map((b) => {
                        const badge =
                          BOOKING_STATUS_BADGE[b.status] ?? "badge-ghost";
                        const bookingStatusLabel = b.status
                          ? t(`bookings:status.${b.status.toLowerCase()}`)
                          : b.status;
                        return (
                          <tr
                            key={b.id}
                            className="hover:bg-base-200/40 transition-colors"
                          >
                            {/* Student */}
                            <td className="px-5 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <img
                                  src={
                                    b.student?.avatar ||
                                    `https://ui-avatars.com/api/?name=${encodeURIComponent(b.student?.name || b.name || "S")}&size=64&background=random`
                                  }
                                  alt={b.student?.name || b.name}
                                  className="w-8 h-8 rounded-full object-cover shrink-0"
                                />
                                <div>
                                  <p className="font-medium text-base-content text-xs leading-tight">
                                    {b.student?.name || b.name}
                                  </p>
                                  <p className="text-base-content/40 text-xs truncate max-w-25">
                                    {b.student?.email || b.email}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Subject */}
                            <td className="px-5 py-3 whitespace-nowrap">
                              <span className="text-base-content font-medium text-xs">
                                {b.subject}
                              </span>
                            </td>

                            {/* Message */}
                            <td className="px-5 py-3 max-w-45">
                              <p className="text-base-content/60 text-xs line-clamp-2">
                                {b.message}
                              </p>
                            </td>

                            {/* Status */}
                            <td className="px-5 py-3 whitespace-nowrap">
                              <span className={`badge ${badge} badge-sm`}>
                                {bookingStatusLabel}
                              </span>
                            </td>

                            {/* Action */}
                            <td className="px-5 py-3 whitespace-nowrap">
                              {b.status === "PENDING" ? (
                                <div className="flex gap-1.5">
                                  <button
                                    className="btn btn-xs btn-success gap-1"
                                    onClick={() => setAcceptTarget(b)}
                                  >
                                    <FaCheckCircle size={9} />{" "}
                                    {t("dashboard:table.accept")}
                                  </button>
                                  <button
                                    className="btn btn-xs btn-error btn-outline gap-1"
                                    onClick={() => setRejectTarget(b)}
                                  >
                                    <FaTimes size={9} />{" "}
                                    {t("dashboard:table.reject")}
                                  </button>
                                </div>
                              ) : (
                                <span className="text-base-content/30 text-xs">
                                  —
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Footer link */}
              {bookings.length > 0 && (
                <div className="px-6 py-3 border-t border-base-200 text-center">
                  <button
                    className="text-xs text-primary hover:underline"
                    onClick={() => navigate("/tutor/bookings")}
                  >
                    {t("dashboard:table.view_all_count", {
                      count: bookingStats.total,
                    })}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorDashboard;
