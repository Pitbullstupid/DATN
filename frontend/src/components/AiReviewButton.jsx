

import { useState } from "react";
import {
  FiCpu,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";

// Base URL — giống tutorApi.js / adminApi.js
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

// ─── Decision badge config ─────────────────────────────────────────
const DECISION_CONFIG = {
  APPROVE: { label: "Nên duyệt", Icon: FiCheckCircle, color: "text-success" },
  REJECT: { label: "Nên từ chối", Icon: FiXCircle, color: "text-error" },
  NEEDS_REVIEW: {
    label: "Cần xem kỹ thêm",
    Icon: FiAlertCircle,
    color: "text-warning",
  },
};
const CONFIDENCE_LABEL = {
  HIGH: "Tin cậy cao",
  MEDIUM: "Trung bình",
  LOW: "Thấp",
};

// ─── Component ────────────────────────────────────────────────────
export default function AiReviewButton({ profile, onSuggest }) {
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [aiResult, setAiResult] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleAnalyze = async () => {
    setStatus("loading");
    setErrorMsg("");
    setAiResult(null);

    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");

      // Gọi backend proxy — backend giữ ANTHROPIC_API_KEY, tránh CORS
      const response = await fetch(`${API_BASE}/ai/review-tutor`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ profile }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.message || `Lỗi server: ${response.status}`);
      }

      const { data: parsed } = await response.json();

      setAiResult(parsed);
      setExpanded(true);
      setStatus("done");
      onSuggest?.(parsed);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "AI không thể phân tích hồ sơ này.");
      setStatus("error");
    }
  };

  const cfg = aiResult ? DECISION_CONFIG[aiResult.decision] : null;

  return (
    <div className="mt-3">
      {/* Trigger / re-analyze button */}
      {status !== "done" && (
        <button
          type="button"
          className="btn btn-outline btn-xs gap-1.5 w-full border-primary/30 text-primary hover:bg-primary/5"
          onClick={handleAnalyze}
          disabled={status === "loading"}
        >
          {status === "loading" ? (
            <>
              <span className="loading loading-spinner loading-xs" />
              AI đang phân tích…
            </>
          ) : (
            <>
              <FiCpu size={12} />
              Phân tích bằng AI
            </>
          )}
        </button>
      )}

      {/* Error */}
      {status === "error" && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-error">
          <FiAlertCircle size={12} />
          <span className="flex-1">{errorMsg}</span>
          <button className="underline shrink-0" onClick={handleAnalyze}>
            Thử lại
          </button>
        </div>
      )}

      {/* Result panel */}
      {status === "done" && aiResult && cfg && (
        <div className="mt-2 rounded-xl border border-base-200 overflow-hidden">
          {/* Summary bar — click để toggle */}
          <button
            type="button"
            className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-base-200/40 hover:bg-base-200/70 transition-colors"
            onClick={() => setExpanded((v) => !v)}
          >
            <div className="flex items-center gap-2 min-w-0">
              <cfg.Icon size={13} className={`${cfg.color} shrink-0`} />
              <span className={`text-xs font-semibold ${cfg.color}`}>
                {cfg.label}
              </span>
              <span className="text-xs text-base-content/40">·</span>
              <span className="text-xs text-base-content/40">
                {CONFIDENCE_LABEL[aiResult.confidence]}
              </span>
            </div>
            {expanded ? (
              <FiChevronUp
                size={12}
                className="text-base-content/40 shrink-0"
              />
            ) : (
              <FiChevronDown
                size={12}
                className="text-base-content/40 shrink-0"
              />
            )}
          </button>

          {/* Detail panel */}
          {expanded && (
            <div className="px-3 py-3 space-y-3 bg-base-100">
              {/* Summary */}
              <p className="text-xs text-base-content/70 leading-relaxed">
                {aiResult.summary}
              </p>

              {/* Strengths */}
              {aiResult.strengths?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-success mb-1">
                    Điểm mạnh
                  </p>
                  <ul className="space-y-0.5">
                    {aiResult.strengths.map((s, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-1.5 text-xs text-base-content/60"
                      >
                        <FiCheckCircle
                          size={11}
                          className="text-success shrink-0 mt-0.5"
                        />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Concerns */}
              {aiResult.concerns?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-warning mb-1">
                    Điểm cần lưu ý
                  </p>
                  <ul className="space-y-0.5">
                    {aiResult.concerns.map((c, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-1.5 text-xs text-base-content/60"
                      >
                        <FiAlertCircle
                          size={11}
                          className="text-warning shrink-0 mt-0.5"
                        />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggested admin note */}
              {aiResult.adminNote && (
                <div className="rounded-lg bg-error/5 border border-error/20 p-2">
                  <p className="text-xs font-semibold text-error/70 mb-0.5">
                    Ghi chú gợi ý cho gia sư:
                  </p>
                  <p className="text-xs text-base-content/60">
                    {aiResult.adminNote}
                  </p>
                </div>
              )}

              {/* Re-analyze */}
              <button
                type="button"
                className="btn btn-ghost btn-xs text-base-content/30 gap-1"
                onClick={handleAnalyze}
              >
                <FiCpu size={10} /> Phân tích lại
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
