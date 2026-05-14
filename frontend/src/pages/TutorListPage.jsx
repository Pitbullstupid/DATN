import { useState, useEffect, useCallback } from "react";
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

// ─── Constants ────────────────────────────────────────────────────────────────
const EXPERIENCE_OPTIONS = [
  { label: "All", value: "" },
  { label: "0.5 Years", value: "0.5" },
  { label: "1 Years", value: "1" },
  { label: "2 Years", value: "2" },
  { label: "3 Years", value: "3" },
  { label: "4 Years", value: "4" },
  { label: "5 Years", value: "5" },
  { label: "6 Years", value: "6" },
  { label: "7 Years", value: "7" },
  { label: "10+ Years", value: "10" },
];

const DAY_OPTIONS = [
  { label: "All", value: "" },
  { label: "1 Days/Week", value: "1" },
  { label: "2 Days/Week", value: "2" },
  { label: "3 Days/Week", value: "3" },
  { label: "4 Days/Week", value: "4" },
  { label: "5 Days/Week", value: "5" },
  { label: "6 Days/Week", value: "6" },
];

const SUBJECT_OPTIONS = [
  { label: "All Subject", value: "" },
  { label: "Math", value: "Math" },
  { label: "Physics", value: "Physics" },
  { label: "Chemistry", value: "Chemistry" },
  { label: "Biology", value: "Biology" },
  { label: "English", value: "English" },
  { label: "History", value: "History" },
  { label: "Data Communication", value: "Data Communication" },
  { label: "Microprocessor", value: "Microprocessor" },
  { label: "Software Development", value: "Software Development" },
];

const TIME_OPTIONS = [
  { label: "All Time", value: "" },
  { label: "Morning", value: "MORNING" },
  { label: "Afternoon", value: "AFTERNOON" },
  { label: "Evening", value: "EVENING" },
  { label: "Flexible", value: "FLEXIBLE" },
];

const SORT_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Top Rated", value: "rating" },
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
      {/* Photo */}
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

      {/* Info */}
      <div className="p-4">
        <h3 className="font-bold text-primary text-base text-center leading-tight">
          {user?.name || "—"}
        </h3>

        {/* Divider with dot */}
        <div className="flex items-center justify-center gap-1 my-1.5">
          <div className="h-px w-10 bg-primary opacity-40" />
          <div className="w-2 h-2 rounded-full bg-primary" />
          <div className="h-px w-10 bg-primary opacity-40" />
        </div>

        <p className="text-base-content/60 text-xs text-center mb-3">
          {subjects?.[0] ? `${subjects[0]} Tutor` : "Tutor"}
        </p>

        {/* Stats row */}
        <div className="flex items-center justify-between text-xs text-base-content/70 border-t border-base-200 pt-3">
          <span className="flex items-center gap-1.5">
            <FaCalendarAlt className="text-primary" />
            {/* daysPerWeek có thể null nếu gia sư chưa điền step2 */}
            {daysPerWeek != null ? `${daysPerWeek} Day/Week` : "Flexible"}
          </span>
          <span className="flex items-center gap-1 font-semibold text-base-content">
            <FaDollarSign className="text-success" />
            {pricePerHour != null
              ? `${Number(pricePerHour).toFixed(2)} USD`
              : "—"}
          </span>
        </div>

        {/* Stars */}
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
              : "No reviews"}
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
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    page: 1,
  });

  // Filters
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("");
  const [timingShift, setTimingShift] = useState("");
  const [experience, setExperience] = useState("");
  const [daysFilter, setDaysFilter] = useState("");
  const [priceRange, setPriceRange] = useState(2000);
  const [sortBy, setSortBy] = useState("all");
  const [sidebarOpen, setSidebarOpen] = useState(true);

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

      // ── Client-side filters ──

      if (search.trim()) {
        const q = search.toLowerCase();
        data = data.filter(
          (t) =>
            t.user?.name?.toLowerCase().includes(q) ||
            t.subjects?.some((s) => s.toLowerCase().includes(q)),
        );
      }

      if (experience) {
        data = data.filter((t) =>
          experience === "10"
            ? (t.experience ?? 0) >= 10
            : t.experience === parseFloat(experience),
        );
      }

      // daysPerWeek: so sánh số nguyên, bỏ qua record có daysPerWeek = null
      if (daysFilter) {
        const d = parseInt(daysFilter, 10);
        data = data.filter((t) => t.daysPerWeek != null && t.daysPerWeek === d);
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

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => fetchTutors(), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handlePageChange = (page) => setPagination((p) => ({ ...p, page }));

  return (
    <div className="min-h-screen bg-base-200">
      <div className="max-w-325 mx-auto px-4 py-8 flex gap-6">
        {/* ── Sidebar ── */}
        <aside
          className={`shrink-0 transition-all duration-300 overflow-hidden ${
            sidebarOpen
              ? "w-52 opacity-100"
              : "w-0 opacity-0 pointer-events-none"
          }`}
        >
          <div className="bg-base-100 rounded-2xl shadow p-4 sticky top-6 border border-base-200 w-52">
            {/* Search */}
            <div className="relative mb-4">
              <FaSearch
                className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 z-10"
                size={12}
              />
              <input
                type="text"
                placeholder="search here.."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input input-sm input-bordered w-full pl-8 text-sm"
              />
            </div>

            {/* Subject */}
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="select select-sm select-bordered w-full text-sm mb-3"
            >
              {SUBJECT_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>

            {/* Timing shift */}
            <select
              value={timingShift}
              onChange={(e) => setTimingShift(e.target.value)}
              className="select select-sm select-bordered w-full text-sm mb-5"
            >
              {TIME_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>

            {/* Experience */}
            <CheckboxGroup
              label="Experiences"
              options={EXPERIENCE_OPTIONS}
              selected={experience}
              onChange={setExperience}
            />

            {/* Days */}
            <CheckboxGroup
              label="Days"
              options={DAY_OPTIONS}
              selected={daysFilter}
              onChange={setDaysFilter}
            />

            {/* Price range */}
            <div>
              <p className="text-primary font-semibold text-sm mb-2">
                Filter by Price
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
                Price :{" "}
                <span className="font-semibold text-primary">
                  $0 – ${priceRange}
                </span>
              </p>
            </div>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 min-w-0">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen((v) => !v)}
                className="btn btn-sm btn-outline btn-primary gap-2"
              >
                <FaFilter size={11} />
                Filter
              </button>
              <span className="text-sm text-base-content/50">
                {loading
                  ? "Loading…"
                  : `${pagination.total ?? tutors.length} tutors found`}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-base-content/60 font-medium">
                Sort by
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="select select-sm select-bordered text-sm"
              >
                {SORT_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : tutors.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-base-content/40">
              <FaSearch size={40} className="mb-3 opacity-30" />
              <p className="text-lg font-medium">No tutors found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {tutors.map((tutor) => (
                <TutorCard key={tutor.id} tutor={tutor} />
              ))}
            </div>
          )}

          {/* Pagination */}
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
