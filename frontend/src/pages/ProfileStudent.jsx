import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FiUser, FiMail, FiPhone, FiMapPin, FiCalendar,
  FiBookOpen, FiInbox, FiCheckCircle, FiClock,
  FiStar, FiEdit2, FiAlertCircle,
} from "react-icons/fi";
import {
  FaArrowRight, FaCircleCheck,
  FaCircleXmark, FaCirclePlay, FaHourglassHalf,
} from "react-icons/fa6";
import {FaCalendarAlt } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { getMyBookingsAsStudent } from "../api/bookingApi";
import { getMyCoursesAsStudent } from "../api/courseApi";

// ─── Constants ────────────────────────────────────────────────────────────────
const BOOKING_STATUS_STYLE = {
  PENDING:   { badge: "badge-warning", label: "Pending"   },
  ACCEPTED:  { badge: "badge-success", label: "Accepted"  },
  REJECTED:  { badge: "badge-error",   label: "Rejected"  },
  CANCELLED: { badge: "badge-ghost",   label: "Cancelled" },
};

const COURSE_STATUS_STYLE = {
  UPCOMING:  { badge: "badge-info",    label: "Upcoming",  icon: <FaCalendarAlt size={11} />  },
  ONGOING:   { badge: "badge-warning", label: "Ongoing",   icon: <FaCirclePlay size={11} />   },
  COMPLETED: { badge: "badge-success", label: "Completed", icon: <FaCircleCheck size={11} />  },
  CANCELLED: { badge: "badge-error",   label: "Cancelled", icon: <FaCircleXmark size={11} />  },
};

