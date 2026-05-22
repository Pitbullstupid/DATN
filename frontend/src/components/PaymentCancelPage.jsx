import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams, useNavigate } from "react-router-dom";
import { FaCircleXmark, FaArrowLeft, FaRotateRight } from "react-icons/fa6";
import toast from "react-hot-toast";
import { paymentApi } from "../api/paymentApi";

export default function PaymentCancelPage() {
  const { t } = useTranslation("payments");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const courseId = searchParams.get("course_id");
  const [loading, setLoading] = useState(false);

  const handleRetry = async () => {
    if (!courseId) return;
    setLoading(true);
    try {
      const res = await paymentApi.createCheckout(courseId);
      const { url } = res.data?.data ?? {};
      if (url) window.location.href = url;
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center px-4">
      <div className="bg-base-100 rounded-2xl shadow-lg border border-base-200 p-10 max-w-md w-full text-center space-y-5">
        <FaCircleXmark size={64} className="text-error mx-auto" />
        <h1 className="text-2xl font-bold text-base-content">{t("cancel.title")}</h1>
        <p className="text-base-content/60 text-sm">{t("cancel.desc")}</p>
        <div className="flex flex-col gap-2">
          {courseId && (
            <button
              className="btn btn-primary w-full gap-2"
              onClick={handleRetry}
              disabled={loading}
            >
              {loading ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <FaRotateRight size={13} />
              )}
              {t("cancel.retry")}
            </button>
          )}
          <button
            className="btn btn-ghost w-full gap-2"
            onClick={() => navigate(courseId ? `/courses/${courseId}` : "/student/courses")}
          >
            <FaArrowLeft size={12} /> {t("cancel.backToCourse")}
          </button>
        </div>
      </div>
    </div>
  );
}
