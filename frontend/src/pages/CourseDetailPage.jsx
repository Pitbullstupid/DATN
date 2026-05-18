import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FaClock,
  FaBookOpen,
  FaStar,
  FaArrowLeft,
  FaXmark,
  FaCheck,
  FaPlay,
  FaCircleCheck,
  FaCircleXmark,
  FaUserXmark,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa6";
import { FaCalendarAlt } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import {
  getCourseById,
  startCourse,
  completeCourse,
  cancelCourse,
  updateSession,
  reviewCourse,
} from "../api/courseApi";
import { useTranslation } from "react-i18next";
import { getDateLocale } from "../i18n/dateLocale";

// ─── Constants ────────────────────────────────────────────────────────────────
const COURSE_STATUS_STYLE = {
  UPCOMING: { badge: "badge-info", dot: "bg-info" },
  ONGOING: { badge: "badge-warning", dot: "bg-warning" },
  COMPLETED: { badge: "badge-success", dot: "bg-success" },
  CANCELLED: { badge: "badge-error", dot: "bg-error" },
};

const SESSION_STATUS_UI = {
  SCHEDULED: {
    badge: "badge-ghost",
    icon: <FaClock size={11} className="text-base-content/40" />,
  },
  ONGOING: {
    badge: "badge-warning",
    icon: <FaPlay size={11} className="text-warning" />,
  },
  COMPLETED: {
    badge: "badge-success",
    icon: <FaCircleCheck size={11} className="text-success" />,
  },
  CANCELLED: {
    badge: "badge-error",
    icon: <FaCircleXmark size={11} className="text-error" />,
  },
  ABSENT: {
    badge: "badge-error",
    icon: <FaUserXmark size={11} className="text-error" />,
  },
};

const SESSION_ACTIONS = [
  "SCHEDULED",
  "ONGOING",
  "COMPLETED",
  "CANCELLED",
  "ABSENT",
];

