import { useState, useEffect } from "react";
import { useParams, useNavigate, Form } from "react-router-dom";
import axios from "axios";
import {
  FaFacebookF,
  FaTwitter,
  FaLinkedinIn,
  FaMapMarkerAlt,
  FaGraduationCap,
  FaStar,
  FaPhone,
  FaUserPlus,
  FaArrowLeft,
  FaCalendarAlt,
  FaClock,
  FaDollarSign,
  FaGlobe,
  FaChalkboardTeacher,
  FaBookOpen,
} from "react-icons/fa";
import FormRequestTutor from "../components/FormRequestTutor";

// ─── Axios instance ───────────────────────────────────────────────────────────
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const TIMING_LABEL = {
  MORNING: "Morning",
  AFTERNOON: "Afternoon",
  EVENING: "Evening",
  FLEXIBLE: "Flexible",
};

const STYLE_LABEL = {
  ONE_ON_ONE: "Private Tuition",
  GROUP: "Group Tuition",
  BOTH: "Private & Group",
};

// ─── Info row ─────────────────────────────────────────────────────────────────
const InfoRow = ({ label, value }) => {
  if (!value && value !== 0) return null;
  return (
    <div className="flex gap-4 py-3 border-b border-base-200 last:border-0">
      <span className="text-base-content/50 text-sm w-52 shrink-0">
        {label}:
      </span>
      <span className="text-base-content text-sm">{value}</span>
    </div>
  );
};

// ─── Education card ───────────────────────────────────────────────────────────
const EduCard = ({ edu }) => (
  <div className="flex gap-4 items-start p-4 bg-base-200/50 rounded-xl">
    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
      <FaGraduationCap className="text-primary" size={18} />
    </div>
    <div>
      <p className="font-semibold text-base-content text-sm">
        {edu.universityName}
      </p>
      <p className="text-base-content/60 text-xs mt-0.5">{edu.fieldOfStudy}</p>
      <p className="text-base-content/40 text-xs mt-1">
        Result : {edu.result} &nbsp; Pass Year : {edu.passingYear}
      </p>
    </div>
  </div>
);

