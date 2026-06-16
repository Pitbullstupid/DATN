import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Splide, SplideSlide } from "@splidejs/react-splide";
import "@splidejs/react-splide/css";
import { FaStar } from "react-icons/fa";
import { GrFormPrevious, GrFormNext } from "react-icons/gr";
import { useTranslation } from "react-i18next";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const TutorCard = ({ profile }) => {
  const { t } = useTranslation("home");
  const navigate = useNavigate();
  const { user } = profile;

  const avatar =
    user?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      user?.name || "T",
    )}&size=80&background=random`;

  const subtitle =
    profile.qualification ||
    profile.subjects?.[0] ||
    profile.bio?.slice(0, 0) ||
    "";

  const rating = profile.rating ?? 0;

  return (
    <div
      onClick={() => navigate(`/tutors/${profile.id}`)}
      className="bg-base-200 rounded-2xl p-5 h-full flex flex-col cursor-pointer border border-base-200 hover:-translate-y-1 hover:shadow-lg transition-all duration-200"
    >
      <div className="flex items-center gap-3 mb-3">
        <img
          src={avatar}
          alt={user?.name}
          className="w-12 h-12 rounded-full object-cover shrink-0"
        />
        <div className="min-w-0">
          <p className="font-bold text-base-content text-sm truncate">
            {user?.name}
          </p>
          {subtitle && (
            <p className="text-base-content/50 text-xs truncate">{subtitle}</p>
          )}
        </div>
      </div>

      {profile.bio && (
        <p className="text-base-content/60 text-sm leading-relaxed mb-4 line-clamp-2 flex-1">
          {profile.bio}
        </p>
      )}

      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-1">
          <FaStar className="text-warning" size={13} />
          <span className="font-semibold text-sm text-base-content">
            {rating.toFixed(1)}
          </span>
        </div>
        {profile.pricePerHour != null && (
          <p className="text-primary font-bold text-sm">
            {Number(profile.pricePerHour).toLocaleString("en-US")}$
            <span className="text-base-content/40 font-normal text-xs">
              /{t("featured.per_hour_unit")}
            </span>
          </p>
        )}
      </div>
    </div>
  );
};

const FeaturedTutors = () => {
  const { t } = useTranslation("home");
  const splideRef = useRef(null);
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTutors = async () => {
      try {
        const res = await API.get("/tutors");
        const list =
          res.data?.data?.profiles ||
          res.data?.data?.tutors ||
          res.data?.data ||
          [];

        const sorted = [...list].sort(
          (a, b) => (b.rating ?? 0) - (a.rating ?? 0),
        );

        setTutors(sorted.slice(0, 10));
      } catch (err) {
        console.error("Failed to load featured tutors:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTutors();
  }, []);
  console.log(tutors);

  const prev = () => splideRef.current?.splide?.go("<");
  const next = () => splideRef.current?.splide?.go(">");

  if (loading || tutors.length === 0) return null;

  return (
    <section className="bg-base/50 py-12 px-[6vw]">
      <div className="w-14 h-1 bg-primary rounded-full mb-6 mx-auto" />
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-base-content mb-2">
            {t("featured.title")}
          </h2>
          <p className="text-base-content/50 text-sm">
            {t("featured.description")}
          </p>
        </div>

        <div className="flex gap-2 shrink-0">
          <button
            className="btn btn-circle btn-sm bg-base-300 border-none"
            onClick={prev}
          >
            <GrFormPrevious />
          </button>
          <button
            className="btn btn-circle btn-sm bg-primary text-primary-content border-none"
            onClick={next}
          >
            <GrFormNext />
          </button>
        </div>
      </div>

      <Splide
        ref={splideRef}
        options={{
          type: "slide",
          perMove: 1,
          gap: "1rem",
          pagination: false,
          arrows: false,
          perPage: 4,
          breakpoints: {
            1280: { perPage: 3 },
            1024: { perPage: 2 },
            640: { perPage: 1 },
          },
        }}
      >
        {tutors.map((profile) => (
          <SplideSlide key={profile.id} className="h-auto">
            <TutorCard profile={profile} />
          </SplideSlide>
        ))}
      </Splide>
    </section>
  );
};

export default FeaturedTutors;
