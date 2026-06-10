/**
 * CVUploadModal.jsx
 *
 * Modal cho phép gia sư upload CV (PDF hoặc ảnh).
 * AI (Claude) sẽ đọc CV, trích xuất thông tin và trả về JSON
 * khớp với schema các step của TutorProfileEdit.
 * Các trường còn thiếu sẽ được highlight để người dùng điền thêm.
 *
 * Props:
 *   onClose()          — đóng modal
 *   onApply(result)    — nhận object { step1, step2, step3, education[], missing[] }
 *                        và áp dụng vào form
 */

import { useState, useRef } from "react";
import {
  FiUpload,
  FiX,
  FiFile,
  FiCpu,
  FiCheckCircle,
  FiAlertCircle,
  FiChevronRight,
  FiRefreshCw,
} from "react-icons/fi";

// ─── Helpers ───────────────────────────────────────────────────────
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];
const MAX_SIZE_MB = 10;

// Base URL tái sử dụng từ env (giống tutorApi.js)
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

/**
 * PDF → đọc thẳng thành base64.
 * Ảnh → nén canvas xuống max 1600px / JPEG 0.82 trước khi encode.
 * Giảm payload từ ~7MB xuống ~0.5-1MB, tránh lỗi 413.
 */
const prepareFile = (file) =>
  new Promise((resolve, reject) => {
    if (file.type === "application/pdf") {
      const reader = new FileReader();
      reader.onload = () =>
        resolve({
          base64: reader.result.split(",")[1],
          mediaType: "application/pdf",
        });
      reader.onerror = () => reject(new Error("Không đọc được PDF"));
      reader.readAsDataURL(file);
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const MAX_PX = 1600;
      let { width, height } = img;
      if (width > MAX_PX || height > MAX_PX) {
        if (width >= height) {
          height = Math.round((height / width) * MAX_PX);
          width = MAX_PX;
        } else {
          width = Math.round((width / height) * MAX_PX);
          height = MAX_PX;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
      resolve({ base64: dataUrl.split(",")[1], mediaType: "image/jpeg" });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Không đọc được ảnh"));
    };
    img.src = objectUrl;
  });

// ─── Các trường bắt buộc / khuyến nghị điền ──────────────────────
const REQUIRED_FIELDS = {
  "step1.bio": "Giới thiệu bản thân",
  "step1.phone": "Số điện thoại",
  "step1.address": "Địa chỉ",
  "step2.subjects": "Môn dạy",
  "step2.tutoringStyle": "Hình thức dạy",
  "step2.pricePerHour": "Học phí / giờ",
  "step3.qualification": "Bằng cấp cao nhất",
};

/** Kiểm tra trường nào còn null/trống trong kết quả AI */
const detectMissing = (result) => {
  const missing = [];
  for (const [path, label] of Object.entries(REQUIRED_FIELDS)) {
    const [section, field] = path.split(".");
    const val = result[section]?.[field];
    if (
      val === null ||
      val === undefined ||
      val === "" ||
      (Array.isArray(val) && val.length === 0)
    ) {
      missing.push({ path, label });
    }
  }
  return missing;
};

// ─── Component ────────────────────────────────────────────────────
export default function CVUploadModal({ onClose, onApply }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | reading | done | error
  const [result, setResult] = useState(null);
  const [missing, setMissing] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [dragOver, setDragOver] = useState(false);

  // ── File selection ────────────────────────────────────────────
  const handleFile = (f) => {
    if (!f) return;
    if (!ALLOWED_TYPES.includes(f.type)) {
      setErrorMsg("Chỉ hỗ trợ PDF, JPG, PNG, WEBP");
      return;
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      setErrorMsg(`File không được vượt quá ${MAX_SIZE_MB}MB`);
      return;
    }
    setErrorMsg("");
    setFile(f);
    setStatus("idle");
    setResult(null);
  };

  const onInputChange = (e) => handleFile(e.target.files?.[0]);
  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  // ── Call backend proxy → Claude API (tránh CORS) ─────────────
  const analyzeCV = async () => {
    if (!file) return;
    setStatus("reading");
    setErrorMsg("");

    try {
      // nén ảnh / đọc PDF — tránh 413 PayloadTooLarge
      const { base64, mediaType } = await prepareFile(file);

      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");

      const response = await fetch(`${API_BASE}/ai/parse-cv`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ base64, mediaType }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.message || `Lỗi server: ${response.status}`);
      }

      const { data: parsed } = await response.json();

      const missingList = detectMissing(parsed);
      setResult(parsed);
      setMissing(missingList);
      setStatus("done");
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Không phân tích được CV. Vui lòng thử lại.");
      setStatus("error");
    }
  };

  // ── Apply to parent form ──────────────────────────────────────
  const handleApply = () => {
    if (!result) return;
    onApply({ ...result, missing });
    onClose();
  };

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 bg-base-100 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-base-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <FiCpu size={15} className="text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm text-base-content">
                Điền hồ sơ bằng AI
              </p>
              <p className="text-xs text-base-content/40">
                Upload CV — AI tự trích xuất thông tin
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
            <FiX size={16} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Drop zone */}
          <div
            className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-3 cursor-pointer transition-colors
              ${dragOver ? "border-primary bg-primary/5" : "border-base-300 hover:border-primary/50 hover:bg-base-200/40"}
              ${file ? "border-success/40 bg-success/5" : ""}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
          >
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept=".pdf,image/jpeg,image/png,image/webp"
              onChange={onInputChange}
            />
            {file ? (
              <>
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <FiFile size={22} className="text-success" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-sm text-base-content">
                    {file.name}
                  </p>
                  <p className="text-xs text-base-content/40 mt-0.5">
                    {(file.size / 1024 / 1024).toFixed(2)} MB ·{" "}
                    {file.type.split("/")[1].toUpperCase()}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs text-base-content/40"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setResult(null);
                    setStatus("idle");
                  }}
                >
                  Chọn file khác
                </button>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-xl bg-base-200 flex items-center justify-center">
                  <FiUpload size={22} className="text-base-content/30" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-sm text-base-content">
                    Kéo thả hoặc bấm để chọn CV
                  </p>
                  <p className="text-xs text-base-content/40 mt-0.5">
                    PDF, JPG, PNG, WEBP · tối đa {MAX_SIZE_MB}MB
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Error */}
          {(errorMsg || status === "error") && (
            <div className="alert alert-error rounded-xl text-sm py-3">
              <FiAlertCircle size={15} />
              <span>{errorMsg || "Phân tích thất bại. Vui lòng thử lại."}</span>
            </div>
          )}

          {/* Analyze button */}
          {file && status !== "done" && (
            <button
              type="button"
              className="btn btn-primary w-full gap-2"
              onClick={analyzeCV}
              disabled={status === "reading"}
            >
              {status === "reading" ? (
                <>
                  <span className="loading loading-spinner loading-sm" />
                  AI đang đọc CV…
                </>
              ) : (
                <>
                  <FiCpu size={15} />
                  Phân tích CV bằng AI
                </>
              )}
            </button>
          )}

          {/* Result preview */}
          {status === "done" && result && (
            <div className="space-y-4">
              {/* Success banner */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-success/10 border border-success/20">
                <FiCheckCircle size={15} className="text-success shrink-0" />
                <p className="text-sm text-base-content">
                  AI đã trích xuất thông tin từ CV. Kiểm tra trước khi áp dụng.
                </p>
              </div>

              {/* Extracted fields summary */}
              <div className="rounded-xl border border-base-200 divide-y divide-base-200 text-sm overflow-hidden">
                {/* Step 1 */}
                {Object.entries(result.step1 ?? {}).some(([, v]) => v) && (
                  <SectionPreview
                    title="Thông tin cá nhân"
                    rows={[
                      ["Giới thiệu", result.step1.bio],
                      ["Điện thoại", result.step1.phone],
                      ["Địa chỉ", result.step1.address],
                      ["Quốc gia", result.step1.country],
                    ]}
                  />
                )}

                {/* Step 2 */}
                {Object.entries(result.step2 ?? {}).some(
                  ([, v]) =>
                    v != null &&
                    v !== "" &&
                    !(Array.isArray(v) && v.length === 0),
                ) && (
                  <SectionPreview
                    title="Thông tin dạy học"
                    rows={[
                      ["Môn dạy", result.step2.subjects?.join(", ")],
                      ["Hình thức", result.step2.tutoringStyle],
                      [
                        "Học phí/giờ",
                        result.step2.pricePerHour != null
                          ? `${result.step2.pricePerHour.toLocaleString()} VNĐ`
                          : null,
                      ],
                      [
                        "Kinh nghiệm",
                        result.step2.experience != null
                          ? `${result.step2.experience} năm`
                          : null,
                      ],
                      ["Ngôn ngữ", result.step2.languages],
                      ["Khu vực", result.step2.preferredAreas],
                      ["Buổi học", result.step2.timingShift],
                    ]}
                  />
                )}

                {/* Step 3 */}
                {(result.step3?.qualification || result.step3?.certificate) && (
                  <SectionPreview
                    title="Bằng cấp & Chứng chỉ"
                    rows={[
                      ["Bằng cấp", result.step3.qualification],
                      ["Chứng chỉ", result.step3.certificate],
                    ]}
                  />
                )}

                {/* Educations */}
                {result.educations?.length > 0 && (
                  <div className="p-3 space-y-1">
                    <p className="text-xs font-semibold text-base-content/50 uppercase tracking-wide mb-2">
                      Học vấn ({result.educations.length} mục)
                    </p>
                    {result.educations.map((edu, i) => (
                      <div
                        key={i}
                        className="text-xs text-base-content/70 pl-2 border-l-2 border-primary/30"
                      >
                        <span className="font-medium">
                          {edu.universityName}
                        </span>
                        {" — "}
                        {edu.fieldOfStudy} · {edu.passingYear} · {edu.result}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Missing fields warning */}
              {missing.length > 0 && (
                <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 space-y-2">
                  <p className="text-xs font-semibold text-warning flex items-center gap-1">
                    <FiAlertCircle size={12} />
                    {missing.length} trường cần điền thêm sau khi áp dụng:
                  </p>
                  <ul className="space-y-1">
                    {missing.map(({ path, label }) => (
                      <li
                        key={path}
                        className="flex items-center gap-1.5 text-xs text-base-content/60"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-warning shrink-0" />
                        {label}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm gap-1 flex-1"
                  onClick={() => {
                    setStatus("idle");
                    setResult(null);
                  }}
                >
                  <FiRefreshCw size={13} /> Phân tích lại
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm gap-1 flex-1"
                  onClick={handleApply}
                >
                  Áp dụng vào hồ sơ <FiChevronRight size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-component: preview một section ───────────────────────────
function SectionPreview({ title, rows }) {
  const filled = rows.filter(([, v]) => v != null && v !== "");
  if (filled.length === 0) return null;
  return (
    <div className="p-3 space-y-1">
      <p className="text-xs font-semibold text-base-content/50 uppercase tracking-wide mb-2">
        {title}
      </p>
      {filled.map(([label, value]) => (
        <div key={label} className="flex gap-2 text-xs">
          <span className="text-base-content/40 shrink-0 w-24">{label}</span>
          <span className="text-base-content font-medium">{String(value)}</span>
        </div>
      ))}
    </div>
  );
}
