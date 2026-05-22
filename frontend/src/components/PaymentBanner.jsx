import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaCreditCard, FaLock, FaCircleInfo } from "react-icons/fa6";
import toast from "react-hot-toast";
import { paymentApi } from "../api/paymentApi";

export default function PaymentBanner({ course, isStudent }) {
  const { t } = useTranslation("payments");
  const [loading, setLoading] = useState(false);

  if (course.status !== "PENDING_PAYMENT") return null;

  const handlePay = async () => {
    setLoading(true);
    try {
      const res = await paymentApi.createCheckout(course.id);
      const { url } = res.data?.data ?? {};
      if (url) window.location.href = url;
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isStudent) {
    return (
      <div className="bg-warning/10 border border-warning/30 rounded-2xl p-5 flex items-start gap-3">
        <FaCircleInfo size={18} className="text-warning shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-base-content text-sm">{t("banner.tutorTitle")}</p>
          <p className="text-base-content/60 text-xs mt-0.5">{t("banner.tutorDesc")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 space-y-4">
      <div className="flex items-start gap-3">
        <FaLock size={18} className="text-primary shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-base-content text-sm">{t("banner.studentTitle")}</p>
          <p className="text-base-content/60 text-xs mt-0.5">{t("banner.studentDesc")}</p>
        </div>
      </div>

      <div className="bg-base-100 rounded-xl px-4 py-3 space-y-2 text-sm border border-base-200">
        <div className="flex justify-between">
          <span className="text-base-content/50">{t("banner.course")}</span>
          <span className="font-medium">{course.subject}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-base-content/50">{t("banner.sessions")}</span>
          <span className="font-medium">
            {t("banner.sessionsValue", { count: course.totalSessions })}
          </span>
        </div>
        {course.pricePerSession != null && (
          <div className="flex justify-between">
            <span className="text-base-content/50">{t("banner.pricePerSession")}</span>
            <span className="font-medium">${Number(course.pricePerSession).toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-base-200 pt-2">
          <span className="font-semibold text-base-content">{t("banner.total")}</span>
          <span className="font-bold text-primary text-base">
            ${Number(course.totalPrice).toFixed(2)} USD
          </span>
        </div>
      </div>

      <button
        className="btn btn-primary w-full gap-2"
        onClick={handlePay}
        disabled={loading}
      >
        {loading ? (
          <span className="loading loading-spinner loading-sm" />
        ) : (
          <FaCreditCard size={15} />
        )}
        {loading ? t("banner.redirecting") : t("banner.payNow")}
      </button>

      <p className="text-xs text-base-content/40 text-center flex items-center justify-center gap-1">
        <FaLock size={10} /> {t("banner.secure")}
      </p>
    </div>
  );
}
