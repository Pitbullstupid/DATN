// ─── Helpers ──────────────────────────────────────────────────
export const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "—";

export const fmtUsd = (v) =>
  `$${Number(v || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const avatar = (name) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "?")}&size=80&background=random`;

// ─── Status maps ──────────────────────────────────────────────
export const COURSE_STATUS = {
  UPCOMING:        { badge: "badge-info",    label: "Sắp tới" },
  ONGOING:         { badge: "badge-warning", label: "Đang học" },
  COMPLETED:       { badge: "badge-success", label: "Hoàn thành" },
  CANCELLED:       { badge: "badge-error",   label: "Đã huỷ" },
  PENDING_PAYMENT: { badge: "badge-ghost",   label: "Chờ thanh toán" },
};

export const PAYMENT_STATUS = {
  PAID:     { badge: "badge-success", label: "Đã thanh toán" },
  RELEASED: { badge: "badge-info",    label: "Đã giải phóng" },
  PENDING:  { badge: "badge-warning", label: "Chờ xử lý" },
  REFUNDED: { badge: "badge-ghost",   label: "Đã hoàn" },
  FAILED:   { badge: "badge-error",   label: "Thất bại" },
};

export const WITHDRAWAL_STATUS = {
  PENDING:    { badge: "badge-warning", label: "Chờ xử lý" },
  PROCESSING: { badge: "badge-info",    label: "Đang xử lý" },
  COMPLETED:  { badge: "badge-success", label: "Hoàn thành" },
  FAILED:     { badge: "badge-error",   label: "Thất bại" },
};

export const TUTOR_STATUS = {
  PENDING:    { badge: "badge-warning", label: "Chờ duyệt" },
  REVIEWING:  { badge: "badge-info",    label: "Đang xét" },
  APPROVED:   { badge: "badge-success", label: "Đã duyệt" },
  REJECTED:   { badge: "badge-error",   label: "Từ chối" },
  SUSPENDED:  { badge: "badge-error",   label: "Tạm khoá" },
  INCOMPLETE: { badge: "badge-ghost",   label: "Chưa hoàn tất" },
};