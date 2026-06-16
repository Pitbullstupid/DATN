import React from "react";
import { useNavigate } from "react-router-dom";
import studentImg from "../assets/Banner.png";
import { FaBookOpenReader } from "react-icons/fa6";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";

const Banner = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleGetStarted = () => {
    if (user?.role === "STUDENT") navigate("/tutors");
    else if (user?.role === "TUTOR") navigate("/tutor/dashboard");
    else document.getElementById("modal_login").showModal();
  };

  return (
    <section className="relative bg-base/50 overflow-hidden flex flex-col md:flex-row items-end gap-8 px-[6vw] pt-14">
      {/* Decorative blob */}
      <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-primary/40 opacity-35 pointer-events-none" />

      {/* Left */}
      <div className="flex-1 pb-14 pr-0 md:pr-8 relative z-10">
        <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-primary bg-primary/20 px-4 py-1.5 rounded-full mb-5">
          <FaBookOpenReader />
          {t("banner.sub_title")}
        </span>

        <h1 className="text-[clamp(1.75rem,4vw,2.75rem)] font-extrabold text-base leading-tight mb-5">
          {t("banner.title")}
          <br />
          <span className="text-primary">{t("banner.highlight_title")}</span>
        </h1>

        <p className="text-sm md:text-base text-gray-500 leading-relaxed mb-8 max-w-md">
          {t("banner.description")}
        </p>

        <button
          className="bg-primary hover:bg-primary/80 active:scale-95 transition-all text-white font-bold px-10 py-3.5 rounded-xl text-sm md:text-base"
          onClick={handleGetStarted}
        >
          {t("banner.get_started")}
        </button>

        {/* Joined students */}
        <div className="flex items-center gap-3 mt-6">
          <div className="flex -space-x-3">
            {[
              "https://i.pravatar.cc/64?img=12",
              "https://i.pravatar.cc/64?img=32",
              "https://i.pravatar.cc/64?img=45",
              "https://i.pravatar.cc/64?img=8",
            ].map((src, i) => (
              <img
                key={i}
                src={src}
                alt=""
                className="w-9 h-9 rounded-full object-cover border-2 border-base-100"
              />
            ))}
          </div>
          <p className="text-sm font-semibold text-base-content">
            {t("banner.joined_count")}
          </p>
        </div>
      </div>

      {/* Right image */}
      <div className="flex-1 flex justify-center items-end w-full md:w-auto min-h-50 md:min-h-95">
        <img
          src={studentImg}
          alt="Student in graduation cap"
          className="max-h-105 w-full md:w-auto object-contain object-bottom rounded-t-2xl md:rounded-none"
        />
      </div>
    </section>
  );
};

export default Banner;