// ─── Review card ─────────────────────────────────────────────────────────────
const ReviewCard = ({ review }) => (
  <div className="p-4 bg-base-200/40 rounded-xl">
    <div className="flex items-center gap-3 mb-2">
      <img
        src={
          review.student?.avatar ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(review.student?.name || "S")}&size=80&background=random`
        }
        alt={review.student?.name}
        className="w-9 h-9 rounded-full object-cover"
      />
      <div>
        <p className="font-semibold text-sm text-base-content">
          {review.student?.name}
        </p>
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <FaStar
              key={i}
              size={10}
              className={i < review.rating ? "text-warning" : "text-base-300"}
            />
          ))}
        </div>
      </div>
    </div>
    {review.comment && (
      <p className="text-base-content/60 text-sm leading-relaxed">
        {review.comment}
      </p>
    )}
  </div>
);

// ─── Schedule badge ───────────────────────────────────────────────────────────
const ScheduleBadge = ({ schedule }) => (
  <div className="flex items-center gap-2 px-3 py-2 bg-base-200 rounded-lg text-xs">
    <FaCalendarAlt className="text-primary" size={11} />
    <span className="font-medium text-base-content">
      {DAY_NAMES[schedule.dayOfWeek]}
    </span>
    <span className="text-base-content/50">
      {schedule.startTime} – {schedule.endTime}
    </span>
  </div>
);

// ─── Tab button ───────────────────────────────────────────────────────────────
const Tab = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
      active
        ? "border-primary text-primary"
        : "border-transparent text-base-content/50 hover:text-base-content"
    }`}
  >
    {children}
  </button>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TutorDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("tuition");

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await API.get(`/tutors/${id}`);
        setProfile(res.data?.data?.profile);
      } catch (err) {
        setError(err.message || "Không tìm thấy gia sư");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProfile();
  }, [id]);

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  // ── Error ──
  if (error || !profile) {
    return (
      <div className="min-h-screen bg-base-200 flex flex-col items-center justify-center gap-4">
        <p className="text-error text-lg font-medium">
          {error || "Không tìm thấy gia sư"}
        </p>
        <button className="btn btn-primary btn-sm" onClick={() => navigate(-1)}>
          <FaArrowLeft size={12} /> Quay lại
        </button>
      </div>
    );
  }

  const { user, educations, socialMedia, schedules, reviews } = profile;

  // ── Derived values ──
  const avgRating = profile.rating ?? 0;
  const totalReviews = profile.totalReviews ?? 0;
  const openModal = () => {
    document.getElementById("modal_request_tutor").showModal();
  };

  return (
    <div className="min-h-screen bg-base-200">
      {/* ── Hero banner ── */}
      <div className="h-32 bg-primary/20 relative" />

      {/* ── Profile header ── */}
      <div className="bg-base-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 pb-6">
          <div className="flex items-end gap-5 -mt-14 mb-4">
            {/* Avatar */}
            <div className="relative shrink-0">
              <img
                src={
                  user?.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "T")}&size=200&background=random`
                }
                alt={user?.name}
                className="w-28 h-28 rounded-full object-cover border-4 border-base-100 shadow-lg"
              />
              {avgRating > 0 && (
                <div className="absolute -bottom-1 -right-1 bg-warning text-white text-xs font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow">
                  <FaStar size={9} /> {avgRating.toFixed(1)}
                </div>
              )}
            </div>

            {/* Name + meta */}
            <div className="flex-1 min-w-0 pt-16">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-base-content">
                    {user?.name}
                  </h1>
                  <p className="text-primary text-sm font-medium mt-0.5">
                    {profile.subjects?.[0]
                      ? `${profile.subjects[0]} Tutor`
                      : "Tutor"}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-base-content/50">
                    {profile.address && (
                      <span className="flex items-center gap-1">
                        <FaMapMarkerAlt className="text-primary" size={11} />
                        {profile.address}
                        {profile.country ? `, ${profile.country}` : ""}
                      </span>
                    )}
                    {profile.bio && (
                      <span className="flex items-center gap-1 italic max-w-xs truncate">
                        <FaBookOpen
                          size={11}
                          className="text-primary shrink-0"
                        />
                        {profile.bio}
                      </span>
                    )}
                  </div>
                </div>

                {/* Social icons */}
                <div className="flex items-center gap-2">
                  {socialMedia?.facebook && (
                    <a
                      href={socialMedia.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-circle btn-sm btn-ghost border border-base-300"
                    >
                      <FaFacebookF size={13} />
                    </a>
                  )}
                  {socialMedia?.twitter && (
                    <a
                      href={socialMedia.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-circle btn-sm btn-ghost border border-base-300"
                    >
                      <FaTwitter size={13} />
                    </a>
                  )}
                  {socialMedia?.instagram && (
                    <a
                      href={socialMedia.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-circle btn-sm btn-ghost border border-base-300"
                    >
                      <FaLinkedinIn size={13} />
                    </a>
                  )}
                </div>
              </div>

              {/* CTA buttons */}
              <div className="flex gap-2 mt-4 flex-wrap">
                {profile.phone && (
                  <a
                    href={`tel:${profile.phone}`}
                    className="btn btn-sm btn-outline btn-primary gap-1.5"
                  >
                    <FaPhone size={11} /> Call Me
                  </a>
                )}
                <button className="btn btn-sm btn-primary gap-1.5" onClick={() => openModal()}>
                  <FaUserPlus size={11} /> Hire Me
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex gap-6 border-b border-base-200">
            <Tab active={tab === "tuition"} onClick={() => setTab("tuition")}>
              Tuition Info
            </Tab>
            <Tab active={tab === "basic"} onClick={() => setTab("basic")}>
              Basic Information
            </Tab>
            {reviews?.length > 0 && (
              <Tab active={tab === "reviews"} onClick={() => setTab("reviews")}>
                Reviews ({totalReviews})
              </Tab>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex gap-6 items-start">
          {/* ── Left column ── */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* TUITION INFO tab */}
            {tab === "tuition" && (
              <>
                {/* Tuition details */}
                <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 p-6">
                  <InfoRow
                    label="Expected Salary (Per Hour)"
                    value={
                      profile.pricePerHour != null
                        ? `$${Number(profile.pricePerHour).toFixed(2)} USD`
                        : null
                    }
                  />
                  <InfoRow
                    label="Days Per Week"
                    value={
                      profile.daysPerWeek != null ? profile.daysPerWeek : null
                    }
                  />
                  <InfoRow
                    label="Preferred Medium"
                    value={
                      profile.languages?.length
                        ? profile.languages.join(" ,  ")
                        : null
                    }
                  />
                  <InfoRow
                    label="Timing Shift"
                    value={
                      profile.timingShift
                        ? TIMING_LABEL[profile.timingShift]
                        : null
                    }
                  />
                  <InfoRow
                    label="Preferred Tutoring Style"
                    value={
                      profile.tutoringStyle
                        ? STYLE_LABEL[profile.tutoringStyle]
                        : null
                    }
                  />
                  <InfoRow
                    label="Tuition Experience"
                    value={
                      profile.experience != null
                        ? `${profile.experience} Year`
                        : null
                    }
                  />
                  <InfoRow
                    label="Tuition Duration"
                    value={
                      profile.tuitionDuration != null
                        ? `${profile.tuitionDuration} Hours`
                        : null
                    }
                  />
                  <InfoRow
                    label="Preferred Area For Tuition"
                    value={
                      profile.preferredAreas?.length
                        ? profile.preferredAreas.join(" ,  ")
                        : null
                    }
                  />
                </div>

                {/* Background / Subjects */}
                {profile.subjects?.length > 0 && (
                  <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 p-6">
                    <h2 className="text-base font-bold text-base-content mb-4">
                      Background
                    </h2>
                    <div className="flex items-start gap-4">
                      <span className="text-base-content/50 text-sm w-40 shrink-0 pt-0.5">
                        Expertise
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {profile.subjects.map((s) => (
                          <span
                            key={s}
                            className="badge badge-outline badge-primary text-xs px-3 py-2 h-auto"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Education */}
                {educations?.length > 0 && (
                  <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 p-6">
                    <h2 className="text-base font-bold text-base-content mb-4">
                      Education
                    </h2>
                    <div className="space-y-3">
                      {educations.map((edu) => (
                        <EduCard key={edu.id} edu={edu} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Reviews preview */}
                {reviews?.length > 0 && (
                  <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-base font-bold text-base-content">
                        Recent Reviews
                      </h2>
                      <div className="flex items-center gap-1.5">
                        <FaStar className="text-warning" size={14} />
                        <span className="font-bold text-base-content">
                          {avgRating.toFixed(1)}
                        </span>
                        <span className="text-base-content/40 text-sm">
                          ({totalReviews})
                        </span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {reviews.slice(0, 3).map((r) => (
                        <ReviewCard key={r.id} review={r} />
                      ))}
                    </div>
                    {reviews.length > 3 && (
                      <button
                        className="btn btn-ghost btn-sm mt-3 text-primary"
                        onClick={() => setTab("reviews")}
                      >
                        View all {totalReviews} reviews →
                      </button>
                    )}
                  </div>
                )}
              </>
            )}

            {/* BASIC INFO tab */}
            {tab === "basic" && (
              <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 p-6">
                <h2 className="text-base font-bold text-base-content mb-4">
                  Basic Information
                </h2>
                <InfoRow label="Full Name" value={user?.name} />
                <InfoRow label="Email" value={user?.email} />
                <InfoRow label="Phone" value={profile.phone} />
                <InfoRow label="Address" value={profile.address} />
                <InfoRow label="Country" value={profile.country} />
                <InfoRow label="Gender" value={user?.gender} />
                {profile.bio && (
                  <div className="py-3">
                    <p className="text-base-content/50 text-sm mb-1">Bio</p>
                    <p className="text-base-content text-sm leading-relaxed">
                      {profile.bio}
                    </p>
                  </div>
                )}
                {profile.qualification && (
                  <InfoRow
                    label="Qualification"
                    value={profile.qualification}
                  />
                )}
                {profile.certificate && (
                  <InfoRow label="Certificate" value={profile.certificate} />
                )}
              </div>
            )}

            {/* REVIEWS tab */}
            {tab === "reviews" && (
              <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-base font-bold text-base-content">
                    All Reviews
                  </h2>
                  <div className="flex items-center gap-1.5">
                    <FaStar className="text-warning" size={14} />
                    <span className="font-bold text-base-content">
                      {avgRating.toFixed(1)}
                    </span>
                    <span className="text-base-content/40 text-sm">
                      ({totalReviews})
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  {reviews?.map((r) => (
                    <ReviewCard key={r.id} review={r} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Right column ── */}
          <div className="w-72 shrink-0 space-y-4">
            {/* Coverage Area */}
            {profile.preferredAreas?.length > 0 && (
              <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 p-5">
                <h3 className="font-bold text-base-content text-sm mb-3">
                  Coverage Area
                </h3>
                <div className="flex gap-2 items-start">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <FaMapMarkerAlt className="text-primary" size={12} />
                  </div>
                  <p className="text-xs text-base-content/60 leading-relaxed">
                    {profile.preferredAreas.join(" ,  ")}
                  </p>
                </div>
              </div>
            )}

            {/* Schedule */}
            {schedules?.length > 0 && (
              <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 p-5">
                <h3 className="font-bold text-base-content text-sm mb-1">
                  Available Schedule
                </h3>
                <p className="text-xs text-base-content/40 mb-3">
                  Weekly availability
                </p>
                <div className="flex flex-wrap gap-2">
                  {schedules.map((s) => (
                    <ScheduleBadge key={s.id} schedule={s} />
                  ))}
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 p-5">
              <h3 className="font-bold text-base-content text-sm mb-3">
                Quick Stats
              </h3>
              <div className="space-y-3">
                {profile.pricePerHour != null && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                      <FaDollarSign className="text-success" size={13} />
                    </div>
                    <div>
                      <p className="text-xs text-base-content/50">Per Hour</p>
                      <p className="font-semibold text-sm text-base-content">
                        ${Number(profile.pricePerHour).toFixed(2)} USD
                      </p>
                    </div>
                  </div>
                )}
                {profile.experience != null && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <FaChalkboardTeacher className="text-primary" size={13} />
                    </div>
                    <div>
                      <p className="text-xs text-base-content/50">Experience</p>
                      <p className="font-semibold text-sm text-base-content">
                        {profile.experience} Year
                        {profile.experience > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                )}
                {profile.languages?.length > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-info/10 flex items-center justify-center">
                      <FaGlobe className="text-info" size={13} />
                    </div>
                    <div>
                      <p className="text-xs text-base-content/50">Languages</p>
                      <p className="font-semibold text-sm text-base-content">
                        {profile.languages.join(", ")}
                      </p>
                    </div>
                  </div>
                )}
                {profile.daysPerWeek != null && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center">
                      <FaCalendarAlt className="text-warning" size={13} />
                    </div>
                    <div>
                      <p className="text-xs text-base-content/50">
                        Days / Week
                      </p>
                      <p className="font-semibold text-sm text-base-content">
                        {profile.daysPerWeek} Days
                      </p>
                    </div>
                  </div>
                )}
                {profile.tuitionDuration != null && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                      <FaClock className="text-secondary" size={13} />
                    </div>
                    <div>
                      <p className="text-xs text-base-content/50">
                        Session Duration
                      </p>
                      <p className="font-semibold text-sm text-base-content">
                        {profile.tuitionDuration} Hour
                        {profile.tuitionDuration > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Hire CTA */}
            <div className="bg-primary rounded-2xl p-5 text-primary-content">
              <p className="font-bold text-sm mb-1">Ready to learn?</p>
              <p className="text-xs opacity-80 mb-4">
                Book a session with {user?.name?.split(" ")[0]} today
              </p>
              <button className="btn btn-sm bg-primary-content text-primary hover:bg-primary-content/90 w-full font-semibold">
                <FaUserPlus size={12} /> Hire Me
              </button>
            </div>
          </div>
        </div>
      </div>
      <FormRequestTutor />
    </div>
  );
}
