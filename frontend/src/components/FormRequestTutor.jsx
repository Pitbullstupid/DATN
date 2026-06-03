import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { FaPlus, FaTrash, FaXmark } from "react-icons/fa6";
import { useAuth } from "../context/AuthContext";
import { createBooking } from "../api/bookingApi";
import { getSubjects } from "../api/subjectApi";

const emptySlot = () => ({ dayOfWeek: 1, startTime: "08:00", endTime: "09:00" });

const Field = ({ label, required, error, children }) => (
  <div className="flex flex-col gap-1">
    <label className="text-sm font-medium text-base-content">
      {label}
      {required && <span className="text-error ml-0.5">*</span>}
    </label>
    {children}
    {error && <p className="text-error text-xs mt-0.5">{error}</p>}
  </div>
);

const FormRequestTutor = ({
  tutorProfileId,
  tutorName,
  defaultSubject = "",
}) => {
  const { t, i18n } = useTranslation(["tutors", "toast", "courses"]);
  const { user } = useAuth();
  const initialForm = useMemo(
    () => ({
      name: user?.name || "",
      email: user?.email || "",
      subject: defaultSubject,
      message: "",
    }),
    [defaultSubject, user?.email, user?.name],
  );

  const [form, setForm] = useState(initialForm);
  const [schedules, setSchedules] = useState([emptySlot()]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);

  const dayOptions = useMemo(() => {
    const labels = t("courses:shared.weekdayShort", { returnObjects: true });
    return [0, 1, 2, 3, 4, 5, 6].map((value) => ({
      label: labels[value],
      value,
    }));
  }, [t, i18n.language]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      name: user?.name || prev.name,
      email: user?.email || prev.email,
      subject: prev.subject || defaultSubject,
    }));
  }, [defaultSubject, user?.email, user?.name]);

  useEffect(() => {
    let ignore = false;

    const loadSubjects = async () => {
      setSubjectsLoading(true);
      try {
        const { data } = await getSubjects();
        if (!ignore) setSubjects(data?.data?.subjects || []);
      } catch (err) {
        if (!ignore) {
          toast.error(
            err.response?.data?.message ||
              err.message ||
              t("toast:something_wrong"),
          );
        }
      } finally {
        if (!ignore) setSubjectsLoading(false);
      }
    };

    loadSubjects();
    return () => {
      ignore = true;
    };
  }, [t]);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = t("tutors:request.errors.name_required");
    if (!form.email.trim()) {
      errs.email = t("tutors:request.errors.email_required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = t("tutors:request.errors.email_invalid");
    }
    if (!form.subject.trim())
      errs.subject = t("tutors:request.errors.subject_required");
    if (schedules.length === 0)
      errs.schedules = t("courses:acceptModal.errors.scheduleMin");

    const days = schedules.map((slot) => slot.dayOfWeek);
    const duplicateDay = days.find((day, index) => days.indexOf(day) !== index);
    if (duplicateDay !== undefined)
      errs.schedules = t("courses:acceptModal.errors.duplicateDay", {
        day: dayOptions.find((day) => day.value === duplicateDay)?.label,
      });

    schedules.forEach((slot, index) => {
      if (slot.startTime >= slot.endTime)
        errs[`slot_${index}`] = t(
          "courses:acceptModal.errors.slotEndAfterStart",
        );
    });

    if (!form.message.trim())
      errs.message = t("tutors:request.errors.message_required");
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const addSlot = () => {
    const usedDays = schedules.map((slot) => slot.dayOfWeek);
    const nextDay = dayOptions.find((day) => !usedDays.includes(day.value));
    setSchedules((prev) => [
      ...prev,
      {
        dayOfWeek: nextDay ? nextDay.value : 1,
        startTime: "08:00",
        endTime: "09:00",
      },
    ]);
    if (errors.schedules) setErrors((prev) => ({ ...prev, schedules: "" }));
  };

  const removeSlot = (index) => {
    setSchedules((prev) => prev.filter((_, idx) => idx !== index));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.schedules;
      delete next[`slot_${index}`];
      return next;
    });
  };

  const updateSlot = (index, field, value) => {
    setSchedules((prev) =>
      prev.map((slot, idx) =>
        idx === index ? { ...slot, [field]: value } : slot,
      ),
    );
    setErrors((prev) => ({
      ...prev,
      schedules: "",
      [`slot_${index}`]: "",
    }));
  };

  const closeModal = () => {
    document.getElementById("modal_request_tutor")?.close();
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    if (!tutorProfileId) {
      toast.error(t("toast:tutor_missing"));
      return;
    }

    setLoading(true);
    try {
      await createBooking({
        tutorProfileId,
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject.trim(),
        schedules,
        message: form.message.trim(),
      });

      toast.success(t("toast:request_sent"), { duration: 4000 });
      setForm({
        ...initialForm,
        message: "",
      });
      setSchedules([emptySlot()]);
      setErrors({});
      closeModal();
    } catch (err) {
      toast.error(err.message || t("toast:something_wrong"));
      closeModal();
    } finally {
      setLoading(false);
    }
  };

  return (
    <dialog
      id="modal_request_tutor"
      className="modal modal-bottom sm:modal-middle"
    >
      <div className="modal-box w-full max-w-lg p-0 overflow-hidden rounded-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-base-200">
          <h3 className="text-lg font-bold text-base-content">
            {t("tutors:request.title")}
            {tutorName && (
              <span className="text-primary font-normal text-base ml-1.5">
                — {tutorName}
              </span>
            )}
          </h3>
          <button
            className="btn btn-ghost btn-sm btn-circle text-base-content/50 hover:text-base-content"
            onClick={closeModal}
            disabled={loading}
          >
            <FaXmark size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <Field label={t("tutors:request.name")} required error={errors.name}>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder={t("tutors:request.name_placeholder")}
              className={`input input-bordered w-full focus:outline-none focus:border-primary transition-colors ${
                errors.name ? "input-error" : ""
              }`}
            />
          </Field>

          <Field
            label={t("tutors:request.email")}
            required
            error={errors.email}
          >
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder={t("tutors:request.email_placeholder")}
              className={`input input-bordered w-full focus:outline-none focus:border-primary transition-colors ${
                errors.email ? "input-error" : ""
              }`}
            />
          </Field>

          <Field
            label={t("tutors:request.subject")}
            required
            error={errors.subject}
          >
            <select
              name="subject"
              value={form.subject}
              onChange={handleChange}
              disabled={subjectsLoading}
              className={`select select-bordered w-full focus:outline-none focus:border-primary transition-colors ${
                errors.subject ? "select-error" : ""
              }`}
            >
              {subjectsLoading ? (
                <option>{t("tutors:request.subject_placeholder")}</option>
              ) : null}
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.name}>
                  {subject.name}
                </option>
              ))}
            </select>
          </Field>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <label className="text-sm font-medium text-base-content">
                  {t("courses:acceptModal.schedule")}{" "}
                  <span className="text-error">*</span>
                </label>
                <p className="text-xs text-base-content/40">
                  {t("courses:acceptModal.scheduleHint")}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-xs gap-1 text-primary"
                onClick={addSlot}
                disabled={schedules.length >= 7}
              >
                <FaPlus size={10} /> {t("courses:acceptModal.addSlot")}
              </button>
            </div>

            {errors.schedules && (
              <p className="text-error text-xs mb-2">{errors.schedules}</p>
            )}

            <div className="space-y-2">
              {schedules.map((slot, index) => (
                <div
                  key={index}
                  className={`flex flex-col sm:flex-row sm:items-center gap-2 rounded-xl p-3 ${
                    errors[`slot_${index}`]
                      ? "bg-error/10 border border-error/30"
                      : "bg-base-200/60"
                  }`}
                >
                  <select
                    value={slot.dayOfWeek}
                    onChange={(event) =>
                      updateSlot(
                        index,
                        "dayOfWeek",
                        parseInt(event.target.value),
                      )
                    }
                    className="select select-sm select-bordered bg-base-100 focus:outline-none focus:border-primary w-full sm:w-24"
                  >
                    {dayOptions.map((day) => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>

                  <input
                    type="time"
                    value={slot.startTime}
                    onChange={(event) =>
                      updateSlot(index, "startTime", event.target.value)
                    }
                    className="input input-sm input-bordered bg-base-100 focus:outline-none focus:border-primary flex-1"
                  />

                  <span className="text-base-content/40 text-xs shrink-0 hidden sm:inline">
                    →
                  </span>

                  <input
                    type="time"
                    value={slot.endTime}
                    onChange={(event) =>
                      updateSlot(index, "endTime", event.target.value)
                    }
                    className="input input-sm input-bordered bg-base-100 focus:outline-none focus:border-primary flex-1"
                  />

                  {schedules.length > 1 && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm btn-circle text-error self-end sm:self-auto"
                      onClick={() => removeSlot(index)}
                    >
                      <FaTrash size={11} />
                    </button>
                  )}
                </div>
              ))}

              {Object.keys(errors).some((key) => key.startsWith("slot_")) && (
                <p className="text-error text-xs">
                  {t("courses:acceptModal.slotTimeCheck")}
                </p>
              )}
            </div>
          </div>

          <Field
            label={t("tutors:request.message")}
            required
            error={errors.message}
          >
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              rows={5}
              placeholder={t("tutors:request.message_placeholder")}
              className={`textarea textarea-bordered w-full resize-y focus:outline-none focus:border-primary transition-colors text-sm ${
                errors.message ? "textarea-error" : ""
              }`}
            />
          </Field>
        </div>

        <div className="px-6 pb-6">
          <button
            className="btn btn-primary w-full rounded-full text-base font-semibold"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              t("tutors:request.submit")
            )}
          </button>
        </div>
      </div>

      <div className="modal-backdrop" onClick={closeModal} />
    </dialog>
  );
};

export default FormRequestTutor;
