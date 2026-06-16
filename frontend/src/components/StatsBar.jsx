import React from "react";
import { FaUser } from "react-icons/fa";
import { FaMoneyBillTransfer } from "react-icons/fa6";
import { MdSubject } from "react-icons/md";
import { GrUserExpert } from "react-icons/gr";
import { useTranslation } from "react-i18next";

const StatsBar = () => {
  const { t } = useTranslation();

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
  );
};

export default StatsBar;