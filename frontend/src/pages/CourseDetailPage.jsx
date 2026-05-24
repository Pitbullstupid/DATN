import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
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
  FaPaperPlane,
  FaCircleInfo,
  FaLock,
} from "react-icons/fa6";
import { FaCalendarAlt } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { getDateLocale } from "../i18n/dateLocale";
import {
  getCourseById,
  startCourse,
  requestEndCourse,
  cancelCourse,
  updateSession,
  confirmSession,
  reviewCourse,
  getMessages,
  sendMessage,
} from "../api/courseApi";
import PaymentBanner from "../components/PaymentBanner";

// ─── Constants ────────────────────────────────────────────────────────────────
const COURSE_STATUS_STYLE = {
  PENDING_PAYMENT: { badge: "badge-warning" },
  UPCOMING: { badge: "badge-info" },
  ONGOING: { badge: "badge-warning" },
  COMPLETED: { badge: "badge-success" },
  CANCELLED: { badge: "badge-error" },
};

const SESSION_STATUS_STYLE = {
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

const fmtTime = (iso, locale) =>
  iso
    ? new Date(iso).toLocaleTimeString(locale, {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

// ─── Review Modal ─────────────────────────────────────────────────────────────
const ReviewModal = ({ course, onClose, onSuccess }) => {
  const { t } = useTranslation(["courses", "toast"]);
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const ratingScale = t("courses:detail.ratingScale", { returnObjects: true });

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
          <h3 className="font-bold text-lg">
            {t("courses:detail.reviewTitle")}
          </h3>
          <button className="btn btn-ghost btn-sm btn-circle" onClick={onClose}>
            <FaXmark size={15} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center gap-3 p-3 bg-base-200/60 rounded-xl">
            <img
              src={
                course.tutorProfile?.user?.avatar ||
                `https://ui-avatars.com/api/?name=T&size=80`
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
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="textarea textarea-bordered w-full resize-none text-sm"
              placeholder={t("courses:detail.commentPlaceholder")}
            />
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-2">
          <button
            className="btn btn-ghost flex-1"
            onClick={onClose}
            disabled={loading}
          >
            {t("courses:detail.cancel")}
          </button>
          <button
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
        <span>{t("detail.progressComplete", { done, total })}</span>
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

// ─── Confirm indicator ────────────────────────────────────────────────────────
const ConfirmBadges = ({ tutorConfirmed, studentConfirmed, small = false }) => {
  const { t } = useTranslation("courses");
  return (
    <div className={`flex gap-1.5 ${small ? "text-[10px]" : "text-xs"}`}>
      <span
        className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full ${tutorConfirmed ? "bg-success/20 text-success" : "bg-base-300 text-base-content/40"}`}
      >
        <FaCheck size={small ? 8 : 9} /> {t("detail.badgeTutor")}
      </span>
      <span
        className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full ${studentConfirmed ? "bg-success/20 text-success" : "bg-base-300 text-base-content/40"}`}
      >
        <FaCheck size={small ? 8 : 9} /> {t("detail.badgeStudent")}
      </span>
    </div>
  );
};

// ─── Chat panel ───────────────────────────────────────────────────────────────
const ChatPanel = ({ courseId, currentUserId }) => {
  const { t, i18n } = useTranslation("courses");
  const dateLocale = getDateLocale(i18n.language);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await getMessages(courseId, { limit: 100 });
      setMessages(res.data?.data?.messages || []);
    } catch {}
  }, [courseId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Poll every 5s
  useEffect(() => {
    const intervalId = setInterval(fetchMessages, 5000);
    return () => clearInterval(intervalId);
  }, [fetchMessages]);

  // Auto scroll xuống cuối
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const res = await sendMessage(courseId, text.trim());
      setMessages((prev) => [...prev, res.data?.data?.message]);
      setText("");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-base-content/30 text-sm">
            {t("detail.chatEmpty")}
          </div>
        )}
        {messages.map((msg, i) => {
          const isMine =
            msg.senderId === currentUserId || msg.sender?.id === currentUserId;
          const showAvatar =
            !isMine && (i === 0 || messages[i - 1]?.senderId !== msg.senderId);
          return (
            <div
              key={msg.id}
              className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Avatar (chỉ hiện khi message đầu tiên trong nhóm) */}
              {!isMine && (
                <div className="w-7 h-7 shrink-0">
                  {showAvatar && (
                    <img
                      src={
                        msg.sender?.avatar ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.sender?.name || "?")}&size=56&background=random`
                      }
                      alt={msg.sender?.name}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  )}
                </div>
              )}

              <div
                className={`max-w-[70%] flex flex-col ${isMine ? "items-end" : "items-start"}`}
              >
                {showAvatar && !isMine && (
                  <span className="text-[10px] text-base-content/40 mb-0.5 ml-1">
                    {msg.sender?.name}
                  </span>
                )}
                <div
                  className={`px-3 py-2 rounded-2xl text-sm leading-relaxed break-words ${
                    isMine
                      ? "bg-primary text-primary-content rounded-br-sm"
                      : "bg-base-200 text-base-content rounded-bl-sm"
                  }`}
                >
                  {msg.content}
                </div>
                <span className="text-[10px] text-base-content/30 mt-0.5 mx-1">
                  {fmtTime(msg.createdAt, dateLocale)}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-base-200 p-3 flex gap-2 items-end">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder={t("detail.chatPlaceholder")}
          rows={1}
          className="textarea textarea-bordered flex-1 resize-none text-sm focus:outline-none focus:border-primary min-h-[40px] max-h-[100px]"
        />
        <button
          className="btn btn-primary btn-sm btn-circle shrink-0"
          onClick={handleSend}
          disabled={!text.trim() || sending}
        >
          {sending ? (
            <span className="loading loading-spinner loading-xs" />
          ) : (
            <FaPaperPlane size={13} />
          )}
        </button>
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
  const weekdayShort = t("courses:shared.weekdayShort", {
    returnObjects: true,
  });

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showReview, setShowReview] = useState(false);
  const [expandSessions, setExpandSessions] = useState(true);
  const [activeTab, setActiveTab] = useState("sessions"); // "sessions" | "chat"
  const [updatingSession, setUpdatingSession] = useState(null);
  const [confirmingSession, setConfirmingSession] = useState(null);
  const [requestingEnd, setRequestingEnd] = useState(false);
  const location = useLocation();

  const fetchCourse = useCallback(async () => {
    try {
      const res = await getCourseById(id);
      setCourse(res.data?.data?.course);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);
  // Trong CourseDetailPage, thêm useEffect này:
  useEffect(() => {
    const handler = (e) => {
      const notif = e.detail;
      // Reload nếu notification liên quan đến course đang xem
      if (notif?.courseId === id) {
        fetchCourse();
      }
    };

    window.addEventListener("new-notification", handler);
    return () => window.removeEventListener("new-notification", handler);
  }, [id, fetchCourse]);
  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

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

  const handleRequestEnd = async () => {
    const confirmMsg = isTutor
      ? t("courses:detail.confirmEndTutor")
      : t("courses:detail.confirmEndStudent");
    if (!window.confirm(confirmMsg)) return;
    setRequestingEnd(true);
    try {
      const res = await requestEndCourse(id);
      toast.success(res.data.message);
      fetchCourse();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRequestingEnd(false);
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
      fetchCourse();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdatingSession(null);
    }
  };

  const handleConfirmSession = async (sessionId) => {
    setConfirmingSession(sessionId);
    try {
      const res = await confirmSession(id, sessionId);
      toast.success(res.data.message);
      fetchCourse();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setConfirmingSession(null);
    }
  };

  // Trạng thái confirm kết thúc khóa
  const myEndConfirmed = isTutor
    ? course.tutorConfirmedEnd
    : course.studentConfirmedEnd;
  const theirEndConfirmed = isTutor
    ? course.studentConfirmedEnd
    : course.tutorConfirmedEnd;

  return (
    <div className="min-h-screen bg-base-200">
      {showReview && (
        <ReviewModal
          course={course}
          onClose={() => setShowReview(false)}
          onSuccess={fetchCourse}
        />
      )}

      <div className="max-w-5xl mx-auto px-4 pt-6">
        <button
          className="btn btn-ghost btn-sm gap-2 text-base-content/60 mb-4"
          onClick={() => navigate(-1)}
        >
          <FaArrowLeft size={12} /> {t("courses:detail.back")}
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-12 space-y-5">
        {/* ── Header card ──────────────────────────────────────── */}
        <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 p-6">
          {/* Title + status + actions */}
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

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              {isTutor && course.status === "UPCOMING" && (
                <button
                  className="btn btn-sm btn-info gap-1.5"
                  onClick={handleStart}
                >
                  <FaPlay size={10} /> {t("courses:detail.startClass")}
                </button>
              )}

              {/* Kết thúc khóa - 2 chiều */}
              {course.status === "ONGOING" && !myEndConfirmed && (
                <button
                  className={`btn btn-sm gap-1.5 ${isTutor ? "btn-warning" : "btn-success"}`}
                  onClick={handleRequestEnd}
                  disabled={requestingEnd}
                >
                  {requestingEnd ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    <FaCheck size={10} />
                  )}
                  {isTutor
                    ? t("courses:detail.requestEndTutor")
                    : t("courses:detail.requestEndStudent")}
                </button>
              )}

              {/* Đã confirm, chờ bên kia */}
              {course.status === "ONGOING" &&
                myEndConfirmed &&
                !theirEndConfirmed && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-warning/10 border border-warning/30 rounded-xl text-xs text-warning">
                    <FaCircleInfo size={12} />
                    {isTutor
                      ? t("courses:detail.waitingEndFromStudent")
                      : t("courses:detail.waitingEndFromTutor")}
                  </div>
                )}

              {["PENDING_PAYMENT", "UPCOMING", "ONGOING"].includes(
                course.status,
              ) && (
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

          {/* Tutor ↔ Student */}
          <div className="flex items-center gap-3 flex-wrap mb-5">
            <div className="flex items-center gap-3 flex-1 min-w-0 bg-base-200/50 rounded-xl px-4 py-3">
              <div className="relative shrink-0">
                <img
                  src={
                    course.tutorProfile?.user?.avatar ||
                    `https://ui-avatars.com/api/?name=T&size=80&background=random`
                  }
                  className="w-11 h-11 rounded-full object-cover border-2 border-base-100"
                  alt=""
                />
                <span className="absolute -bottom-1 -right-1 bg-primary text-primary-content text-[9px] font-bold px-1 rounded-full leading-4">
                  {t("courses:detail.badgeTutor")}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-base-content/50">
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
              {isTutor && (
                <span className="badge badge-primary badge-xs ml-auto shrink-0">
                  {t("courses:detail.you")}
                </span>
              )}
            </div>

            <div className="flex flex-col items-center gap-1 shrink-0 px-1">
              <div className="w-px h-4 bg-base-300" />
              <span className="text-base-content/30 text-xs">↔</span>
              <div className="w-px h-4 bg-base-300" />
            </div>

            <div className="flex items-center gap-3 flex-1 min-w-0 bg-base-200/50 rounded-xl px-4 py-3">
              <div className="relative shrink-0">
                <img
                  src={
                    course.student?.avatar ||
                    `https://ui-avatars.com/api/?name=S&size=80&background=random`
                  }
                  className="w-11 h-11 rounded-full object-cover border-2 border-base-100"
                  alt=""
                />
                <span className="absolute -bottom-1 -right-1 bg-secondary text-secondary-content text-[9px] font-bold px-1 rounded-full leading-4">
                  {t("courses:detail.badgeStudent")}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-base-content/50">
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
              {isStudent && (
                <span className="badge badge-secondary badge-xs ml-auto shrink-0">
                  {t("courses:detail.you")}
                </span>
              )}
            </div>
          </div>

          {/* Progress */}
          <ProgressBar
            done={course.sessionsDone}
            total={course.totalSessions}
          />
        </div>
        <PaymentBanner course={course} isStudent={isStudent} />
        {/* ── Body ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* LEFT: course info + schedule + review */}
          <div className="space-y-5">
            <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 p-5">
              <h2 className="font-bold text-sm text-base-content mb-4">
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
                    label: t("courses:detail.labelSessionsCount"),
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
                ].map(({ icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="w-6 flex items-center justify-center shrink-0">
                      {icon}
                    </div>
                    <div className="flex-1 flex items-center justify-between">
                      <span className="text-base-content/50">{label}</span>
                      <span className="font-medium text-base-content">
                        {value}
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

            {/* TKB */}
            {course.schedules?.length > 0 && (
              <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 p-5">
                <h2 className="font-bold text-sm text-base-content mb-3">
                  {t("courses:detail.schedule")}
                </h2>
                <div className="space-y-2">
                  {course.schedules.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center gap-3 bg-base-200/60 rounded-xl px-4 py-2.5"
                    >
                      <span className="badge badge-primary badge-sm font-semibold min-w-[40px] justify-center">
                        {weekdayShort[s.dayOfWeek]}
                      </span>
                      <span className="text-sm font-medium text-base-content">
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
                <h2 className="font-bold text-sm text-base-content mb-3">
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

          {/* RIGHT: sessions + chat tabs */}
          <div
            className="lg:col-span-2 flex flex-col gap-0 bg-base-100 rounded-2xl shadow-sm border border-base-200 overflow-hidden"
            style={{ height: "680px" }}
          >
            {/* Tab bar */}
            <div className="flex border-b border-base-200 shrink-0">
              {[
                {
                  key: "sessions",
                  label: t("courses:detail.tabSessions", {
                    count: course.sessions?.length || 0,
                  }),
                },
                { key: "chat", label: t("courses:detail.tabChat") },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === tab.key
                      ? "border-primary text-primary"
                      : "border-transparent text-base-content/50 hover:text-base-content"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Sessions tab */}
            {activeTab === "sessions" && (
              <div className="flex-1 overflow-y-auto">
                <div className="px-5 py-3 border-b border-base-200 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm text-base-content">
                      {t("courses:detail.sessionList")}
                    </p>
                    <p className="text-xs text-base-content/40">
                      {t("courses:detail.sessionsTabSubtitle", {
                        done: course.sessionsDone,
                        total: course.totalSessions,
                      })}
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-base-200">
                  {course.sessions?.map((s) => {
                    const sst =
                      SESSION_STATUS_STYLE[s.status] ??
                      SESSION_STATUS_STYLE.SCHEDULED;
                    const locked = s.tutorConfirmed && s.studentConfirmed;
                    const isUpdating = updatingSession === s.id;
                    const isConfirming = confirmingSession === s.id;

                    // Người dùng hiện tại đã confirm chưa
                    const myConfirmed = isTutor
                      ? s.tutorConfirmed
                      : s.studentConfirmed;
                    const theirConfirmed = isTutor
                      ? s.studentConfirmed
                      : s.tutorConfirmed;

                    const sessionStatusLabel = t(
                      `courses:detail.sessionStatus.${s.status}`,
                      { defaultValue: s.status },
                    );

                    return (
                      <div
                        key={s.id}
                        className={`px-5 py-3.5 transition-colors ${locked ? "bg-success/5" : "hover:bg-base-200/30"}`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Number */}
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${locked ? "bg-success/20" : "bg-primary/10"}`}
                          >
                            {locked ? (
                              <FaLock size={9} className="text-success" />
                            ) : (
                              <span className="text-xs font-bold text-primary">
                                {s.sessionNumber}
                              </span>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-medium text-base-content">
                                {fmtDateTime(s.scheduledAt, dateLocale)}
                              </p>
                              <span className={`badge ${sst.badge} badge-xs`}>
                                {sessionStatusLabel}
                              </span>
                              {locked && (
                                <span className="badge badge-success badge-xs gap-1">
                                  <FaLock size={7} />{" "}
                                  {t("courses:detail.sessionLocked")}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-base-content/50 mt-0.5">
                              {t("courses:detail.sessionMinutes", {
                                minutes: s.durationMin,
                              })}
                            </p>
                            {s.note && (
                              <p className="text-xs text-base-content/40 italic mt-0.5">
                                "{s.note}"
                              </p>
                            )}

                            {/* Confirm badges */}
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <ConfirmBadges
                                tutorConfirmed={s.tutorConfirmed}
                                studentConfirmed={s.studentConfirmed}
                                small
                              />

                              {/* Nút confirm của user hiện tại */}
                              {course.status === "ONGOING" &&
                                !locked &&
                                !myConfirmed &&
                                (s.status === "ONGOING" ||
                                  s.status === "COMPLETED") && (
                                  <button
                                    className="btn btn-xs btn-success gap-1"
                                    onClick={() => handleConfirmSession(s.id)}
                                    disabled={isConfirming}
                                  >
                                    {isConfirming ? (
                                      <span className="loading loading-spinner loading-xs" />
                                    ) : (
                                      <FaCheck size={8} />
                                    )}
                                    {t("courses:detail.confirmSession")}
                                  </button>
                                )}

                              {!locked && myConfirmed && !theirConfirmed && (
                                <span className="text-xs text-warning flex items-center gap-1">
                                  <FaCircleInfo size={10} />
                                  {isTutor
                                    ? t(
                                        "courses:detail.waitingSessionFromStudent",
                                      )
                                    : t(
                                        "courses:detail.waitingSessionFromTutor",
                                      )}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Tutor dropdown — chỉ khi chưa lock */}
                          {isTutor &&
                            course.status === "ONGOING" &&
                            !locked && (
                              <select
                                value={s.status}
                                disabled={isUpdating}
                                onChange={(e) =>
                                  handleUpdateSession(s.id, e.target.value)
                                }
                                className="select select-xs select-bordered bg-base-100 focus:outline-none shrink-0"
                              >
                                {[
                                  "SCHEDULED",
                                  "ONGOING",
                                  "COMPLETED",
                                  "CANCELLED",
                                  "ABSENT",
                                ].map((statusKey) => (
                                  <option key={statusKey} value={statusKey}>
                                    {t(
                                      `courses:detail.sessionStatus.${statusKey}`,
                                      { defaultValue: statusKey },
                                    )}
                                  </option>
                                ))}
                              </select>
                            )}
                          {isUpdating && (
                            <span className="loading loading-spinner loading-xs text-primary shrink-0" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Chat tab */}
            {activeTab === "chat" && (
              <div className="flex-1 min-h-0 flex flex-col">
                <ChatPanel courseId={id} currentUserId={user?.id} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
