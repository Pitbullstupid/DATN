import React from "react";
import { useNavigate } from "react-router-dom";
import studentImg from "../assets/Banner.png";
import { FaBookOpenReader } from "react-icons/fa6";
import { useAuth } from "../context/AuthContext";
import { FaUser } from "react-icons/fa";
import { FaMoneyBillTransfer } from "react-icons/fa6";
import { MdSubject } from "react-icons/md";
import { GrUserExpert } from "react-icons/gr";
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
  const stats = [
    { icon: <FaUser size={20} />, value: "1K+", label: t("stats_bar.user") },
    {
      icon: <GrUserExpert size={20} />,
      value: "300+",
      label: t("stats_bar.tutor"),
    },
    {
      icon: <FaMoneyBillTransfer size={20} />,
      value: "$500M+",
      label: t("stats_bar.total"),
    },

    {
      icon: <MdSubject size={20} />,
      value: "50+",
      label: t("stats_bar.subject"),
    },
  ];

  return (
    <div>
      {/* ── Hero Section ── */}
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

      {/* ── Stats Bar ── */}
      <section className="bg-primary py-14 px-[6vw]">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-primary-content text-3xl md:text-4xl font-extrabold mb-2">
            {t("stats_bar.title")}
          </h2>
          <p className="text-primary-content/70 text-sm md:text-base">
            {t("stats_bar.sub_title")}
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 max-w-5xl mx-auto">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-base-100 rounded-2xl px-5 py-5 flex items-center gap-4 shadow-lg hover:-translate-y-1 transition-transform"
            >
              <div className="text-primary shrink-0">{stat.icon}</div>
              <div>
                <p className="text-base-content text-2xl font-extrabold leading-tight">
                  {stat.value}
                </p>
                <p className="text-base-content/60 text-sm mt-1">
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Banner;
