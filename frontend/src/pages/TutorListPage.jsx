import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import {
  FaFacebookF,
  FaTwitter,
  FaLinkedinIn,
  FaYoutube,
  FaSearch,
  FaCalendarAlt,
  FaDollarSign,
  FaStar,
  FaFilter,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

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

const SUBJECT_VALUES = [
  "",
  "Math",
  "Physics",
  "Chemistry",
  "Biology",
  "English",
  "History",
  "Data Communication",
  "Microprocessor",
  "Software Development",
];

// ─── Social bar overlay ───────────────────────────────────────────────────────
const SocialBar = ({ social }) => (
  <div className="absolute right-0 top-4 flex flex-col gap-[2px]">
    {[
      {
        icon: <FaFacebookF size={11} />,
        color: "#1877F2",
        href: social?.facebook,
      },
      {
        icon: <FaTwitter size={11} />,
        color: "#1DA1F2",
        href: social?.twitter,
      },
      {
        icon: <FaLinkedinIn size={11} />,
        color: "#0A66C2",
        href: social?.linkedin,
      },
      {
        icon: <FaYoutube size={11} />,
        color: "#FF0000",
        href: social?.youtube,
      },
    ].map(({ icon, color, href }, i) => (
      <a
        key={i}
        href={href || "#"}
        target="_blank"
        rel="noopener noreferrer"
        style={{ backgroundColor: color }}
        className="w-7 h-7 flex items-center justify-center text-white rounded-l-md shadow-md hover:scale-110 transition-transform duration-150"
      >
        {icon}
      </a>
    ))}
  </div>
);

// ─── Tutor Card ───────────────────────────────────────────────────────────────
const TutorCard = ({ tutor }) => {
  const { t } = useTranslation("tutors");
  const navigate = useNavigate();
  const {
    user,
    subjects,
    pricePerHour,
    daysPerWeek,
    rating,
    totalReviews,
    socialMedia,
  } = tutor;

  return (
    <div
      className="relative bg-base-100 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group border border-base-200"
      onClick={() => navigate(`/tutors/${tutor.id}`)}
    >
      <div className="relative h-52 bg-base-200 overflow-hidden">
        <img
          src={
            user?.avatar ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "T")}&size=400&background=random`
          }
          alt={user?.name}
          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
        />
        <SocialBar social={socialMedia} />
      </div>

      <div className="p-4">
        <h3 className="font-bold text-primary text-base text-center leading-tight">
          {user?.name || "—"}
        </h3>

        <div className="flex items-center justify-center gap-1 my-1.5">
          <div className="h-px w-10 bg-primary opacity-40" />
          <div className="w-2 h-2 rounded-full bg-primary" />
          <div className="h-px w-10 bg-primary opacity-40" />
        </div>

        <p className="text-base-content/60 text-xs text-center mb-3">
          {subjects?.[0]
            ? t("card.tutor_of", { subject: subjects[0] })
            : t("card.tutor")}
        </p>

        <div className="flex items-center justify-between text-xs text-base-content/70 border-t border-base-200 pt-3">
          <span className="flex items-center gap-1.5">
            <FaCalendarAlt className="text-primary" />
            {daysPerWeek != null
              ? t("card.day_per_week", { count: daysPerWeek })
              : t("card.flexible")}
          </span>
          <span className="flex items-center gap-1 font-semibold text-base-content">
            <FaDollarSign className="text-success" />
            {pricePerHour != null
              ? `${Number(pricePerHour).toFixed(2)} USD`
              : "—"}
          </span>
        </div>

        <div className="flex items-center gap-1 mt-2 justify-center">
          {Array.from({ length: 5 }).map((_, i) => (
            <FaStar
              key={i}
              size={11}
              className={
                i < Math.round(rating ?? 0) ? "text-warning" : "text-base-300"
              }
            />
          ))}
          <span className="text-xs text-base-content/40 ml-1">
            {(rating ?? 0) > 0
              ? `${Number(rating).toFixed(1)} (${totalReviews ?? 0})`
              : t("card.no_reviews")}
          </span>
        </div>
      </div>
    </div>
  );
};

// ─── Skeleton card ────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="bg-base-100 rounded-2xl overflow-hidden shadow border border-base-200 animate-pulse">
    <div className="h-52 bg-base-300" />
    <div className="p-4 space-y-2">
      <div className="h-4 bg-base-300 rounded w-2/3 mx-auto" />
      <div className="h-3 bg-base-200 rounded w-1/2 mx-auto" />
      <div className="h-px bg-base-200 mt-3" />
      <div className="h-3 bg-base-200 rounded w-full" />
    </div>
  </div>
);

// ─── Checkbox group ───────────────────────────────────────────────────────────
const CheckboxGroup = ({ label, options, selected, onChange }) => (
  <div className="mb-5">
    <p className="text-primary font-semibold text-sm mb-2">{label}</p>
    <div className="space-y-1.5">
      {options.map(({ label: l, value }) => (
        <label
          key={value}
          className="flex items-center gap-2 cursor-pointer text-sm text-base-content/70 hover:text-primary transition-colors"
        >
          <input
            type="checkbox"
            className="checkbox checkbox-primary checkbox-xs"
            checked={selected === value}
            onChange={() => onChange(selected === value ? "" : value)}
          />
          {l}
        </label>
      ))}
    </div>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TutorListPage() {
  const { t } = useTranslation("tutors");
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    page: 1,
  });

  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("");
  const [timingShift, setTimingShift] = useState("");
  const [experience, setExperience] = useState("");
  const [daysFilter, setDaysFilter] = useState("");
  const [priceRange, setPriceRange] = useState(2000);
  const [sortBy, setSortBy] = useState("all");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const experienceOptions = useMemo(
    () => [
      { label: t("filters.all"), value: "" },
      { label: t("filters.experience_half"), value: "0.5" },
      ...[1, 2, 3, 4, 5, 6, 7].map((y) => ({
        label: t("filters.experience_years", { value: y }),
        value: String(y),
      })),
      { label: t("filters.experience_10plus"), value: "10" },
    ],
    [t],
  );

  const dayOptions = useMemo(
    () => [
      { label: t("filters.all"), value: "" },
      ...[1, 2, 3, 4, 5, 6].map((d) => ({
        label: t("filters.days_per_week", { count: d }),
        value: String(d),
      })),
    ],
    [t],
  );

  const subjectOptions = useMemo(
    () =>
      SUBJECT_VALUES.map((value) => ({
        value,
        label: value ? value : t("filters.all_subject"),
      })),
    [t],
  );

  const timeOptions = useMemo(
    () => [
      { label: t("filters.all_time"), value: "" },
      { label: t("filters.morning"), value: "MORNING" },
      { label: t("filters.afternoon"), value: "AFTERNOON" },
      { label: t("filters.evening"), value: "EVENING" },
      { label: t("filters.flexible"), value: "FLEXIBLE" },
    ],
    [t],
  );

  const sortOptions = useMemo(
    () => [
      { label: t("filters.all"), value: "all" },
      { label: t("filters.sort_price_asc"), value: "price_asc" },
      { label: t("filters.sort_price_desc"), value: "price_desc" },
      { label: t("filters.sort_rating"), value: "rating" },
    ],
    [t],
  );

  const fetchTutors = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: 12,
        ...(subject ? { subject } : {}),
        ...(timingShift ? { timingShift } : {}),
        maxPrice: priceRange,
      };

      const res = await API.get("/tutors", { params });
      let data = res.data?.data?.tutors || [];

      if (search.trim()) {
        const q = search.toLowerCase();
        data = data.filter(
          (item) =>
            item.user?.name?.toLowerCase().includes(q) ||
            item.subjects?.some((s) => s.toLowerCase().includes(q)),
        );
      }

      if (experience) {
        data = data.filter((item) =>
          experience === "10"
            ? (item.experience ?? 0) >= 10
            : item.experience === parseFloat(experience),
        );
      }

      if (daysFilter) {
        const d = parseInt(daysFilter, 10);
        data = data.filter(
          (item) => item.daysPerWeek != null && item.daysPerWeek === d,
        );
      }

      if (sortBy === "price_asc")
        data = [...data].sort(
          (a, b) => (a.pricePerHour ?? 0) - (b.pricePerHour ?? 0),
        );
      else if (sortBy === "price_desc")
        data = [...data].sort(
          (a, b) => (b.pricePerHour ?? 0) - (a.pricePerHour ?? 0),
        );
      else if (sortBy === "rating")
        data = [...data].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

      setTutors(data);
      setPagination((p) => ({ ...p, ...(res.data?.data?.pagination ?? {}) }));
    } catch (err) {
      console.error("Fetch tutors error:", err);
    } finally {
      setLoading(false);
    }
  }, [
    search,
    subject,
    timingShift,
    experience,
    daysFilter,
    priceRange,
    sortBy,
    pagination.page,
  ]);

  useEffect(() => {
    fetchTutors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    subject,
    timingShift,
    experience,
    daysFilter,
    priceRange,
    sortBy,
    pagination.page,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => fetchTutors(), 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handlePageChange = (page) => setPagination((p) => ({ ...p, page }));

  const tutorCount = pagination.total ?? tutors.length;

  return (
    <div className="min-h-screen bg-base-200">
      <div className="max-w-325 mx-auto px-4 py-8 flex gap-6">
        <aside
          className={`shrink-0 transition-all duration-300 overflow-hidden ${
            sidebarOpen
              ? "w-52 opacity-100"
              : "w-0 opacity-0 pointer-events-none"
          }`}
        >
          <div className="bg-base-100 rounded-2xl shadow p-4 sticky top-6 border border-base-200 w-52">
            <div className="relative mb-4">
              <FaSearch
                className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 z-10"
                size={12}
              />
              <input
                type="text"
                placeholder={t("filters.search_placeholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input input-sm input-bordered w-full pl-8 text-sm"
              />
            </div>

            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="select select-sm select-bordered w-full text-sm mb-3"
            >
              {subjectOptions.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>

            <select
              value={timingShift}
              onChange={(e) => setTimingShift(e.target.value)}
              className="select select-sm select-bordered w-full text-sm mb-5"
            >
              {timeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <CheckboxGroup
              label={t("filters.experiences")}
              options={experienceOptions}
              selected={experience}
              onChange={setExperience}
            />

            <CheckboxGroup
              label={t("filters.days")}
              options={dayOptions}
              selected={daysFilter}
              onChange={setDaysFilter}
            />

            <div>
              <p className="text-primary font-semibold text-sm mb-2">
                {t("filters.filter_by_price")}
              </p>
              <input
                type="range"
                min={0}
                max={2000}
                step={10}
                value={priceRange}
                onChange={(e) => setPriceRange(Number(e.target.value))}
                className="range range-xs range-primary w-full"
              />
              <p className="text-xs text-base-content/50 mt-1">
                {t("filters.price_range", { max: priceRange })}
              </p>
            </div>
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen((v) => !v)}
                className="btn btn-sm btn-outline btn-primary gap-2"
              >
                <FaFilter size={11} />
                {t("filters.filter")}
              </button>
              <span className="text-sm text-base-content/50">
                {loading
                  ? t("filters.loading")
                  : t("filters.tutors_found", { count: tutorCount })}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-base-content/60 font-medium">
                {t("filters.sort_by")}
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="select select-sm select-bordered text-sm"
              >
                {sortOptions.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : tutors.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-base-content/40">
              <FaSearch size={40} className="mb-3 opacity-30" />
              <p className="text-lg font-medium">{t("filters.no_tutors")}</p>
              <p className="text-sm">{t("filters.try_filters")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {tutors.map((tutor) => (
                <TutorCard key={tutor.id} tutor={tutor} />
              ))}
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div className="flex justify-center mt-8 gap-2 flex-wrap">
              <button
                className="btn btn-sm btn-outline btn-primary"
                disabled={pagination.page <= 1}
                onClick={() => handlePageChange(pagination.page - 1)}
              >
                «
              </button>
              {Array.from({ length: pagination.totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => handlePageChange(i + 1)}
                  className={`btn btn-sm ${
                    pagination.page === i + 1
                      ? "btn-primary"
                      : "btn-outline btn-primary"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                className="btn btn-sm btn-outline btn-primary"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => handlePageChange(pagination.page + 1)}
              >
                »
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
