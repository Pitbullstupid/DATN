import { useState } from "react";
import toast from "react-hot-toast";
import { FaXmark, FaPlus, FaTrash, FaCheck } from "react-icons/fa6";
import { createCourse } from "../api/courseApi";

const DAY_OPTIONS = [
  { label: "Sun", value: 0 },
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
];

const todayISO = () => new Date().toISOString().split("T")[0];
const addDays  = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
};

const emptySlot = () => ({ dayOfWeek: 1, startTime: "08:00", endTime: "09:00" });

// ─────────────────────────────────────────────────────────────
export default function AcceptBookingModal({ booking, onClose, onSuccess }) {
  const [form, setForm] = useState({
    subject:        booking.subject || "",
    startDate:      addDays(1),
    endDate:        addDays(30),
    totalSessions:  8,
    durationMin:    60,
    pricePerSession: "",
    note:           "",
  });
  const [schedules, setSchedules] = useState([emptySlot()]);
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);

  // ── Validation ──────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.subject.trim())  e.subject = "Vui lòng nhập môn học";
    if (!form.startDate)       e.startDate = "Vui lòng chọn ngày bắt đầu";
    if (!form.endDate)         e.endDate = "Vui lòng chọn ngày kết thúc";
    if (form.startDate >= form.endDate) e.endDate = "Ngày kết thúc phải sau ngày bắt đầu";
    if (!form.totalSessions || form.totalSessions < 1)
      e.totalSessions = "Số buổi phải ≥ 1";
    if (schedules.length === 0) e.schedules = "Thêm ít nhất 1 buổi học/tuần";
    schedules.forEach((s, i) => {
      if (s.startTime >= s.endTime)
        e[`slot_${i}`] = "Giờ kết thúc phải sau giờ bắt đầu";
    });
    return e;
  };

  const handleChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: "" }));
  };

  // ── Schedule slots ──────────────────────────────────────────
  const addSlot = () => setSchedules((s) => [...s, emptySlot()]);
  const removeSlot = (i) => setSchedules((s) => s.filter((_, idx) => idx !== i));
  const updateSlot = (i, field, value) =>
    setSchedules((s) => s.map((slot, idx) => idx === i ? { ...slot, [field]: value } : slot));

  // ── Submit ──────────────────────────────────────────────────
  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    setLoading(true);
    try {
      await createCourse({
        bookingRequestId: booking.id,
        subject:          form.subject.trim(),
        startDate:        form.startDate,
        endDate:          form.endDate,
        totalSessions:    parseInt(form.totalSessions),
        durationMin:      parseInt(form.durationMin),
        pricePerSession:  form.pricePerSession ? parseFloat(form.pricePerSession) : undefined,
        note:             form.note.trim() || undefined,
        schedules,
      });

      toast.success("Đã tạo lớp học thành công!");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <dialog open className="modal modal-bottom sm:modal-middle">
      <div className="modal-box w-full max-w-2xl p-0 rounded-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-base-200">
          <div>
            <h3 className="font-bold text-base-content text-lg">Tạo lớp học</h3>
            <p className="text-xs text-base-content/50 mt-0.5">
              Chấp nhận yêu cầu từ <strong>{booking.student?.name || booking.name}</strong> · {booking.subject}
            </p>
          </div>
          <button className="btn btn-ghost btn-sm btn-circle" onClick={onClose}>
            <FaXmark size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">

          {/* Subject */}
          <div>
            <label className="text-sm font-medium text-base-content mb-1 block">
              Môn học <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={form.subject}
              onChange={(e) => handleChange("subject", e.target.value)}
              className={`input input-bordered w-full focus:outline-none focus:border-primary ${errors.subject ? "input-error" : ""}`}
              placeholder="VD: Toán lớp 10, Tiếng Anh IELTS..."
            />
            {errors.subject && <p className="text-error text-xs mt-1">{errors.subject}</p>}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-base-content mb-1 block">
                Ngày bắt đầu <span className="text-error">*</span>
              </label>
              <input
                type="date"
                value={form.startDate}
                min={todayISO()}
                onChange={(e) => handleChange("startDate", e.target.value)}
                className={`input input-bordered w-full focus:outline-none focus:border-primary ${errors.startDate ? "input-error" : ""}`}
              />
              {errors.startDate && <p className="text-error text-xs mt-1">{errors.startDate}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-base-content mb-1 block">
                Ngày kết thúc (dự kiến) <span className="text-error">*</span>
              </label>
              <input
                type="date"
                value={form.endDate}
                min={form.startDate || todayISO()}
                onChange={(e) => handleChange("endDate", e.target.value)}
                className={`input input-bordered w-full focus:outline-none focus:border-primary ${errors.endDate ? "input-error" : ""}`}
              />
              {errors.endDate && <p className="text-error text-xs mt-1">{errors.endDate}</p>}
            </div>
          </div>

          {/* Sessions + Duration + Price */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-base-content mb-1 block">
                Tổng số buổi <span className="text-error">*</span>
              </label>
              <input
                type="number"
                min={1}
                value={form.totalSessions}
                onChange={(e) => handleChange("totalSessions", e.target.value)}
                className={`input input-bordered w-full focus:outline-none focus:border-primary ${errors.totalSessions ? "input-error" : ""}`}
              />
              {errors.totalSessions && <p className="text-error text-xs mt-1">{errors.totalSessions}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-base-content mb-1 block">Thời lượng/buổi</label>
              <select
                value={form.durationMin}
                onChange={(e) => handleChange("durationMin", e.target.value)}
                className="select select-bordered w-full focus:outline-none focus:border-primary"
              >
                {[30, 45, 60, 90, 120].map((m) => (
                  <option key={m} value={m}>{m} phút</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-base-content mb-1 block">Giá/buổi (USD)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.pricePerSession}
                onChange={(e) => handleChange("pricePerSession", e.target.value)}
                placeholder="0.00"
                className="input input-bordered w-full focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Total price preview */}
          {form.pricePerSession > 0 && form.totalSessions > 0 && (
            <div className="bg-success/10 border border-success/20 rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-base-content/70">Tổng học phí</span>
              <span className="font-bold text-success text-lg">
                ${(parseFloat(form.pricePerSession) * parseInt(form.totalSessions)).toFixed(2)} USD
              </span>
            </div>
          )}

          {/* Weekly schedule */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <label className="text-sm font-medium text-base-content">
                  Thời khóa biểu <span className="text-error">*</span>
                </label>
                <p className="text-xs text-base-content/40">Các buổi học lặp lại mỗi tuần</p>
              </div>
              <button className="btn btn-ghost btn-xs gap-1 text-primary" onClick={addSlot}>
                <FaPlus size={10} /> Thêm buổi
              </button>
            </div>

            {errors.schedules && <p className="text-error text-xs mb-2">{errors.schedules}</p>}

            <div className="space-y-2">
              {schedules.map((slot, i) => (
                <div key={i} className="flex items-center gap-2 bg-base-200/60 rounded-xl p-3">
                  {/* Day */}
                  <select
                    value={slot.dayOfWeek}
                    onChange={(e) => updateSlot(i, "dayOfWeek", parseInt(e.target.value))}
                    className="select select-sm select-bordered bg-base-100 focus:outline-none focus:border-primary w-24"
                  >
                    {DAY_OPTIONS.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>

                  {/* Start time */}
                  <input
                    type="time"
                    value={slot.startTime}
                    onChange={(e) => updateSlot(i, "startTime", e.target.value)}
                    className="input input-sm input-bordered bg-base-100 focus:outline-none focus:border-primary flex-1"
                  />

                  <span className="text-base-content/40 text-xs shrink-0">→</span>

                  {/* End time */}
                  <input
                    type="time"
                    value={slot.endTime}
                    onChange={(e) => updateSlot(i, "endTime", e.target.value)}
                    className="input input-sm input-bordered bg-base-100 focus:outline-none focus:border-primary flex-1"
                  />

                  {schedules.length > 1 && (
                    <button
                      className="btn btn-ghost btn-sm btn-circle text-error"
                      onClick={() => removeSlot(i)}
                    >
                      <FaTrash size={11} />
                    </button>
                  )}
                </div>
              ))}
              {Object.keys(errors).some((k) => k.startsWith("slot_")) && (
                <p className="text-error text-xs">Kiểm tra lại giờ bắt đầu/kết thúc</p>
              )}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="text-sm font-medium text-base-content mb-1 block">
              Ghi chú <span className="text-base-content/40 font-normal">(tùy chọn)</span>
            </label>
            <textarea
              rows={2}
              placeholder="VD: Học qua Zoom, link sẽ gửi trước 15 phút..."
              value={form.note}
              onChange={(e) => handleChange("note", e.target.value)}
              className="textarea textarea-bordered w-full resize-none text-sm focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-3 border-t border-base-200 flex gap-2">
          <button className="btn btn-ghost flex-1" onClick={onClose} disabled={loading}>Huỷ</button>
          <button className="btn btn-success flex-1 gap-2" onClick={handleSubmit} disabled={loading}>
            {loading
              ? <span className="loading loading-spinner loading-sm" />
              : <FaCheck size={12} />
            }
            Xác nhận & Tạo lớp
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </dialog>
  );
}