import { useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { FaXmark } from "react-icons/fa6";
import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

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

const FormRequestTutor = ({ tutorProfileId, tutorName, defaultSubject = "" }) => {
  const { t } = useTranslation(["tutors", "toast"]);
  const INITIAL = {
    name: "",
    email: "",
    subject: defaultSubject,
    message: "",
  };

  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = t("tutors:request.errors.name_required");
    if (!form.email.trim()) {
      errs.email = t("tutors:request.errors.email_required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = t("tutors:request.errors.email_invalid");
    }
    if (!form.subject.trim()) errs.subject = t("tutors:request.errors.subject_required");
    if (!form.message.trim()) errs.message = t("tutors:request.errors.message_required");
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
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
      await API.post(`/bookings`, {
        tutorProfileId,
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
      });

      toast.success(t("toast:request_sent"), { duration: 4000 });
      setForm(INITIAL);
      setErrors({});
      closeModal();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || t("toast:something_wrong"));
      closeModal();
    } finally {
      setLoading(false);
    }
  };

  return (
    <dialog id="modal_request_tutor" className="modal modal-bottom sm:modal-middle">
      <div className="modal-box w-full max-w-lg p-0 overflow-hidden rounded-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-base-200">
          <h3 className="text-lg font-bold text-base-content">
            {t("tutors:request.title")}
            {tutorName && (
              <span className="text-primary font-normal text-base ml-1.5">— {tutorName}</span>
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

          <Field label={t("tutors:request.email")} required error={errors.email}>
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

          <Field label={t("tutors:request.subject")} required error={errors.subject}>
            <input
              type="text"
              name="subject"
              value={form.subject}
              onChange={handleChange}
              placeholder={t("tutors:request.subject_placeholder")}
              className={`input input-bordered w-full focus:outline-none focus:border-primary transition-colors ${
                errors.subject ? "input-error" : ""
              }`}
            />
          </Field>

          <Field label={t("tutors:request.message")} required error={errors.message}>
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
