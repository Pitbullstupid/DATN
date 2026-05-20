import { useState, useMemo } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { FaXmark, FaPlus, FaTrash, FaCheck, FaCircleInfo } from "react-icons/fa6";
import { createCourse } from "../api/courseApi";
import { useNavigate } from "react-router-dom";

// ─── Constants ────────────────────────────────────────────────────────────────

const DURATION_OPTIONS = [30, 45, 60, 90, 120];

const todayISO = () => new Date().toISOString().split("T")[0];
const addDays = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
};
const emptySlot = () => ({ dayOfWeek: 1, startTime: "08:00", endTime: "09:00" });

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Tính số buổi tối đa có thể xếp được trong khoảng [startDate, endDate]
 * dựa theo thời khóa biểu (mảng dayOfWeek).
 */
const calcMaxSessions = (startDate, endDate, schedules) => {
  if (!startDate || !endDate || !schedules.length) return 0;

  const start = new Date(startDate);
  const end   = new Date(endDate);
  if (start >= end) return 0;

  // Các thứ duy nhất trong thời khóa biểu
  const uniqueDays = [...new Set(schedules.map((s) => s.dayOfWeek))];

  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    if (uniqueDays.includes(cur.getDay())) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
};

/**
 * Tính số ngày tối thiểu cần thiết để đủ totalSessions buổi
 * với thời khóa biểu đã chọn.
 * Trả về string mô tả (VD: "5 tuần 2 ngày").
 */
const calcMinDuration = (totalSessions, schedules, t) => {
  if (!totalSessions || !schedules.length) return null;
  const uniqueDays = [...new Set(schedules.map((s) => s.dayOfWeek))];
  const sessionsPerWeek = uniqueDays.length;
  if (sessionsPerWeek === 0) return null;

  const totalDays = Math.ceil((totalSessions / sessionsPerWeek) * 7);
  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;

  if (weeks === 0) return t("acceptModal.minDuration.days", { count: days });
  if (days === 0) return t("acceptModal.minDuration.weeks", { count: weeks });
  return t("acceptModal.minDuration.weeksDays", { weeks, days });
};

/**
 * Tính giá mỗi buổi = (durationMin / 60) * pricePerHour
 */
const calcPricePerSession = (durationMin, pricePerHour) => {
  if (!pricePerHour || !durationMin) return 0;
  return (parseInt(durationMin) / 60) * parseFloat(pricePerHour);
};

// ─── Main component ───────────────────────────────────────────────────────────
/**
 * Props:
 *   booking        — BookingRequest object (có student, subject)
 *   tutorPricePerHour — giá/giờ từ TutorProfile (truyền từ ngoài vào)
 *   onClose        — fn đóng modal
 *   onSuccess      — fn gọi sau khi tạo thành công
 */
