import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useTranslation } from "react-i18next";
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

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const TIMING_KEYS = {
  MORNING: "filters.morning",
  AFTERNOON: "filters.afternoon",
  EVENING: "filters.evening",
  FLEXIBLE: "filters.flexible",
};

const STYLE_KEYS = {
  ONE_ON_ONE: "detail.private",
  GROUP: "detail.group",
  BOTH: "detail.both",
};

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

const EduCard = ({ edu }) => {
  const { t } = useTranslation("tutors");
  return (
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
          {t("detail.result")} : {edu.result} &nbsp; {t("detail.pass_year")} :{" "}
          {edu.passingYear}
        </p>
      </div>
    </div>
  );
};

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

const ScheduleBadge = ({ schedule }) => {
  const { t } = useTranslation("tutors");
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-base-200 rounded-lg text-xs">
      <FaCalendarAlt className="text-primary" size={11} />
      <span className="font-medium text-base-content">
        {t(`detail.days_short.${schedule.dayOfWeek}`)}
      </span>
      <span className="text-base-content/50">
        {schedule.startTime} – {schedule.endTime}
      </span>
    </div>
  );
};

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

export default function TutorDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation("tutors");
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
        setError("");
      } catch (err) {
        setError(err.response?.data?.message || err.message || "");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-base-200 flex flex-col items-center justify-center gap-4">
        <p className="text-error text-lg font-medium">
          {error || t("detail.not_found")}
        </p>
        <button className="btn btn-primary btn-sm" onClick={() => navigate(-1)}>
          <FaArrowLeft size={12} /> {t("detail.back")}
        </button>
      </div>
    );
  }

  const { user, educations, socialMedia, schedules, reviews } = profile;
  const avgRating = profile.rating ?? 0;
  const totalReviews = profile.totalReviews ?? 0;

  const experienceYears =
    profile.experience != null
      ? `${profile.experience} ${
          profile.experience === 1 ? t("detail.year") : t("detail.years")
        }`
      : null;

  const tuitionHours =
    profile.tuitionDuration != null
      ? `${profile.tuitionDuration} ${t("detail.hours")}`
      : null;

  const timingKey = profile.timingShift
    ? TIMING_KEYS[profile.timingShift]
    : null;
  const timingLabel = timingKey ? t(timingKey) : null;

  const styleKey = profile.tutoringStyle
    ? STYLE_KEYS[profile.tutoringStyle]
    : null;
  const styleLabel = styleKey ? t(styleKey) : null;

  const openModal = () => {
    document.getElementById("modal_request_tutor").showModal();
  };

  return (
    <div className="min-h-screen bg-base-200">
      <div className="h-32 bg-primary/20 relative" />

      <div className="bg-base-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 pb-6">
          <div className="flex items-end gap-5 -mt-14 mb-4">
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

            <div className="flex-1 min-w-0 pt-16">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-base-content">
                    {user?.name}
                  </h1>
                  <p className="text-primary text-sm font-medium mt-0.5">
                    {profile.subjects?.[0]
                      ? t("card.tutor_of", { subject: profile.subjects[0] })
                      : t("card.tutor")}
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

              <div className="flex gap-2 mt-4 flex-wrap">
                {profile.phone && (
                  <a
                    href={`tel:${profile.phone}`}
                    className="btn btn-sm btn-outline btn-primary gap-1.5"
                  >
                    <FaPhone size={11} /> {t("detail.call_me")}
                  </a>
                )}
                <button
                  className="btn btn-sm btn-primary gap-1.5"
                  onClick={openModal}
                >
                  <FaUserPlus size={11} /> {t("detail.hire_me")}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6">
          <div className="flex gap-6 border-b border-base-200">
            <Tab active={tab === "tuition"} onClick={() => setTab("tuition")}>
              {t("detail.tab_tuition")}
            </Tab>
            <Tab active={tab === "basic"} onClick={() => setTab("basic")}>
              {t("detail.tab_basic")}
            </Tab>
            {reviews?.length > 0 && (
              <Tab active={tab === "reviews"} onClick={() => setTab("reviews")}>
                {t("detail.tab_reviews", { count: totalReviews })}
              </Tab>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex gap-6 items-start">
          <div className="flex-1 min-w-0 space-y-6">
            {tab === "tuition" && (
              <>
                <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 p-6">
                  <InfoRow
                    label={t("detail.salary_per_hour")}
                    value={
                      profile.pricePerHour != null
                        ? `$${Number(profile.pricePerHour).toFixed(2)} USD`
                        : null
                    }
                  />
                  <InfoRow
                    label={t("detail.days_per_week")}
                    value={
                      profile.daysPerWeek != null ? profile.daysPerWeek : null
                    }
                  />
                  <InfoRow
                    label={t("detail.preferred_medium")}
                    value={
                      profile.languages?.length
                        ? profile.languages.join(" ,  ")
                        : null
                    }
                  />
                  <InfoRow
                    label={t("detail.timing_shift")}
                    value={timingLabel}
                  />
                  <InfoRow
                    label={t("detail.tutoring_style")}
                    value={styleLabel}
                  />
                  <InfoRow
                    label={t("detail.experience")}
                    value={experienceYears}
                  />
                  <InfoRow
                    label={t("detail.duration")}
                    value={tuitionHours}
                  />
                  <InfoRow
                    label={t("detail.preferred_area")}
                    value={
                      profile.preferredAreas?.length
                        ? profile.preferredAreas.join(" ,  ")
                        : null
                    }
                  />
                </div>

                {profile.subjects?.length > 0 && (
                  <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 p-6">
                    <h2 className="text-base font-bold text-base-content mb-4">
                      {t("detail.background")}
                    </h2>
                    <div className="flex items-start gap-4">
                      <span className="text-base-content/50 text-sm w-40 shrink-0 pt-0.5">
                        {t("detail.expertise")}
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

                {educations?.length > 0 && (
                  <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 p-6">
                    <h2 className="text-base font-bold text-base-content mb-4">
                      {t("detail.education")}
                    </h2>
                    <div className="space-y-3">
                      {educations.map((edu) => (
                        <EduCard key={edu.id} edu={edu} />
                      ))}
                    </div>
                  </div>
                )}

                {reviews?.length > 0 && (
                  <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-base font-bold text-base-content">
                        {t("detail.recent_reviews")}
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
                        {t("detail.view_all_reviews", { count: totalReviews })}
                      </button>
                    )}
                  </div>
                )}
              </>
            )}

            {tab === "basic" && (
              <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 p-6">
                <h2 className="text-base font-bold text-base-content mb-4">
                  {t("detail.tab_basic")}
                </h2>
                <InfoRow label={t("detail.full_name")} value={user?.name} />
                <InfoRow label={t("detail.email")} value={user?.email} />
                <InfoRow label={t("detail.phone")} value={profile.phone} />
                <InfoRow label={t("detail.address")} value={profile.address} />
                <InfoRow label={t("detail.country")} value={profile.country} />
                <InfoRow label={t("detail.gender")} value={user?.gender} />
                {profile.bio && (
                  <div className="py-3">
                    <p className="text-base-content/50 text-sm mb-1">
                      {t("detail.bio")}
                    </p>
                    <p className="text-base-content text-sm leading-relaxed">
                      {profile.bio}
                    </p>
                  </div>
                )}
                {profile.qualification && (
                  <InfoRow
                    label={t("detail.qualification")}
                    value={profile.qualification}
                  />
                )}
                {profile.certificate && (
                  <InfoRow
                    label={t("detail.certificate")}
                    value={profile.certificate}
                  />
                )}
              </div>
            )}

            {tab === "reviews" && (
              <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-base font-bold text-base-content">
                    {t("detail.all_reviews")}
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

          <div className="w-72 shrink-0 space-y-4">
            {profile.preferredAreas?.length > 0 && (
              <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 p-5">
                <h3 className="font-bold text-base-content text-sm mb-3">
                  {t("detail.coverage_area")}
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

            {schedules?.length > 0 && (
              <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 p-5">
                <h3 className="font-bold text-base-content text-sm mb-1">
                  {t("detail.available_schedule")}
                </h3>
                <p className="text-xs text-base-content/40 mb-3">
                  {t("detail.weekly_availability")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {schedules.map((s) => (
                    <ScheduleBadge key={s.id} schedule={s} />
                  ))}
                </div>
              </div>
            )}

            <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 p-5">
              <h3 className="font-bold text-base-content text-sm mb-3">
                {t("detail.quick_stats")}
              </h3>
              <div className="space-y-3">
                {profile.pricePerHour != null && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                      <FaDollarSign className="text-success" size={13} />
                    </div>
                    <div>
                      <p className="text-xs text-base-content/50">
                        {t("detail.per_hour")}
                      </p>
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
                      <p className="text-xs text-base-content/50">
                        {t("detail.experience")}
                      </p>
                      <p className="font-semibold text-sm text-base-content">
                        {profile.experience}{" "}
                        {profile.experience === 1
                          ? t("detail.year")
                          : t("detail.years")}
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
                      <p className="text-xs text-base-content/50">
                        {t("detail.languages")}
                      </p>
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
                        {t("detail.days_week")}
                      </p>
                      <p className="font-semibold text-sm text-base-content">
                        {profile.daysPerWeek} {t("detail.days")}
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
                        {t("detail.session_duration")}
                      </p>
                      <p className="font-semibold text-sm text-base-content">
                        {profile.tuitionDuration}{" "}
                        {profile.tuitionDuration === 1
                          ? t("detail.hour")
                          : t("detail.hours")}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-primary rounded-2xl p-5 text-primary-content">
              <p className="font-bold text-sm mb-1">{t("detail.ready_title")}</p>
              <p className="text-xs opacity-80 mb-4">
                {t("detail.ready_desc", {
                  name: user?.name?.split(" ")[0] || user?.name,
                })}
              </p>
              <button
                className="btn btn-sm bg-primary-content text-primary hover:bg-primary-content/90 w-full font-semibold"
                onClick={openModal}
              >
                <FaUserPlus size={12} /> {t("detail.hire_me")}
              </button>
            </div>
          </div>
        </div>
      </div>
      <FormRequestTutor
        tutorProfileId={profile.id}
        tutorName={user?.name}
        defaultSubject={profile.subjects?.[0] || ""}
      />
    </div>
  );
}
