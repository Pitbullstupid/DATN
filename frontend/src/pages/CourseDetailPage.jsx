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

// ─── Constants ────────────────────────────────────────────────────────────────
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const COURSE_STATUS_STYLE = {
  UPCOMING: { badge: "badge-info", label: "Upcoming", dot: "bg-info" },
  ONGOING: { badge: "badge-warning", label: "Ongoing", dot: "bg-warning" },
  COMPLETED: { badge: "badge-success", label: "Completed", dot: "bg-success" },
  CANCELLED: { badge: "badge-error", label: "Cancelled", dot: "bg-error" },
};

const SESSION_STATUS = {
  SCHEDULED: {
    badge: "badge-ghost",
    label: "Scheduled",
    icon: <FaClock size={11} className="text-base-content/40" />,
  },
  ONGOING: {
    badge: "badge-warning",
    label: "Ongoing",
    icon: <FaPlay size={11} className="text-warning" />,
  },
  COMPLETED: {
    badge: "badge-success",
    label: "Completed",
    icon: <FaCircleCheck size={11} className="text-success" />,
  },
  CANCELLED: {
    badge: "badge-error",
    label: "Cancelled",
    icon: <FaCircleXmark size={11} className="text-error" />,
  },
  ABSENT: {
    badge: "badge-error",
    label: "Absent",
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

const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "—";

const fmtDateTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString("vi-VN", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

// ─── Review Modal ─────────────────────────────────────────────────────────────
const ReviewModal = ({ course, onClose, onSuccess }) => {
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await reviewCourse(course.id, {
        rating,
        comment: comment.trim() || undefined,
      });
      toast.success("Cảm ơn bạn đã đánh giá!");
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
          <h3 className="font-bold text-lg">Đánh giá khóa học</h3>
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
            <p className="text-sm font-medium mb-2">Đánh giá của bạn</p>
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
              {
                ["", "Tệ", "Bình thường", "Tốt", "Rất tốt", "Xuất sắc"][
                  hover || rating
                ]
              }
            </p>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">
              Nhận xét{" "}
              <span className="text-base-content/40 font-normal">
                (tùy chọn)
              </span>
            </label>
            <textarea
              rows={3}
              placeholder="Chia sẻ cảm nhận của bạn..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="textarea textarea-bordered w-full resize-none text-sm focus:outline-none focus:border-primary"
            />
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-2">
          <button
            className="btn btn-ghost flex-1"
            onClick={onClose}
            disabled={loading}
          >
            Huỷ
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
            Gửi đánh giá
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </dialog>
  );
};

// ─── Progress bar ─────────────────────────────────────────────────────────────
const ProgressBar = ({ done, total }) => {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs text-base-content/50 mb-1">
        <span>
          {done}/{total} buổi
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
          {error || "Không tìm thấy lớp học"}
        </p>
        <button className="btn btn-primary btn-sm" onClick={() => navigate(-1)}>
          <FaArrowLeft size={12} /> Quay lại
        </button>
      </div>
    );

  const isTutor = user?.role === "TUTOR";
  const isStudent = user?.role === "STUDENT";
  const st = COURSE_STATUS_STYLE[course.status] ?? COURSE_STATUS_STYLE.UPCOMING;

  const handleStart = async () => {
    try {
      await startCourse(id);
      toast.success("Lớp học đã bắt đầu!");
      fetchCourse();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleComplete = async () => {
    if (!window.confirm("Xác nhận kết thúc khóa học?")) return;
    try {
      await completeCourse(id);
      toast.success("Khóa học đã hoàn thành!");
      fetchCourse();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("Bạn chắc chắn muốn huỷ khóa học này?")) return;
    try {
      await cancelCourse(id);
      toast.success("Đã huỷ khóa học");
      fetchCourse();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleUpdateSession = async (sessionId, status) => {
    setUpdatingSession(sessionId);
    try {
      await updateSession(id, sessionId, { status });
      toast.success("Đã cập nhật buổi học");
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
          <FaArrowLeft size={12} /> Quay lại
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-12 space-y-5">
        {/* ── Course header card ──────────────────────────────── */}
        <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <img
                src={
                  (isTutor
                    ? course.student?.avatar
                    : course.tutorProfile?.user?.avatar) ||
                  `https://ui-avatars.com/api/?name=T&size=80&background=random`
                }
                alt=""
                className="w-14 h-14 rounded-full object-cover border-2 border-base-200"
              />
              <div>
                <h1 className="text-xl font-bold text-base-content">
                  {course.subject}
                </h1>
                <p className="text-sm text-base-content/60 mt-0.5">
                  {isTutor
                    ? `Student: ${course.student?.name}`
                    : `Tutor: ${course.tutorProfile?.user?.name}`}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`badge ${st.badge} badge-sm`}>
                    {st.label}
                  </span>
                  {course.review && (
                    <span className="flex items-center gap-1 text-xs text-warning">
                      <FaStar size={11} /> {course.review.rating}.0
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              {isTutor && course.status === "UPCOMING" && (
                <button
                  className="btn btn-sm btn-info gap-1.5"
                  onClick={handleStart}
                >
                  <FaPlay size={10} /> Bắt đầu lớp
                </button>
              )}
              {isTutor && course.status === "ONGOING" && (
                <button
                  className="btn btn-sm btn-success gap-1.5"
                  onClick={handleComplete}
                >
                  <FaCheck size={10} /> Kết thúc khóa
                </button>
              )}
              {["UPCOMING", "ONGOING"].includes(course.status) && (
                <button
                  className="btn btn-sm btn-error btn-outline gap-1.5"
                  onClick={handleCancel}
                >
                  <FaXmark size={10} /> Huỷ lớp
                </button>
              )}
              {isStudent && course.status === "COMPLETED" && !course.review && (
                <button
                  className="btn btn-sm btn-warning gap-1.5"
                  onClick={() => setShowReview(true)}
                >
                  <FaStar size={11} /> Đánh giá
                </button>
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
                Thông tin khóa học
              </h2>
              <div className="space-y-3 text-sm">
                {[
                  {
                    icon: <FaCalendarAlt className="text-primary" size={13} />,
                    label: "Bắt đầu",
                    value: fmtDate(course.startDate),
                  },
                  {
                    icon: <FaCalendarAlt className="text-primary" size={13} />,
                    label: "Kết thúc",
                    value: fmtDate(course.endDate),
                  },
                  {
                    icon: <FaClock className="text-primary" size={13} />,
                    label: "Thời lượng",
                    value: `${course.durationMin} phút/buổi`,
                  },
                  {
                    icon: <FaBookOpen className="text-primary" size={13} />,
                    label: "Tổng số buổi",
                    value: `${course.totalSessions} buổi`,
                  },
                  ...(course.pricePerSession != null
                    ? [
                        {
                          icon: (
                            <span className="text-success font-bold text-xs">
                              $
                            </span>
                          ),
                          label: "Giá/buổi",
                          value: `$${Number(course.pricePerSession).toFixed(2)}`,
                        },
                        {
                          icon: (
                            <span className="text-success font-bold text-xs">
                              Σ
                            </span>
                          ),
                          label: "Tổng học phí",
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

            {/* Weekly schedule */}
            {course.schedules?.length > 0 && (
              <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 p-5">
                <h2 className="font-bold text-base-content text-sm mb-3">
                  Thời khóa biểu
                </h2>
                <div className="space-y-2">
                  {course.schedules.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center gap-3 bg-base-200/60 rounded-xl px-4 py-2.5"
                    >
                      <span className="badge badge-primary badge-sm font-semibold min-w-[36px] justify-center">
                        {DAY_NAMES[s.dayOfWeek]}
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
                  Đánh giá
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
                    Danh sách buổi học
                  </h2>
                  <p className="text-xs text-base-content/40 mt-0.5">
                    {course.sessionsDone}/{course.totalSessions} buổi đã hoàn
                    thành
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
                <div className="divide-y divide-base-200 max-h-[600px] overflow-y-auto">
                  {course.sessions?.length === 0 ? (
                    <div className="py-12 text-center text-base-content/30 text-sm">
                      Chưa có buổi học nào
                    </div>
                  ) : (
                    course.sessions.map((s) => {
                      const sst =
                        SESSION_STATUS[s.status] ?? SESSION_STATUS.SCHEDULED;
                      const isUpdating = updatingSession === s.id;

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
                                {fmtDateTime(s.scheduledAt)}
                              </p>
                              <p className="text-xs text-base-content/50">
                                {s.durationMin} phút
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
                                  {sst.label}
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
                                      {SESSION_STATUS[a]?.label}
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