export default function AcceptBookingModal({
  booking,
  tutorPricePerHour = 0,
  onClose,
  onSuccess,
}) {
  const { t, i18n } = useTranslation(["courses", "toast"]);
  const [form, setForm] = useState({
    subject:       booking.subject || "",
    startDate:     addDays(1),
    endDate:       addDays(30),
    totalSessions: 8,
    durationMin:   60,
    note:          "",
  });
  const [schedules, setSchedules] = useState([emptySlot()]);
  const [errors, setErrors]       = useState({});
  const [loading, setLoading]     = useState(false);

  const dayOptions = useMemo(() => {
    const labels = t("shared.weekdayShort", { returnObjects: true });
    return [0, 1, 2, 3, 4, 5, 6].map((value) => ({ label: labels[value], value }));
  }, [t, i18n.language]);

  // ── Derived / computed values ────────────────────────────────
  const maxSessions = useMemo(
    () => calcMaxSessions(form.startDate, form.endDate, schedules),
    [form.startDate, form.endDate, schedules]
  );

  const minDurationText = useMemo(
    () => calcMinDuration(parseInt(form.totalSessions), schedules, t),
    [form.totalSessions, schedules, t, i18n.language]
  );

  // Giá/buổi tự động tính từ durationMin * pricePerHour
  const autoPrice = useMemo(
    () => calcPricePerSession(form.durationMin, tutorPricePerHour),
    [form.durationMin, tutorPricePerHour]
  );

  const totalPrice = autoPrice * parseInt(form.totalSessions || 0);

  // Cảnh báo: khoảng thời gian không đủ
  const notEnoughTime = maxSessions > 0 && parseInt(form.totalSessions) > maxSessions;

  // ── Validation ───────────────────────────────────────────────
  const validate = () => {
    const e = {};
    const weekdayLabels = t("shared.weekdayShort", { returnObjects: true });

    if (!form.subject.trim()) e.subject = t("acceptModal.errors.subjectRequired");
    if (!form.startDate) e.startDate = t("acceptModal.errors.startDateRequired");
    if (!form.endDate) e.endDate = t("acceptModal.errors.endDateRequired");

    if (form.startDate && form.endDate && form.startDate >= form.endDate)
      e.endDate = t("acceptModal.errors.endAfterStart");

    const sessions = parseInt(form.totalSessions);
    if (!sessions || sessions < 1)
      e.totalSessions = t("acceptModal.errors.sessionsMin");

    if (schedules.length === 0)
      e.schedules = t("acceptModal.errors.scheduleMin");

    const days = schedules.map((s) => s.dayOfWeek);
    const dupDay = days.find((d, i) => days.indexOf(d) !== i);
    if (dupDay !== undefined)
      e.schedules = t("acceptModal.errors.duplicateDay", {
        day: weekdayLabels[dupDay],
      });

    schedules.forEach((s, i) => {
      if (s.startTime >= s.endTime)
        e[`slot_${i}`] = t("acceptModal.errors.slotEndAfterStart");
    });

    if (sessions >= 1 && maxSessions > 0 && sessions > maxSessions) {
      const needDuration = calcMinDuration(sessions, schedules, t);
      e.totalSessions = t("acceptModal.errors.sessionsExceedMax", {
        max: maxSessions,
        minDuration: needDuration,
        sessions,
      });
    }

    return e;
  };

  // ── Handlers ─────────────────────────────────────────────────
  const handleChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: "" }));
  };

  const addSlot = () => {
    // Chọn thứ chưa có trong danh sách
    const used = schedules.map((s) => s.dayOfWeek);
    const next = dayOptions.find((d) => !used.includes(d.value));
    setSchedules((s) => [
      ...s,
      { dayOfWeek: next ? next.value : 1, startTime: "08:00", endTime: "09:00" },
    ]);
  };

  const removeSlot = (i) =>
    setSchedules((s) => s.filter((_, idx) => idx !== i));

  const updateSlot = (i, field, value) => {
    setSchedules((s) =>
      s.map((slot, idx) => (idx === i ? { ...slot, [field]: value } : slot))
    );
    // Xoá lỗi slot khi user sửa
    if (errors[`slot_${i}`] || errors.schedules)
      setErrors((e) => ({ ...e, [`slot_${i}`]: "", schedules: "" }));
  };
  const navigate = useNavigate();
  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

    setLoading(true);
    try {
      await createCourse({
        bookingRequestId: booking.id,
        subject:          form.subject.trim(),
        startDate:        form.startDate,
        endDate:          form.endDate,
        totalSessions:    parseInt(form.totalSessions),
        durationMin:      parseInt(form.durationMin),
        pricePerSession:  autoPrice > 0 ? autoPrice : undefined,
        note:             form.note.trim() || undefined,
        schedules,
      });

      toast.success(t("toast:course_create_success"));
      navigate("/courses");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };


  // ── Render ───────────────────────────────────────────────────
  return (
    <dialog open className="modal modal-bottom sm:modal-middle">
      <div className="modal-box w-full max-w-2xl p-0 rounded-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-base-200">
          <div>
            <h3 className="font-bold text-base-content text-lg">
              {t("acceptModal.title")}
            </h3>
            <p className="text-xs text-base-content/50 mt-0.5">
              {t("acceptModal.subtitle", {
                name: booking.student?.name || booking.name,
                subject: booking.subject,
              })}
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
              {t("acceptModal.subject")} <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={form.subject}
              onChange={(e) => handleChange("subject", e.target.value)}
              placeholder={t("acceptModal.subjectPlaceholder")}
              className={`input input-bordered w-full focus:outline-none focus:border-primary ${
                errors.subject ? "input-error" : ""
              }`}
            />
            {errors.subject && (
              <p className="text-error text-xs mt-1">{errors.subject}</p>
            )}
          </div>

          {/* ── Thời khóa biểu — đặt LÊN TRÊN ngày để maxSessions tính được ngay ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <label className="text-sm font-medium text-base-content">
                  {t("acceptModal.schedule")}{" "}
                  <span className="text-error">*</span>
                </label>
                <p className="text-xs text-base-content/40">
                  {t("acceptModal.scheduleHint")}
                </p>
              </div>
              <button
                className="btn btn-ghost btn-xs gap-1 text-primary"
                onClick={addSlot}
                disabled={schedules.length >= 7}
              >
                <FaPlus size={10} /> {t("acceptModal.addSlot")}
              </button>
            </div>

            {errors.schedules && (
              <p className="text-error text-xs mb-2">{errors.schedules}</p>
            )}

            <div className="space-y-2">
              {schedules.map((slot, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-2 rounded-xl p-3 ${
                    errors[`slot_${i}`]
                      ? "bg-error/10 border border-error/30"
                      : "bg-base-200/60"
                  }`}
                >
                  <select
                    value={slot.dayOfWeek}
                    onChange={(e) =>
                      updateSlot(i, "dayOfWeek", parseInt(e.target.value))
                    }
                    className="select select-sm select-bordered bg-base-100 focus:outline-none focus:border-primary w-24"
                  >
                    {dayOptions.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>

                  <input
                    type="time"
                    value={slot.startTime}
                    onChange={(e) => updateSlot(i, "startTime", e.target.value)}
                    className="input input-sm input-bordered bg-base-100 focus:outline-none focus:border-primary flex-1"
                  />

                  <span className="text-base-content/40 text-xs shrink-0">→</span>

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
                <p className="text-error text-xs">
                  {t("acceptModal.slotTimeCheck")}
                </p>
              )}
            </div>

            {/* Info: buổi/tuần */}
            {schedules.length > 0 && (
              <p className="text-xs text-base-content/40 mt-2 flex items-center gap-1">
                <FaCircleInfo size={11} />
                {t("acceptModal.sessionsPerWeek", {
                  count: [...new Set(schedules.map((s) => s.dayOfWeek))].length,
                })}
              </p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-base-content mb-1 block">
                {t("acceptModal.startDate")}{" "}
                <span className="text-error">*</span>
              </label>
              <input
                type="date"
                value={form.startDate}
                min={todayISO()}
                onChange={(e) => {
                  handleChange("startDate", e.target.value);
                  setErrors((err) => ({ ...err, totalSessions: "" }));
                }}
                className={`input input-bordered w-full focus:outline-none focus:border-primary ${
                  errors.startDate ? "input-error" : ""
                }`}
              />
              {errors.startDate && (
                <p className="text-error text-xs mt-1">{errors.startDate}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-base-content mb-1 block">
                {t("acceptModal.endDate")}{" "}
                <span className="text-error">*</span>
              </label>
              <input
                type="date"
                value={form.endDate}
                min={form.startDate || todayISO()}
                onChange={(e) => {
                  handleChange("endDate", e.target.value);
                  setErrors((err) => ({ ...err, totalSessions: "" }));
                }}
                className={`input input-bordered w-full focus:outline-none focus:border-primary ${
                  errors.endDate ? "input-error" : ""
                }`}
              />
              {errors.endDate && (
                <p className="text-error text-xs mt-1">{errors.endDate}</p>
              )}
            </div>
          </div>

          {/* Cảnh báo thời gian + gợi ý */}
          {maxSessions > 0 && (
            <div
              className={`rounded-xl px-4 py-3 flex items-start gap-2 text-xs ${
                notEnoughTime
                  ? "bg-error/10 border border-error/30 text-error"
                  : "bg-info/10 border border-info/20 text-info"
              }`}
            >
              <FaCircleInfo size={13} className="shrink-0 mt-0.5" />
              <div>
                {notEnoughTime ? (
                  <>
                    <span className="font-semibold">
                      {t("acceptModal.timeNotEnoughTitle")}
                    </span>{" "}
                    {t("acceptModal.timeNotEnoughBody", { max: maxSessions })}
                    {minDurationText && (
                      <span>
                        {t("acceptModal.timeNotEnoughNeed", {
                          minDuration: minDurationText,
                          sessions: form.totalSessions,
                        })}
                      </span>
                    )}
                  </>
                ) : (
                  <>{t("acceptModal.timeEnough", { max: maxSessions })}</>
                )}
              </div>
            </div>
          )}

          {/* Sessions + Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-base-content mb-1 block">
                {t("acceptModal.totalSessions")}{" "}
                <span className="text-error">*</span>
              </label>
              <input
                type="number"
                min={1}
                max={maxSessions || undefined}
                value={form.totalSessions}
                onChange={(e) => handleChange("totalSessions", e.target.value)}
                className={`input input-bordered w-full focus:outline-none focus:border-primary ${
                  errors.totalSessions || notEnoughTime ? "input-error" : ""
                }`}
              />
              {errors.totalSessions && (
                <p className="text-error text-xs mt-1">{errors.totalSessions}</p>
              )}
              {!errors.totalSessions && minDurationText && (
                <p className="text-base-content/40 text-xs mt-1">
                  {t("acceptModal.minDurationHint", {
                    minDuration: minDurationText,
                  })}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-base-content mb-1 block">
                {t("acceptModal.durationPerSession")}
              </label>
              <select
                value={form.durationMin}
                onChange={(e) => handleChange("durationMin", e.target.value)}
                className="select select-bordered w-full focus:outline-none focus:border-primary"
              >
                {DURATION_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {t("acceptModal.minutes", { count: m })}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Price info box — readonly, tự tính */}
          <div className="bg-base-200/60 rounded-xl px-4 py-4 space-y-2">
            <p className="text-xs font-semibold text-base-content/60 uppercase tracking-wide">
              {t("acceptModal.tuition")}
            </p>

            <div className="flex items-center justify-between text-sm">
              <span className="text-base-content/60">
                {t("acceptModal.yourHourlyRate")}
              </span>
              <span className="font-medium text-base-content">
                {t("acceptModal.perHour", {
                  amount: `$${Number(tutorPricePerHour).toFixed(2)}`,
                })}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-base-content/60">
                {t("acceptModal.pricePerSession", {
                  minutes: form.durationMin,
                })}
              </span>
              <span className="font-semibold text-primary">
                {t("acceptModal.priceFormula", {
                  minutes: form.durationMin,
                  rate: `$${Number(tutorPricePerHour).toFixed(2)}`,
                  total: `$${autoPrice.toFixed(2)}`,
                })}
              </span>
            </div>

            {parseInt(form.totalSessions) > 0 && (
              <>
                <div className="border-t border-base-200 pt-2 flex items-center justify-between">
                  <span className="text-base-content/60 text-sm">
                    {t("acceptModal.totalTuition")}
                  </span>
                  <span className="font-bold text-success text-lg">
                    ${totalPrice.toFixed(2)} USD
                  </span>
                </div>
                <p className="text-xs text-base-content/40">
                  {t("acceptModal.priceTimesSessions", {
                    amount: `$${autoPrice.toFixed(2)}`,
                    count: form.totalSessions,
                  })}
                </p>
              </>
            )}
          </div>

          {/* Note */}
          <div>
            <label className="text-sm font-medium text-base-content mb-1 block">
              {t("acceptModal.note")}{" "}
              <span className="text-base-content/40 font-normal">
                {t("acceptModal.noteOptional")}
              </span>
            </label>
            <textarea
              rows={2}
              placeholder={t("acceptModal.notePlaceholder")}
              value={form.note}
              onChange={(e) => handleChange("note", e.target.value)}
              className="textarea textarea-bordered w-full resize-none text-sm focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-3 border-t border-base-200 flex gap-2">
          <button className="btn btn-ghost flex-1" onClick={onClose} disabled={loading}>
            {t("acceptModal.cancel")}
          </button>
          <button
            className="btn btn-success flex-1 gap-2"
            onClick={handleSubmit}
            disabled={loading || notEnoughTime}
          >
            {loading ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <FaCheck size={12} />
            )}
            {t("acceptModal.confirmCreate")}
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </dialog>
  );
}