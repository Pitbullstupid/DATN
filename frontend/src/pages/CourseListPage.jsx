import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FaClock, FaBookOpen, FaStar,
  FaChevronLeft, FaChevronRight, FaInbox,
  FaCirclePlay, FaCircleCheck, FaCircleXmark,
} from "react-icons/fa6";
import {FaCalendarAlt} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { getMyCoursesAsStudent, getMyCoursesAsTutor } from "../api/courseApi";

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_TABS = [
  { label: "All",       value: ""          },
  { label: "Upcoming",  value: "UPCOMING"  },
  { label: "Ongoing",   value: "ONGOING"   },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
];

const STATUS_STYLE = {
  UPCOMING:  { badge: "badge-info",    label: "Upcoming",  icon: <FaCalendarAlt size={11} />    },
  ONGOING:   { badge: "badge-warning", label: "Ongoing",   icon: <FaCirclePlay size={11} />     },
  COMPLETED: { badge: "badge-success", label: "Completed", icon: <FaCircleCheck size={11} />    },
  CANCELLED: { badge: "badge-error",   label: "Cancelled", icon: <FaCircleXmark size={11} />    },
};

const DAY_NAMES = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Skeleton = () => (
  <div className="bg-base-100 border border-base-200 rounded-2xl p-5 animate-pulse">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-11 h-11 rounded-full bg-base-300" />
      <div className="space-y-1.5 flex-1">
        <div className="h-4 bg-base-300 rounded w-1/2" />
        <div className="h-3 bg-base-200 rounded w-1/3" />
      </div>
    </div>
    <div className="h-2 bg-base-200 rounded-full mb-4" />
    <div className="space-y-2">
      <div className="h-3 bg-base-200 rounded w-3/4" />
      <div className="h-3 bg-base-200 rounded w-1/2" />
    </div>
  </div>
);