const DAY_NAMES = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
  }) : "—";

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse rounded-lg bg-base-300 ${className}`} />
);

// ─── Stat card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, color, bg, loading }) => (
  <div className="bg-base-100 rounded-2xl p-5 shadow-sm border border-base-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="text-base-content/50 text-xs font-medium truncate">{label}</p>
        {loading ? (
          <Skeleton className="h-7 w-12 mt-1" />
        ) : (
          <p className="text-base-content text-2xl font-bold mt-1 leading-none">{value}</p>
        )}
        <p className="text-base-content/30 text-xs mt-1">{sub}</p>
      </div>
      <div className={`w-10 h-10 rounded-xl ${bg} ${color} flex items-center justify-center shrink-0`}>
        <Icon size={18} />
      </div>
    </div>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProfileStudent() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings]   = useState([]);
  const [courses, setCourses]     = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [loadingCourses,  setLoadingCourses ] = useState(true);

  // ── Fetch data ─────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await getMyBookingsAsStudent({ limit: 5 });
        setBookings(res.data?.data?.bookings || []);
      } catch {}
      finally { setLoadingBookings(false); }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await getMyCoursesAsStudent({ limit: 100 });
        setCourses(res.data?.data?.courses || []);
      } catch {}
      finally { setLoadingCourses(false); }
    })();
  }, []);

  // ── Derived stats ──────────────────────────────────────────
  const totalBookings  = bookings.length;
  const pendingBookings = bookings.filter((b) => b.status === "PENDING").length;
  const ongoingCourses  = courses.filter((c) => c.status === "ONGOING").length;
  const completedCourses = courses.filter((c) => c.status === "COMPLETED").length;
  const totalSessionsDone = courses.reduce((acc, c) => acc + (c.sessionsDone || 0), 0);
  const avgRating = courses
    .filter((c) => c.review?.rating)
    .reduce((acc, c, _, arr) => acc + c.review.rating / arr.length, 0);

  const isLoading = loadingBookings || loadingCourses;

  const recentCourses = [...courses]
    .filter((c) => ["ONGOING", "UPCOMING"].includes(c.status))
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-base-200">

      {/* ── Hero banner ─────────────────────────────────────── */}
      <div className="relative bg-secondary overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-10 -right-10 w-64 h-64 rounded-full bg-secondary-content/5" />
          <div className="absolute top-6 right-40 w-32 h-32 rounded-full bg-secondary-content/5" />
          <div className="absolute -bottom-8 left-12 w-48 h-48 rounded-full bg-secondary-content/5" />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center py-12 md:py-16 gap-1">
          <p className="text-secondary-content/60 text-xs font-semibold uppercase tracking-[0.2em]">
            Student Portal
          </p>
          <h1 className="text-secondary-content text-3xl md:text-4xl font-bold tracking-tight">
            Dashboard
          </h1>
        </div>
      </div>

      {/* ── Main ────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ── LEFT — Profile card ──────────────────────────── */}
          <aside className="lg:col-span-4 space-y-4">
            <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 overflow-hidden">

              {/* Avatar + name */}
              <div className="p-6 flex flex-col items-center text-center">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-20 h-20 rounded-full object-cover ring-4 ring-secondary/20"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full ring-4 ring-secondary/20 bg-secondary/10 flex items-center justify-center text-secondary">
                    <FiUser size={30} />
                  </div>
                )}

                <h2 className="mt-4 text-lg font-bold text-base-content">{user?.name || "Student"}</h2>
                <p className="text-base-content/40 text-xs mt-0.5">
                  @{(user?.name || "student").toLowerCase().replace(/\s+/g, "")}
                </p>
                <span className="badge badge-secondary badge-sm mt-2">Student</span>

                {avgRating > 0 && (
                  <div className="flex items-center gap-1.5 mt-3">
                    <FiStar className="text-warning" size={14} />
                    <span className="text-sm font-semibold text-base-content">
                      {avgRating.toFixed(1)}
                    </span>
                    <span className="text-xs text-base-content/40">avg rating given</span>
                  </div>
                )}
              </div>

              {/* Info rows */}
              <div className="border-t border-base-200 divide-y divide-base-200 text-sm">
                {[
                  { icon: FiMail,     label: "Email",   value: user?.email  || "—"           },
                  { icon: FiCalendar, label: "Joined",  value: user?.createdAt ? fmtDate(user?.createdAt) : "—" },
                  { icon: FiUser,     label: "Gender",  value: user?.gender || "Not set"      },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3 px-5 py-3">
                    <Icon size={15} className="text-secondary mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-base-content/40 text-xs">{label}</p>
                      <p className="text-base-content font-medium truncate">{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Edit button */}
              <div className="p-4">
                <button
                  onClick={() => navigate("/student/profile/edit")}
                  className="btn btn-secondary btn-sm w-full gap-2"
                >
                  <FiEdit2 size={14} /> Edit Profile
                </button>
              </div>
            </div>

            {/* Quick links */}
            <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-base-200">
                <p className="font-bold text-sm text-base-content">Quick Links</p>
              </div>
              {[
                { label: "Find a Tutor",    path: "/tutors",            icon: FiBookOpen   },
                { label: "My Bookings",     path: "/student/bookings",  icon: FiInbox      },
                { label: "My Courses",      path: "/student/courses",   icon: FiCalendar   },
              ].map(({ label, path, icon: Icon }) => (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className="w-full flex items-center justify-between px-5 py-3 hover:bg-base-200/50 transition-colors border-b border-base-200 last:border-0 text-sm"
                >
                  <span className="flex items-center gap-3 text-base-content">
                    <Icon size={14} className="text-secondary" />
                    {label}
                  </span>
                  <FaArrowRight size={11} className="text-base-content/30" />
                </button>
              ))}
            </div>
          </aside>

          {/* ── RIGHT — Stats + content ──────────────────────── */}
          <div className="lg:col-span-8 space-y-6">

            {/* Stat cards */}
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
              <StatCard icon={FiInbox}       label="Total Bookings"   value={totalBookings}   sub="requests sent"     color="text-primary"   bg="bg-primary/10"   loading={isLoading} />
              <StatCard icon={FiAlertCircle} label="Pending"          value={pendingBookings}  sub="awaiting response"  color="text-warning"   bg="bg-warning/10"   loading={isLoading} />
              <StatCard icon={FiBookOpen}    label="Ongoing Courses"  value={ongoingCourses}   sub="in progress"        color="text-info"      bg="bg-info/10"      loading={isLoading} />
              <StatCard icon={FiCheckCircle} label="Completed"        value={completedCourses} sub="courses done"       color="text-success"   bg="bg-success/10"   loading={isLoading} />
              <StatCard icon={FiClock}       label="Sessions Done"    value={totalSessionsDone} sub="total sessions"   color="text-secondary" bg="bg-secondary/10" loading={isLoading} />
              <StatCard icon={FiStar}        label="Avg Rating Given" value={avgRating > 0 ? avgRating.toFixed(1) : "—"} sub="from reviews" color="text-warning" bg="bg-warning/10" loading={isLoading} />
            </div>

            {/* ── Active courses ──────────────────────────────── */}
            <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 overflow-hidden">
              <div className="px-6 py-4 flex items-center justify-between border-b border-base-200">
                <div>
                  <h3 className="font-bold text-base-content">Active Courses</h3>
                  <p className="text-base-content/40 text-xs mt-0.5">
                    Your upcoming & ongoing classes
                  </p>
                </div>
                <button
                  className="btn btn-ghost btn-xs text-secondary"
                  onClick={() => navigate("/courses")}
                >
                  View all →
                </button>
              </div>

              {loadingCourses ? (
                <div className="p-6 space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex gap-4 items-center">
                      <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-1/2" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                      <Skeleton className="h-6 w-20 rounded-lg" />
                    </div>
                  ))}
                </div>
              ) : recentCourses.length === 0 ? (
                <div className="flex flex-col items-center gap-2 text-base-content/30 py-12">
                  <FiBookOpen size={30} />
                  <p className="text-sm">No active courses</p>
                  <button
                    className="btn btn-secondary btn-xs mt-1"
                    onClick={() => navigate("/tutors")}
                  >
                    Find a Tutor
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-base-200">
                  {recentCourses.map((c) => {
                    const st  = COURSE_STATUS_STYLE[c.status] ?? COURSE_STATUS_STYLE.UPCOMING;
                    const pct = c.totalSessions > 0
                      ? Math.round((c.sessionsDone / c.totalSessions) * 100) : 0;

                    return (
                      <div
                        key={c.id}
                        className="px-6 py-4 hover:bg-base-200/30 transition-colors cursor-pointer"
                        onClick={() => navigate(`/courses/${c.id}`)}
                      >
                        <div className="flex items-start gap-4">
                          {/* Tutor avatar */}
                          <img
                            src={
                              c.tutorProfile?.user?.avatar ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(c.tutorProfile?.user?.name || "T")}&size=80&background=random`
                            }
                            alt={c.tutorProfile?.user?.name}
                            className="w-10 h-10 rounded-full object-cover shrink-0 border-2 border-base-200"
                          />

                          <div className="flex-1 min-w-0">
                            {/* Subject + status */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-sm text-base-content">{c.subject}</p>
                              <span className={`badge ${st.badge} badge-xs gap-1`}>
                                {st.icon} {st.label}
                              </span>
                            </div>

                            {/* Tutor name */}
                            <p className="text-xs text-base-content/50 mt-0.5">
                              with {c.tutorProfile?.user?.name}
                            </p>

                            {/* Schedule chips */}
                            {c.schedules?.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {c.schedules.map((s) => (
                                  <span key={s.id} className="badge badge-outline badge-secondary badge-xs">
                                    {DAY_NAMES[s.dayOfWeek]} {s.startTime}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Progress bar */}
                            <div className="mt-2">
                              <div className="flex justify-between text-[10px] text-base-content/40 mb-1">
                                <span>{c.sessionsDone}/{c.totalSessions} buổi</span>
                                <span>{pct}%</span>
                              </div>
                              <div className="w-full bg-base-300 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full transition-all ${
                                    c.status === "COMPLETED" ? "bg-success" : "bg-secondary"
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Dates */}
                          <div className="text-right shrink-0 hidden sm:block">
                            <p className="text-xs text-base-content/40">{fmtDate(c.startDate)}</p>
                            <p className="text-xs text-base-content/30">→ {fmtDate(c.endDate)}</p>
                            {c.pricePerSession != null && (
                              <p className="text-xs font-semibold text-success mt-1">
                                ${Number(c.pricePerSession).toFixed(2)}/buổi
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {recentCourses.length > 0 && (
                <div className="px-6 py-3 border-t border-base-200 text-center">
                  <button
                    className="text-xs text-secondary hover:underline"
                    onClick={() => navigate("/student/courses")}
                  >
                    View all {courses.length} courses →
                  </button>
                </div>
              )}
            </div>

            {/* ── Recent bookings ─────────────────────────────── */}
            <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 overflow-hidden">
              <div className="px-6 py-4 flex items-center justify-between border-b border-base-200">
                <div>
                  <h3 className="font-bold text-base-content">Recent Booking Requests</h3>
                  <p className="text-base-content/40 text-xs mt-0.5">
                    Your latest hire requests
                  </p>
                </div>
                {pendingBookings > 0 && (
                  <span className="badge badge-warning badge-sm">{pendingBookings} pending</span>
                )}
                <button
                  className="btn btn-ghost btn-xs text-secondary"
                  onClick={() => navigate("/tutor/bookings")}
                >
                  View all →
                </button>
              </div>

              {loadingBookings ? (
                <div className="p-6 space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex gap-4 items-center">
                      <Skeleton className="w-9 h-9 rounded-full shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-1/2" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : bookings.length === 0 ? (
                <div className="flex flex-col items-center gap-2 text-base-content/30 py-12">
                  <FiInbox size={30} />
                  <p className="text-sm">No booking requests yet</p>
                  <button
                    className="btn btn-secondary btn-xs mt-1"
                    onClick={() => navigate("/tutors")}
                  >
                    Find a Tutor
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-base-200 text-base-content/50 text-xs uppercase tracking-wider">
                        {["Tutor", "Subject", "Message", "Status", "Date"].map((h) => (
                          <th key={h} className="text-left px-5 py-3 font-semibold whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-base-200">
                      {bookings.map((b) => {
                        const st = BOOKING_STATUS_STYLE[b.status] ?? { badge: "badge-ghost", label: b.status };
                        return (
                          <tr key={b.id} className="hover:bg-base-200/30 transition-colors">
                            {/* Tutor */}
                            <td className="px-5 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <img
                                  src={
                                    b.tutorProfile?.user?.avatar ||
                                    `https://ui-avatars.com/api/?name=${encodeURIComponent(b.tutorProfile?.user?.name || "T")}&size=64&background=random`
                                  }
                                  alt={b.tutorProfile?.user?.name}
                                  className="w-8 h-8 rounded-full object-cover shrink-0"
                                />
                                <div>
                                  <p className="font-medium text-base-content text-xs leading-tight">
                                    {b.tutorProfile?.user?.name || "—"}
                                  </p>
                                  <p className="text-base-content/40 text-xs">
                                    {b.tutorProfile?.subjects?.[0] || ""}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Subject */}
                            <td className="px-5 py-3 whitespace-nowrap">
                              <span className="text-base-content font-medium text-xs">{b.subject}</span>
                            </td>

                            {/* Message */}
                            <td className="px-5 py-3 max-w-[180px]">
                              <p className="text-base-content/60 text-xs line-clamp-2">{b.message}</p>
                            </td>

                            {/* Status */}
                            <td className="px-5 py-3 whitespace-nowrap">
                              <span className={`badge ${st.badge} badge-sm`}>{st.label}</span>
                            </td>

                            {/* Date */}
                            <td className="px-5 py-3 whitespace-nowrap">
                              <span className="text-base-content/50 text-xs">{fmtDate(b.createdAt)}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}