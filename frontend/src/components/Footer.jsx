import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaBookOpenReader } from "react-icons/fa6";
import { FiFacebook, FiTwitter, FiYoutube, FiInstagram } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

const Footer = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [modalMode, setModalMode] = useState("login");
  const openModal = (mode) => {
    setModalMode(mode);
    document.getElementById("modal_login").showModal();
  };

  const exploreLinks = [
    { label: t("footer.explore.find_tutor"), href: "/tutors" },
    { label: t("footer.explore.new_courses"), href: "#" },
    { label: t("footer.explore.home_tutoring"), href: "#" },
    { label: t("footer.explore.group_learning"), href: "#" },
  ];

  const supportLinks = [
    { label: t("footer.support.help_center"), href: "#" },
    { label: t("footer.support.terms"), href: "#" },
    { label: t("footer.support.privacy"), href: "#" },
    { label: t("footer.support.contact"), href: "#" },
  ];

  const socialLinks = [
    { icon: <FiFacebook size={16} />, href: "#" },
    { icon: <FiTwitter size={16} />, href: "#" },
    { icon: <FiYoutube size={16} />, href: "#" },
    { icon: <FiInstagram size={16} />, href: "#" },
  ];

  return (
    <footer className="bg-base-300 text-base-content pt-14 pb-8 px-[6vw]">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
              <FaBookOpenReader size={18} />
            </span>
            <span className="text-lg font-extrabold text-primary">
              TutorConnect
            </span>
          </div>
          <p className="text-sm text-base-content/60 leading-relaxed mb-5 max-w-xs">
            {t("footer.description")}
          </p>
          <div className="flex gap-3">
            {socialLinks.map((social, i) => (
              <a
                key={i}
                href={social.href}
                className="w-9 h-9 rounded-full bg-base-content/10 flex items-center justify-center hover:bg-primary hover:text-primary-content transition-colors"
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Explore */}
        <div>
          <h3 className="font-bold text-sm mb-4">
            {t("footer.explore.title")}
          </h3>
          <ul className="space-y-3">
            {exploreLinks.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className="text-sm text-base-content/60 hover:text-primary transition-colors"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Support */}
        <div>
          <h3 className="font-bold text-sm mb-4">
            {t("footer.support.title")}
          </h3>
          <ul className="space-y-3">
            {supportLinks.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className="text-sm text-base-content/60 hover:text-primary transition-colors"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h3 className="font-bold text-sm mb-4">
            {t("footer.newsletter.title")}
          </h3>
          <p className="text-sm text-base-content/60 leading-relaxed mb-4">
            {t("footer.newsletter.description")}
          </p>
          {!user && (
            <button
              className="btn btn-sm btn-primary text-primary-content"
              onClick={() => openModal("login")}
            >
              {t("footer.newsletter.submit")}
            </button>
          )}
        </div>
      </div>

      <div className="border-t border-base-content/10 mt-10 pt-6 text-center text-xs text-base-content/40">
        {t("footer.copyright", { year: new Date().getFullYear() })}
      </div>
    </footer>
  );
};

export default Footer;
