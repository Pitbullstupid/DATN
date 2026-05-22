import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams, useNavigate } from "react-router-dom";
import { FaCircleCheck, FaCircleXmark, FaArrowRight } from "react-icons/fa6";
import { paymentApi } from "../api/paymentApi";

export default function PaymentSuccessPage() {
  const { t } = useTranslation("payments");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get("session_id");

  const [status, setStatus] = useState("loading");
  const [course, setCourse] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!sessionId) {
        setStatus("failed");
        return;
      }

      (async () => {
        try {
          const res = await paymentApi.verifyPayment(sessionId);
          const { paymentStatus, course: c } = res.data?.data ?? {};
          setCourse(c);
          setStatus(paymentStatus === "PAID" ? "success" : "failed");
        } catch {
          setStatus("failed");
        }
      })();
    }, 0);

    return () => clearTimeout(timer);
  }, [sessionId]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center px-4">
      <div className="bg-base-100 rounded-2xl shadow-lg border border-base-200 p-10 max-w-md w-full text-center space-y-5">
        {status === "success" ? (
          <>
            <FaCircleCheck size={64} className="text-success mx-auto" />
            <h1 className="text-2xl font-bold text-base-content">{t("success.title")}</h1>
            {course && (
              <div className="bg-base-200/60 rounded-xl px-4 py-3 text-sm text-left space-y-1">
                <p>
                  <span className="text-base-content/50">{t("success.course")}</span>{" "}
                  <strong>{course.subject}</strong>
                </p>
                <p>
                  <span className="text-base-content/50">{t("success.sessions")}</span>{" "}
                  {t("success.sessionsValue", { count: course.totalSessions })}
                </p>
                <p>
                  <span className="text-base-content/50">{t("success.tuition")}</span>{" "}
                  <span className="text-success font-semibold">
                    ${Number(course.totalPrice).toFixed(2)} USD
                  </span>
                </p>
              </div>
            )}
            <p className="text-base-content/60 text-sm">{t("success.desc")}</p>
            <button
              className="btn btn-primary w-full gap-2"
              onClick={() => navigate(course ? `/courses/${course.id}` : "/student/courses")}
            >
              {t("success.viewCourse")} <FaArrowRight size={13} />
            </button>
          </>
        ) : (
          <>
            <FaCircleXmark size={64} className="text-error mx-auto" />
            <h1 className="text-2xl font-bold text-base-content">{t("success.failedTitle")}</h1>
            <p className="text-base-content/60 text-sm">{t("success.failedDesc")}</p>
            <button className="btn btn-primary w-full" onClick={() => navigate(-1)}>
              {t("success.back")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