// ─── Stats bar ────────────────────────────────────────────────────────────────
const StatsBar = ({ courses }) => {
  const counts = courses.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {[
        { label: "Upcoming",  value: counts.UPCOMING  || 0, color: "text-info",    bg: "bg-info/10"    },
        { label: "Ongoing",   value: counts.ONGOING   || 0, color: "text-warning", bg: "bg-warning/10" },
        { label: "Completed", value: counts.COMPLETED || 0, color: "text-success", bg: "bg-success/10" },
        { label: "Cancelled", value: counts.CANCELLED || 0, color: "text-error",   bg: "bg-error/10"   },
      ].map(({ label, value, color, bg }) => (
        <div key={label} className={`${bg} rounded-xl px-4 py-3 flex items-center gap-3 border border-base-200`}>
          <span className={`text-2xl font-bold ${color}`}>{value}</span>
          <span className="text-xs text-base-content/50">{label}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Course Card ──────────────────────────────────────────────────────────────
const CourseCard = ({ course, isTutor, onClick }) => {
  const st  = STATUS_STYLE[course.status] ?? STATUS_STYLE.UPCOMING;
  const pct = course.totalSessions > 0
    ? Math.round((course.sessionsDone / course.totalSessions) * 100) : 0;

  const person = isTutor ? course.student : course.tutorProfile?.user;

  return (
    <div
      className="bg-base-100 border border-base-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col gap-4"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <img
            src={person?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(person?.name || "?")}&size=80&background=random`}
            alt={person?.name}
            className="w-11 h-11 rounded-full object-cover border-2 border-base-200"
          />
          <div>
            <p className="font-semibold text-base-content text-sm">{person?.name || "—"}</p>
            <p className="text-xs text-base-content/50">
              {isTutor ? person?.email : (course.tutorProfile?.subjects?.[0] ? `${course.tutorProfile.subjects[0]} Tutor` : "Tutor")}
            </p>
          </div>
        </div>
        <span className={`badge ${st.badge} badge-sm font-medium shrink-0 gap-1`}>
          {st.icon} {st.label}
        </span>
      </div>

      {/* Subject */}
      <div className="flex items-center gap-2 text-sm">
        <FaBookOpen size={12} className="text-primary shrink-0" />
        <span className="font-semibold text-base-content">{course.subject}</span>
      </div>

      {/* Progress */}
      <div>
        <div className="flex justify-between text-xs text-base-content/50 mb-1">
          <span>{course.sessionsDone}/{course.totalSessions} buổi</span>
          <span>{pct}%</span>
        </div>
        <div className="w-full bg-base-300 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all ${
              course.status === "COMPLETED" ? "bg-success" :
              course.status === "CANCELLED" ? "bg-error" : "bg-primary"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Dates */}
      <div className="flex items-center justify-between text-xs text-base-content/60">
        <span className="flex items-center gap-1">
          <FaCalendarAlt size={10} className="text-primary" />
          {fmtDate(course.startDate)}
        </span>
        <span className="text-base-content/30">→</span>
        <span className="flex items-center gap-1">
          <FaCalendarAlt size={10} className="text-primary" />
          {fmtDate(course.endDate)}
        </span>
      </div>

      {/* Schedule chips */}
      {course.schedules?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {course.schedules.map((s) => (
            <span key={s.id} className="badge badge-outline badge-primary badge-xs gap-1">
              {DAY_NAMES[s.dayOfWeek]} {s.startTime}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-base-200 pt-3 text-xs">
        <span className="flex items-center gap-1 text-base-content/50">
          <FaClock size={10} /> {course.durationMin} phút/buổi
        </span>
        <div className="flex items-center gap-3">
          {course.pricePerSession != null && (
            <span className="text-success font-semibold">${Number(course.pricePerSession).toFixed(2)}/buổi</span>
          )}
          {course.review && (
            <span className="flex items-center gap-1 text-warning font-semibold">
              <FaStar size={10} /> {course.review.rating}.0
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CourseListPage() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const isTutor    = user?.role === "TUTOR";

  const [courses, setCourses]       = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState("");
  const [page, setPage]             = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  const fetchFn = isTutor ? getMyCoursesAsTutor : getMyCoursesAsStudent;

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchFn({ status: activeTab, page, limit: 9 });
      setCourses(res.data?.data?.courses || []);
      setPagination(res.data?.data?.pagination ?? { total: 0, totalPages: 1 });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, isTutor]);

  const fetchAll = useCallback(async () => {
    try {
      const res = await fetchFn({ limit: 200 });
      setAllCourses(res.data?.data?.courses || []);
    } catch {}
  }, [isTutor]);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);
  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleTabChange = (val) => { setActiveTab(val); setPage(1); };

  return (
    <div className="min-h-screen bg-base-200">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-base-content">
            {isTutor ? "Lớp học của tôi" : "Khóa học của tôi"}
          </h1>
          <p className="text-base-content/50 text-sm mt-1">
            {isTutor
              ? "Quản lý các lớp học bạn đang dạy"
              : "Theo dõi tiến độ các khóa học của bạn"}
          </p>
        </div>

        {/* Stats */}
        {allCourses.length > 0 && <StatsBar courses={allCourses} />}

        {/* Tabs */}
        <div className="flex gap-1 bg-base-100 border border-base-200 rounded-xl p-1 mb-6 overflow-x-auto">
          {STATUS_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => handleTabChange(t.value)}
              className={`btn btn-sm flex-1 min-w-max rounded-lg transition-all ${
                activeTab === t.value ? "btn-primary shadow-sm" : "btn-ghost text-base-content/60"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} />)}
          </div>
        ) : courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-base-content/40 gap-3">
            <FaInbox size={44} className="opacity-25" />
            <p className="font-medium">Chưa có lớp học nào</p>
            {!isTutor && (
              <button className="btn btn-sm btn-primary" onClick={() => navigate("/tutors")}>
                Tìm gia sư
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((c) => (
              <CourseCard
                key={c.id}
                course={c}
                isTutor={isTutor}
                onClick={() => navigate(`/courses/${c.id}`)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <button className="btn btn-sm btn-outline btn-primary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <FaChevronLeft size={11} />
            </button>
            {Array.from({ length: pagination.totalPages }).map((_, i) => (
              <button key={i} onClick={() => setPage(i + 1)}
                className={`btn btn-sm ${page === i + 1 ? "btn-primary" : "btn-outline btn-primary"}`}>
                {i + 1}
              </button>
            ))}
            <button className="btn btn-sm btn-outline btn-primary" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>
              <FaChevronRight size={11} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}