const fmtDate = (iso, locale) =>
  iso
    ? new Date(iso).toLocaleDateString(locale, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "—";

const fmtDateTime = (iso, locale) =>
  iso
    ? new Date(iso).toLocaleString(locale, {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

// ─── Review Modal ─────────────────────────────────────────────────────────────
const ReviewModal = ({ course, onClose, onSuccess }) => {
  const { t } = useTranslation(["courses", "toast"]);
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const ratingScale = t("courses:detail.ratingScale", {
    returnObjects: true,
  });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await reviewCourse(course.id, {
        rating,
        comment: comment.trim() || undefined,
      });
      toast.success(t("toast:course_review_thanks"));
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
          <h3 className="font-bold text-lg">{t("courses:detail.reviewTitle")}</h3>
          <button className="btn btn-ghost btn-sm btn-circle" onClick={onClose}>
            <FaXmark size={15} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center gap-3 p-3 bg-base-200/60 rounded-xl">
            <img
              src={
                course.tutorProfile?.user?.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(course.tutorProfile?.user?.name || "T")}&size=80&background=random`
              }
              className="w-10 h-10 rounded-full object-cover"
              alt=""
            />
            <div>
              <p className="font-semibold text-sm">
                {course.tutorProfile?.user?.name}
              </p>
              <p className="text-xs text-base-content/50">{course.subject}</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium mb-2">
              {t("courses:detail.yourRating")}
            </p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onMouseEnter={() => setHover(s)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(s)}
                  className="transition-transform hover:scale-110"
                >
                  <FaStar
                    size={28}
                    className={
                      s <= (hover || rating) ? "text-warning" : "text-base-300"
                    }
                  />
                </button>
              ))}
            </div>
            <p className="text-xs text-base-content/40 mt-1">
              {ratingScale[hover || rating]}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">
              {t("courses:detail.comment")}{" "}
              <span className="text-base-content/40 font-normal">
                {t("courses:detail.commentOptional")}
              </span>
            </label>
            <textarea
              rows={3}
              placeholder={t("courses:detail.commentPlaceholder")}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="textarea textarea-bordered w-full resize-none text-sm focus:outline-none focus:border-primary"
            />
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-2">
          <button
            type="button"
            className="btn btn-ghost flex-1"
            onClick={onClose}
            disabled={loading}
          >
            {t("courses:detail.cancel")}
          </button>
          <button
            type="button"
            className="btn btn-warning flex-1 gap-2"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <FaStar size={13} />
            )}
            {t("courses:detail.submitReview")}
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </dialog>
  );
};

// ─── Progress bar ─────────────────────────────────────────────────────────────
const ProgressBar = ({ done, total }) => {
  const { t } = useTranslation("courses");
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs text-base-content/50 mb-1">
        <span>
          {t("list.sessionsProgress", { done, total })}
        </span>
        <span>{pct}%</span>
      </div>
      <div className="w-full bg-base-300 rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CourseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, i18n } = useTranslation(["courses", "toast", "bookings"]);
  const dateLocale = getDateLocale(i18n.language);
  const weekdayShort = t("courses:shared.weekdayShort", { returnObjects: true });

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showReview, setShowReview] = useState(false);
  const [expandSessions, setExpandSessions] = useState(true);

  // Session update state
  const [updatingSession, setUpdatingSession] = useState(null);

  const fetchCourse = async () => {
    setLoading(true);
    try {
      const res = await getCourseById(id);
      setCourse(res.data?.data?.course);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourse();
  }, [id]);

  if (loading)
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );

  if (error || !course)
    return (
      <div className="min-h-screen bg-base-200 flex flex-col items-center justify-center gap-4">
        <p className="text-error text-lg font-medium">
          {error || t("courses:detail.notFound")}
        </p>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => navigate(-1)}
        >
          <FaArrowLeft size={12} /> {t("courses:detail.back")}
        </button>
      </div>
    );

  const isTutor = user?.role === "TUTOR";
  const isStudent = user?.role === "STUDENT";
  const st = COURSE_STATUS_STYLE[course.status] ?? COURSE_STATUS_STYLE.UPCOMING;
  const courseStatusLabel = t(`courses:detail.courseStatus.${course.status}`, {
    defaultValue: course.status,
  });

  const handleStart = async () => {
    try {
      await startCourse(id);
      toast.success(t("toast:course_started"));
      fetchCourse();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleComplete = async () => {
    if (!window.confirm(t("courses:detail.confirmComplete"))) return;
    try {
      await completeCourse(id);
      toast.success(t("toast:course_completed"));
      fetchCourse();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm(t("courses:detail.confirmCancel"))) return;
    try {
      await cancelCourse(id);
      toast.success(t("toast:course_cancelled"));
      fetchCourse();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleUpdateSession = async (sessionId, status) => {
    setUpdatingSession(sessionId);
    try {
      await updateSession(id, sessionId, { status });
      toast.success(t("toast:session_updated"));
      fetchCourse();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdatingSession(null);
    }
  };

  return (
    <div className="min-h-screen bg-base-200">
      {showReview && (
        <ReviewModal
          course={course}
          onClose={() => setShowReview(false)}
          onSuccess={fetchCourse}
        />
      )}

      {/* Back */}
      <div className="max-w-5xl mx-auto px-4 pt-6">
        <button
          className="btn btn-ghost btn-sm gap-2 text-base-content/60 hover:text-base-content mb-4"
          onClick={() => navigate(-1)}
        >
          <FaArrowLeft size={12} /> {t("courses:detail.back")}
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-12 space-y-5">
        {/* ── Course header card ──────────────────────────────── */}
        <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 p-6">
          {/* Top row: subject + status + actions */}
          <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
            <div>
              <h1 className="text-xl font-bold text-base-content">
                {course.subject}
              </h1>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`badge ${st.badge} badge-sm`}>
                  {courseStatusLabel}
                </span>
                {course.review && (
                  <span className="flex items-center gap-1 text-xs text-warning font-semibold">
                    <FaStar size={11} /> {course.review.rating}.0
                  </span>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              {isTutor && course.status === "UPCOMING" && (
                <button
                  className="btn btn-sm btn-info gap-1.5"
                  onClick={handleStart}
                >
                  <FaPlay size={10} /> {t("courses:detail.startClass")}
                </button>
              )}
              {isTutor && course.status === "ONGOING" && (
                <button
                  className="btn btn-sm btn-success gap-1.5"
                  onClick={handleComplete}
                >
                  <FaCheck size={10} /> {t("courses:detail.completeCourse")}
                </button>
              )}
              {["UPCOMING", "ONGOING"].includes(course.status) && (
                <button
                  className="btn btn-sm btn-error btn-outline gap-1.5"
                  onClick={handleCancel}
                >
                  <FaXmark size={10} /> {t("courses:detail.cancelClass")}
                </button>
              )}
              {isStudent && course.status === "COMPLETED" && !course.review && (
                <button
                  className="btn btn-sm btn-warning gap-1.5"
                  onClick={() => setShowReview(true)}
                >
                  <FaStar size={11} /> {t("courses:detail.rate")}
                </button>
              )}
            </div>
          </div>

          {/* Tutor + Student side by side */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Tutor */}
            <div className="flex items-center gap-3 flex-1 min-w-0 bg-base-200/50 rounded-xl px-4 py-3">
              <div className="relative shrink-0">
                <img
                  src={
                    course.tutorProfile?.user?.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(course.tutorProfile?.user?.name || "T")}&size=80&background=random`
                  }
                  alt={course.tutorProfile?.user?.name}
                  className="w-11 h-11 rounded-full object-cover border-2 border-base-100"
                />
                <span className="absolute -bottom-1 -right-1 bg-primary text-primary-content text-[9px] font-bold px-1 rounded-full leading-4">
                  {t("courses:detail.badgeTutor")}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-base-content/50 font-medium">
                  {t("courses:detail.roleTutor")}
                </p>
                <p className="font-semibold text-sm text-base-content truncate">
                  {course.tutorProfile?.user?.name || "—"}
                </p>
                {course.tutorProfile?.subjects?.[0] && (
                  <p className="text-xs text-base-content/40 truncate">
                    {t("bookings:student.tutor_role", {
                      subject: course.tutorProfile.subjects[0],
                    })}
                  </p>
                )}
              </div>
              {/* Badge "Bạn" nếu là tutor đang xem */}
              {isTutor && (
                <span className="badge badge-primary badge-xs ml-auto shrink-0">
                  {t("courses:detail.you")}
                </span>
              )}
            </div>

            {/* Arrow separator */}
            <div className="flex flex-col items-center gap-1 shrink-0 px-1">
              <div className="w-px h-4 bg-base-300" />
              <span className="text-base-content/30 text-xs">↔</span>
              <div className="w-px h-4 bg-base-300" />
            </div>

            {/* Student */}
            <div className="flex items-center gap-3 flex-1 min-w-0 bg-base-200/50 rounded-xl px-4 py-3">
              <div className="relative shrink-0">
                <img
                  src={
                    course.student?.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(course.student?.name || "S")}&size=80&background=random`
                  }
                  alt={course.student?.name}
                  className="w-11 h-11 rounded-full object-cover border-2 border-base-100"
                />
                <span className="absolute -bottom-1 -right-1 bg-secondary text-secondary-content text-[9px] font-bold px-1 rounded-full leading-4">
                  {t("courses:detail.badgeStudent")}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-base-content/50 font-medium">
                  {t("courses:detail.roleStudent")}
                </p>
                <p className="font-semibold text-sm text-base-content truncate">
                  {course.student?.name || "—"}
                </p>
                {course.student?.email && (
                  <p className="text-xs text-base-content/40 truncate">
                    {course.student.email}
                  </p>
                )}
              </div>
              {/* Badge "Bạn" nếu là student đang xem */}
              {isStudent && (
                <span className="badge badge-secondary badge-xs ml-auto shrink-0">
                  {t("courses:detail.you")}
                </span>
              )}
            </div>
          </div>

          {/* Progress */}
          <div className="mt-5">
            <ProgressBar
              done={course.sessionsDone}
              total={course.totalSessions}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* ── Left: info + schedule ───────────────────────── */}
          <div className="space-y-5">
            {/* Course info */}
            <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 p-5">
              <h2 className="font-bold text-base-content text-sm mb-4">
                {t("courses:detail.courseInfo")}
              </h2>
              <div className="space-y-3 text-sm">
                {[
                  {
                    icon: <FaCalendarAlt className="text-primary" size={13} />,
                    label: t("courses:detail.labelStart"),
                    value: fmtDate(course.startDate, dateLocale),
                  },
                  {
                    icon: <FaCalendarAlt className="text-primary" size={13} />,
                    label: t("courses:detail.labelEnd"),
                    value: fmtDate(course.endDate, dateLocale),
                  },
                  {
                    icon: <FaClock className="text-primary" size={13} />,
                    label: t("courses:detail.labelDuration"),
                    value: t("courses:detail.durationValue", {
                      minutes: course.durationMin,
                    }),
                  },
                  {
                    icon: <FaBookOpen className="text-primary" size={13} />,
                    label: t("courses:detail.labelTotalSessions"),
                    value: t("courses:detail.sessionsValue", {
                      count: course.totalSessions,
                    }),
                  },
                  ...(course.pricePerSession != null
                    ? [
                        {
                          icon: (
                            <span className="text-success font-bold text-xs">
                              $
                            </span>
                          ),
                          label: t("courses:detail.labelPriceSession"),
                          value: `$${Number(course.pricePerSession).toFixed(2)}`,
                        },
                        {
                          icon: (
                            <span className="text-success font-bold text-xs">
                              Σ
                            </span>
                          ),
                          label: t("courses:detail.labelTotalPrice"),
                          value: `$${Number(course.totalPrice).toFixed(2)}`,
                        },
                      ]
                    : []),
                ].map((row) => (
                  <div key={row.label} className="flex items-center gap-3">
                    <div className="w-6 flex items-center justify-center shrink-0">
                      {row.icon}
                    </div>
                    <div className="flex-1 flex items-center justify-between">
                      <span className="text-base-content/50">{row.label}</span>
                      <span className="font-medium text-base-content">
                        {row.value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {course.note && (
                <div className="mt-4 bg-base-200/60 rounded-xl px-4 py-2.5 text-xs text-base-content/60 italic">
                  "{course.note}"
                </div>
              )}
            </div>

            {/* Weekly schedule */}
            {course.schedules?.length > 0 && (
              <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 p-5">
                <h2 className="font-bold text-base-content text-sm mb-3">
                  {t("courses:detail.schedule")}
                </h2>
                <div className="space-y-2">
                  {course.schedules.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center gap-3 bg-base-200/60 rounded-xl px-4 py-2.5"
                    >
                      <span className="badge badge-primary badge-sm font-semibold min-w-9 justify-center">
                        {weekdayShort[s.dayOfWeek]}
                      </span>
                      <span className="text-sm text-base-content font-medium">
                        {s.startTime} – {s.endTime}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Review */}
            {course.review && (
              <div className="bg-warning/10 border border-warning/20 rounded-2xl p-5">
                <h2 className="font-bold text-base-content text-sm mb-3">
                  {t("courses:detail.reviewSection")}
                </h2>
                <div className="flex gap-1 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <FaStar
                      key={i}
                      size={16}
                      className={
                        i < course.review.rating
                          ? "text-warning"
                          : "text-base-300"
                      }
                    />
                  ))}
                </div>
                {course.review.comment && (
                  <p className="text-sm text-base-content/70 italic">
                    "{course.review.comment}"
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ── Right: session list ──────────────────────────── */}
          <div className="lg:col-span-2">
            <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-base-200">
                <div>
                  <h2 className="font-bold text-base-content text-sm">
                    {t("courses:detail.sessionList")}
                  </h2>
                  <p className="text-xs text-base-content/40 mt-0.5">
                    {t("courses:detail.sessionsDoneLine", {
                      done: course.sessionsDone,
                      total: course.totalSessions,
                    })}
                  </p>
                </div>
                <button
                  className="btn btn-ghost btn-sm btn-circle"
                  onClick={() => setExpandSessions((v) => !v)}
                >
                  {expandSessions ? (
                    <FaChevronUp size={13} />
                  ) : (
                    <FaChevronDown size={13} />
                  )}
                </button>
              </div>

              {expandSessions && (
                <div className="divide-y divide-base-200 max-h-150 overflow-y-auto">
                  {course.sessions?.length === 0 ? (
                    <div className="py-12 text-center text-base-content/30 text-sm">
                      {t("courses:detail.noSessions")}
                    </div>
                  ) : (
                    course.sessions.map((s) => {
                      const sst =
                        SESSION_STATUS_UI[s.status] ?? SESSION_STATUS_UI.SCHEDULED;
                      const isUpdating = updatingSession === s.id;
                      const sessionStatusLabel = t(
                        `courses:detail.sessionStatus.${s.status}`,
                        { defaultValue: s.status }
                      );

                      return (
                        <div
                          key={s.id}
                          className="px-5 py-3.5 hover:bg-base-200/30 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {/* Number */}
                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <span className="text-xs font-bold text-primary">
                                {s.sessionNumber}
                              </span>
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-base-content">
                                {fmtDateTime(s.scheduledAt, dateLocale)}
                              </p>
                              <p className="text-xs text-base-content/50">
                                {t("courses:detail.sessionMinutes", {
                                  minutes: s.durationMin,
                                })}
                              </p>
                              {s.note && (
                                <p className="text-xs text-base-content/40 italic mt-0.5">
                                  "{s.note}"
                                </p>
                              )}
                            </div>

                            {/* Status + tutor action */}
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="flex items-center gap-1.5">
                                {sst.icon}
                                <span className={`badge ${sst.badge} badge-xs`}>
                                  {sessionStatusLabel}
                                </span>
                              </div>

                              {isTutor && course.status === "ONGOING" && (
                                <select
                                  value={s.status}
                                  disabled={isUpdating}
                                  onChange={(e) =>
                                    handleUpdateSession(s.id, e.target.value)
                                  }
                                  className="select select-xs select-bordered bg-base-100 focus:outline-none"
                                >
                                  {SESSION_ACTIONS.map((a) => (
                                    <option key={a} value={a}>
                                      {t(`courses:detail.sessionStatus.${a}`, {
                                        defaultValue: a,
                                      })}
                                    </option>
                                  ))}
                                </select>
                              )}
                              {isUpdating && (
                                <span className="loading loading-spinner loading-xs text-primary" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
