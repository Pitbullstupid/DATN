import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  FiUser, FiBook, FiAward, FiShare2, FiGlobe,
  FiPhone, FiMapPin, FiDollarSign, FiClock,
  FiPlus, FiTrash2, FiChevronLeft, FiChevronRight,
  FiSend, FiCheckCircle, FiAlertCircle, FiInfo,
  FiFacebook, FiTwitter, FiYoutube, FiInstagram,
  FiCamera,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { userApi } from "../api/userApi";
import {
  getMyProfile,
  updateStep1,
  updateStep2,
  updateStep3,
  updateSocialMedia,
  addEducation,
  deleteEducation,
  submitProfile,
} from "../api/tutorApi";

const STEP_META = [
  { id: 1, icon: FiUser },
  { id: 2, icon: FiBook },
  { id: 3, icon: FiAward },
  { id: 4, icon: FiShare2 },
];

const TIMING_SHIFTS  = ["MORNING", "AFTERNOON", "EVENING", "FLEXIBLE"];
const TUTORING_STYLES = ["ONE_ON_ONE", "GROUP", "BOTH"];

const SUBJECT_OPTIONS = [
  "Math","Physics","Chemistry","Biology","English","Literature",
  "History","Geography","Computer Science","Economics",
];

// ─── Helpers ──────────────────────────────────────────────────
const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse rounded-lg bg-base-300 ${className}`} />
);

const FormField = ({ label, required, hint, error, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold text-base-content/60 uppercase tracking-wider flex items-center gap-1">
      {label}
      {required && <span className="text-error">*</span>}
      {hint && (
        <span className="tooltip tooltip-right normal-case font-normal" data-tip={hint}>
          <FiInfo size={12} className="text-base-content/30 cursor-help" />
        </span>
      )}
    </label>
    {children}
    {error && (
      <p className="text-error text-xs flex items-center gap-1">
        <FiAlertCircle size={11} /> {error}
      </p>
    )}
  </div>
);

const inputCls = "input input-bordered input-sm w-full bg-base-100 focus:input-primary text-base-content";
const textareaCls = "textarea textarea-bordered textarea-sm w-full bg-base-100 focus:textarea-primary text-base-content min-h-[90px] resize-none";
const AVATAR_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const AVATAR_MAX_SIZE = 2 * 1024 * 1024;

// ═════════════════════════════════════════════════════════════
const showToast = (type, msg) => {
  if (type === "success") {
    toast.success(msg);
    return;
  }

  if (type === "error") {
    toast.error(msg);
    return;
  }

  toast(msg);
};

const TutorProfileEdit = () => {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const { user, refreshUser } = useAuth();
  const { t } = useTranslation(["profile", "toast", "dashboard"]);

  // ── State ─────────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState(1);
  const [loading,  setLoading ] = useState(true);
  const [saving,   setSaving  ] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [profileStatus, setProfileStatus] = useState("PENDING");
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || "");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Step 1
  const [step1, setStep1] = useState({ bio: "", phone: "", address: "", country: "" });
  // Step 2
  const [step2, setStep2] = useState({
    subjects: [], preferredAreas: "", daysPerWeek: "",
    timingShift: "", pricePerHour: "", tutoringStyle: "",
    experience: "", tuitionDuration: "", languages: "",
  });
  // Step 3
  const [step3, setStep3]   = useState({ qualification: "", certificate: "" });
  const [educations, setEducations] = useState([]);
  const [newEdu, setNewEdu] = useState({ universityName: "", fieldOfStudy: "", passingYear: "", result: "" });
  const [addingEdu, setAddingEdu] = useState(false);
  // Step 4
  const [social, setSocial] = useState({ facebook: "", twitter: "", youtube: "", instagram: "" });

  // ── Load profile ─────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const { data } = await getMyProfile();
        console.log("Profile data:", data);
        const p = data?.data?.profile;
        if (!p) return;
        setProfileStatus(p.status ?? "PENDING");
        setAvatarPreview(p.user?.avatar || "");
        setStep1({
          bio:     p.bio     ?? "",
          phone:   p.phone   ?? "",
          address: p.address ?? "",
          country: p.country ?? "",
        });
        setStep2({
          subjects:        p.subjects        ?? [],
          preferredAreas:  (p.preferredAreas ?? []).join(", "),
          daysPerWeek:     p.daysPerWeek     ?? "",
          timingShift:     p.timingShift     ?? "",
          pricePerHour:    p.pricePerHour    ?? "",
          tutoringStyle:   p.tutoringStyle   ?? "",
          experience:      p.experience      ?? "",
          tuitionDuration: p.tuitionDuration ?? "",
          languages:       (p.languages      ?? []).join(", "),
        });
        setStep3({ qualification: p.qualification ?? "", certificate: p.certificate ?? "" });
        setEducations(p.educations ?? []);
        setSocial({
          facebook:  p.socialMedia?.facebook  ?? "",
          twitter:   p.socialMedia?.twitter   ?? "",
          youtube:   p.socialMedia?.youtube   ?? "",
          instagram: p.socialMedia?.instagram ?? "",
        });
      } catch {
        showToast("error", t("toast:load_profile_failed"));
      } finally {
        setLoading(false);
      }
    })();
  }, [t]);

  // ── Locked guard ─────────────────────────────────────────
  const isLocked = ["REVIEWING", "APPROVED", "SUSPENDED"].includes(profileStatus);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = "";

    if (!AVATAR_ALLOWED_TYPES.includes(file.type)) {
      showToast("error", "Chỉ hỗ trợ ảnh JPG, JPEG, PNG hoặc WEBP");
      return;
    }

    if (file.size > AVATAR_MAX_SIZE) {
      showToast("error", "Ảnh không được vượt quá 2MB");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const previousAvatar = avatarPreview;
    setAvatarPreview(objectUrl);
    setUploadingAvatar(true);

    try {
      const res = await userApi.uploadAvatar(file);
      const avatarUrl = res.data?.data?.user?.avatar;
      setAvatarPreview(avatarUrl || "");
      await refreshUser();
      showToast("success", "Cập nhật ảnh đại diện thành công");
    } catch (err) {
      setAvatarPreview(previousAvatar || "");
      showToast("error", err.message || "Upload ảnh thất bại");
    } finally {
      URL.revokeObjectURL(objectUrl);
      setUploadingAvatar(false);
    }
  };

  // ── Save handlers ────────────────────────────────────────
  const handleSaveStep = async () => {
    if (isLocked) return;
    setSaving(true);
    try {
      if (currentStep === 1) {
        await updateStep1(step1);
      } else if (currentStep === 2) {
        await updateStep2({
          ...step2,
          preferredAreas: step2.preferredAreas.split(",").map((s) => s.trim()).filter(Boolean),
          languages:       step2.languages.split(",").map((s) => s.trim()).filter(Boolean),
          daysPerWeek:     step2.daysPerWeek    ? Number(step2.daysPerWeek)    : undefined,
          pricePerHour:    step2.pricePerHour   ? Number(step2.pricePerHour)   : undefined,
          experience:      step2.experience     ? Number(step2.experience)     : undefined,
          tuitionDuration: step2.tuitionDuration? Number(step2.tuitionDuration): undefined,
        });
      } else if (currentStep === 3) {
        await updateStep3(step3);
      } else if (currentStep === 4) {
        await updateSocialMedia(social);
      }
      showToast("success", t("toast:save_success"));
    } catch (err) {
      showToast("error", err.message || t("toast:save_failed"));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndNext = async () => {
    await handleSaveStep();
    if (currentStep < STEP_META.length) setCurrentStep((s) => s + 1);
  };

  // ── Education handlers ───────────────────────────────────
  const handleAddEducation = async () => {
    if (!newEdu.universityName || !newEdu.fieldOfStudy || !newEdu.passingYear || !newEdu.result) {
      showToast("error", t("toast:education_fill_all"));
      return;
    }
    setAddingEdu(true);
    try {
      const { data } = await addEducation({ ...newEdu, passingYear: Number(newEdu.passingYear) });
      setEducations((prev) => [...prev, data.data.education]);
      setNewEdu({ universityName: "", fieldOfStudy: "", passingYear: "", result: "" });
      showToast("success", t("toast:education_added"));
    } catch (err) {
      showToast("error", err.message || t("toast:education_add_failed"));
    } finally {
      setAddingEdu(false);
    }
  };

  const handleDeleteEducation = async (eduId) => {
    try {
      await deleteEducation(eduId);
      setEducations((prev) => prev.filter((e) => e.id !== eduId));
      showToast("success", t("toast:education_removed"));
    } catch (err) {
      showToast("error", err.message || t("toast:education_delete_failed"));
    }
  };

  // ── Submit profile ───────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitLoading(true);
    try {
      await submitProfile();
      setProfileStatus("REVIEWING");
      showToast("success", t("toast:submit_success"));
      setTimeout(() => navigate("/tutor/dashboard"), 1500);
    } catch (err) {
      showToast("error", err.message || t("toast:submit_failed"));
    } finally {
      setSubmitLoading(false);
    }
  };

  // ── Subject toggle ───────────────────────────────────────
  const toggleSubject = (sub) => {
    setStep2((prev) => ({
      ...prev,
      subjects: prev.subjects.includes(sub)
        ? prev.subjects.filter((s) => s !== sub)
        : [...prev.subjects, sub],
    }));
  };

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-base-200">

      {/* Hero */}
      <div className="relative bg-primary overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-12 -right-12 w-72 h-72 rounded-full bg-primary-content/5" />
          <div className="absolute -bottom-10 left-16 w-52 h-52 rounded-full bg-primary-content/5" />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center py-10 gap-1">
          <p className="text-primary-content/60 text-xs font-semibold uppercase tracking-[0.2em]">
            {t("profile:portal")}
          </p>
          <h1 className="text-primary-content text-3xl font-bold">{t("profile:title")}</h1>
        </div>
      </div>

      {/* Locked banner */}
      {!loading && isLocked && (
        <div className="max-w-3xl mx-auto px-4 mt-6">
          <div className="alert alert-warning rounded-2xl shadow-sm">
            <FiAlertCircle size={16} />
            <span>
              <Trans
                i18nKey="profile:locked"
                values={{
                  status: t(`dashboard:profile_status.${profileStatus}`, {
                    defaultValue: profileStatus,
                  }),
                }}
                components={{ strong: <strong /> }}
              />
            </span>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-20">

        {/* ── Step indicator ─────────────────────────────── */}
        <div className="bg-base-100 rounded-2xl border border-base-300 shadow-sm p-4 mb-6">
          <ul className="steps steps-horizontal w-full">
            {STEP_META.map((step) => (
              <li
                key={step.id}
                className={`step text-xs cursor-pointer transition-colors ${
                  currentStep >= step.id ? "step-primary" : ""
                }`}
                onClick={() => setCurrentStep(step.id)}
              >
                {t(`profile:steps.${step.id}`)}
              </li>
            ))}
          </ul>
        </div>

        {/* ── Form card ──────────────────────────────────── */}
        <div className="bg-base-100 rounded-2xl border border-base-300 shadow-sm overflow-hidden">

          {/* Card header */}
          <div className="h-1 w-full bg-primary" />
          <div className="px-6 py-5 border-b border-base-200 flex items-center gap-3">
            {React.createElement(STEP_META[currentStep - 1].icon, {
              size: 18,
              className: "text-primary",
            })}
            <div>
              <h2 className="font-bold text-base-content text-base">
                {t("profile:steps.step_label", {
                  n: currentStep,
                  label: t(`profile:steps.${currentStep}`),
                })}
              </h2>
              <p className="text-xs text-base-content/40 mt-0.5">
                {t(`profile:steps.desc${currentStep}`)}
              </p>
            </div>
          </div>

          {/* Card body */}
          <div className="p-6">
            {loading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-1.5">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                {/* ══ STEP 1 ══════════════════════════════ */}
                {currentStep === 1 && (
                  <div className="space-y-5">
                    <div className="flex items-center gap-4 rounded-xl border border-base-200 bg-base-100 p-4">
                      <div className="avatar">
                        <div className="w-20 rounded-full ring ring-primary/20 ring-offset-2 ring-offset-base-100">
                          <img
                            src={
                              avatarPreview ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "T")}&size=160&background=random`
                            }
                            alt={user?.name || "Tutor avatar"}
                          />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-base-content">{user?.name || "Gia sư"}</p>
                        <p className="text-xs text-base-content/50">
                          JPG, JPEG, PNG hoặc WEBP. Tối đa 2MB.
                        </p>
                      </div>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                      <button
                        type="button"
                        className="btn btn-sm btn-primary gap-2"
                        onClick={() => fileRef.current?.click()}
                        disabled={uploadingAvatar}
                      >
                        {uploadingAvatar ? (
                          <span className="loading loading-spinner loading-xs" />
                        ) : (
                          <FiCamera size={14} />
                        )}
                        Đổi ảnh
                      </button>
                    </div>

                    <FormField label={t("profile:fields.bio")} hint={t("profile:fields.bio_hint")}>
                      <textarea
                        className={textareaCls}
                        placeholder={t("profile:fields.bio_placeholder")}
                        value={step1.bio}
                        onChange={(e) => setStep1({ ...step1, bio: e.target.value })}
                        disabled={isLocked}
                      />
                    </FormField>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField label={t("profile:fields.phone")} required>
                        <label className="input input-bordered input-sm flex items-center gap-2 bg-base-100 focus-within:border-primary">
                          <FiPhone size={14} className="text-base-content/40 shrink-0" />
                          <input
                            type="tel"
                            className="grow text-sm bg-transparent outline-none"
                            placeholder={t("profile:fields.phone_placeholder")}
                            value={step1.phone}
                            onChange={(e) => setStep1({ ...step1, phone: e.target.value })}
                            disabled={isLocked}
                          />
                        </label>
                      </FormField>

                      <FormField label={t("profile:fields.country")}>
                        <label className="input input-bordered input-sm flex items-center gap-2 bg-base-100 focus-within:border-primary">
                          <FiGlobe size={14} className="text-base-content/40 shrink-0" />
                          <input
                            type="text"
                            className="grow text-sm bg-transparent outline-none"
                            placeholder={t("profile:fields.country_placeholder")}
                            value={step1.country}
                            onChange={(e) => setStep1({ ...step1, country: e.target.value })}
                            disabled={isLocked}
                          />
                        </label>
                      </FormField>
                    </div>

                    <FormField label={t("profile:fields.address")}>
                      <label className="input input-bordered input-sm flex items-center gap-2 bg-base-100 focus-within:border-primary">
                        <FiMapPin size={14} className="text-base-content/40 shrink-0" />
                        <input
                          type="text"
                          className="grow text-sm bg-transparent outline-none"
                          placeholder={t("profile:fields.address_placeholder")}
                          value={step1.address}
                          onChange={(e) => setStep1({ ...step1, address: e.target.value })}
                          disabled={isLocked}
                        />
                      </label>
                    </FormField>
                  </div>
                )}

                {/* ══ STEP 2 ══════════════════════════════ */}
                {currentStep === 2 && (
                  <div className="space-y-5">
                    {/* Subjects */}
                    <FormField
                      label={t("profile:fields.subjects")}
                      required
                      hint={t("profile:fields.subjects_hint")}
                    >
                      <div className="flex flex-wrap gap-2 p-3 rounded-xl border border-base-300 bg-base-200/40 min-h-[52px]">
                        {SUBJECT_OPTIONS.map((sub) => (
                          <button
                            key={sub}
                            type="button"
                            onClick={() => !isLocked && toggleSubject(sub)}
                            className={`badge badge-md cursor-pointer select-none transition-all ${
                              step2.subjects.includes(sub)
                                ? "badge-primary"
                                : "badge-ghost border border-base-300"
                            } ${isLocked ? "opacity-50 cursor-not-allowed" : "hover:badge-primary"}`}
                          >
                            {sub}
                          </button>
                        ))}
                      </div>
                    </FormField>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField label={t("profile:fields.tutoring_style")} required>
                        <select
                          className="select select-bordered select-sm w-full bg-base-100 focus:select-primary"
                          value={step2.tutoringStyle}
                          onChange={(e) => setStep2({ ...step2, tutoringStyle: e.target.value })}
                          disabled={isLocked}
                        >
                          <option value="">{t("profile:fields.select_style")}</option>
                          {TUTORING_STYLES.map((s) => (
                            <option key={s} value={s}>{t(`profile:style.${s}`)}</option>
                          ))}
                        </select>
                      </FormField>

                      <FormField label={t("profile:fields.timing_shift")}>
                        <select
                          className="select select-bordered select-sm w-full bg-base-100 focus:select-primary"
                          value={step2.timingShift}
                          onChange={(e) => setStep2({ ...step2, timingShift: e.target.value })}
                          disabled={isLocked}
                        >
                          <option value="">{t("profile:fields.select_shift")}</option>
                          {TIMING_SHIFTS.map((s) => (
                            <option key={s} value={s}>{t(`profile:timing.${s}`)}</option>
                          ))}
                        </select>
                      </FormField>

                      <FormField label={t("profile:fields.price_hour")} required>
                        <label className="input input-bordered input-sm flex items-center gap-2 bg-base-100 focus-within:border-primary">
                          <FiDollarSign size={14} className="text-base-content/40 shrink-0" />
                          <input
                            type="number" min={0}
                            className="grow text-sm bg-transparent outline-none"
                            placeholder="0.00"
                            value={step2.pricePerHour}
                            onChange={(e) => setStep2({ ...step2, pricePerHour: e.target.value })}
                            disabled={isLocked}
                          />
                        </label>
                      </FormField>

                      <FormField label={t("profile:fields.days_week")}>
                        <label className="input input-bordered input-sm flex items-center gap-2 bg-base-100 focus-within:border-primary">
                          <FiClock size={14} className="text-base-content/40 shrink-0" />
                          <input
                            type="number" min={1} max={7}
                            className="grow text-sm bg-transparent outline-none"
                            placeholder={t("profile:fields.days_placeholder")}
                            value={step2.daysPerWeek}
                            onChange={(e) => setStep2({ ...step2, daysPerWeek: e.target.value })}
                            disabled={isLocked}
                          />
                        </label>
                      </FormField>

                      <FormField label={t("profile:fields.experience")}>
                        <input
                          type="number" min={0}
                          className={inputCls}
                          placeholder={t("profile:fields.experience_placeholder")}
                          value={step2.experience}
                          onChange={(e) => setStep2({ ...step2, experience: e.target.value })}
                          disabled={isLocked}
                        />
                      </FormField>

                      <FormField label={t("profile:fields.tuition_duration")}>
                        <input
                          type="number" min={1}
                          className={inputCls}
                          placeholder={t("profile:fields.tuition_placeholder")}
                          value={step2.tuitionDuration}
                          onChange={(e) => setStep2({ ...step2, tuitionDuration: e.target.value })}
                          disabled={isLocked}
                        />
                      </FormField>
                    </div>

                    <FormField
                      label={t("profile:fields.preferred_areas")}
                      hint={t("profile:fields.preferred_areas_hint")}
                    >
                      <input
                        type="text"
                        className={inputCls}
                        placeholder={t("profile:fields.preferred_areas_placeholder")}
                        value={step2.preferredAreas}
                        onChange={(e) => setStep2({ ...step2, preferredAreas: e.target.value })}
                        disabled={isLocked}
                      />
                    </FormField>

                    <FormField
                      label={t("profile:fields.languages")}
                      hint={t("profile:fields.languages_hint")}
                    >
                      <input
                        type="text"
                        className={inputCls}
                        placeholder={t("profile:fields.languages_placeholder")}
                        value={step2.languages}
                        onChange={(e) => setStep2({ ...step2, languages: e.target.value })}
                        disabled={isLocked}
                      />
                    </FormField>
                  </div>
                )}

                {/* ══ STEP 3 ══════════════════════════════ */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField label={t("profile:fields.qualification")} required>
                        <input
                          type="text"
                          className={inputCls}
                          placeholder={t("profile:fields.qualification_placeholder")}
                          value={step3.qualification}
                          onChange={(e) => setStep3({ ...step3, qualification: e.target.value })}
                          disabled={isLocked}
                        />
                      </FormField>

                      <FormField
                        label={t("profile:fields.certificate")}
                        hint={t("profile:fields.certificate_hint")}
                      >
                        <input
                          type="text"
                          className={inputCls}
                          placeholder={t("profile:fields.certificate_placeholder")}
                          value={step3.certificate}
                          onChange={(e) => setStep3({ ...step3, certificate: e.target.value })}
                          disabled={isLocked}
                        />
                      </FormField>
                    </div>

                    {/* Education list */}
                    <div>
                      <p className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3">
                        {t("profile:fields.education_history")}
                      </p>

                      {educations.length > 0 ? (
                        <div className="space-y-2 mb-4">
                          {educations.map((edu) => (
                            <div
                              key={edu.id}
                              className="flex items-start justify-between gap-3 p-3 rounded-xl bg-base-200/60 border border-base-300"
                            >
                              <div className="min-w-0">
                                <p className="font-semibold text-sm text-base-content truncate">
                                  {edu.universityName}
                                </p>
                                <p className="text-xs text-base-content/50 mt-0.5">
                                  {edu.fieldOfStudy} · {edu.passingYear} · {edu.result}
                                </p>
                              </div>
                              {!isLocked && (
                                <button
                                  onClick={() => handleDeleteEducation(edu.id)}
                                  className="btn btn-ghost btn-xs text-error hover:bg-error/10"
                                >
                                  <FiTrash2 size={13} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-base-content/30 mb-4 italic">
                          {t("profile:fields.no_education")}
                        </p>
                      )}

                      {/* Add education form */}
                      {!isLocked && (
                        <div className="rounded-xl border border-dashed border-base-300 p-4 bg-base-200/30 space-y-3">
                          <p className="text-xs font-semibold text-base-content/50">
                            {t("profile:fields.add_education")}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <input
                              type="text"
                              className={inputCls}
                              placeholder={t("profile:fields.university")}
                              value={newEdu.universityName}
                              onChange={(e) => setNewEdu({ ...newEdu, universityName: e.target.value })}
                            />
                            <input
                              type="text"
                              className={inputCls}
                              placeholder={t("profile:fields.field")}
                              value={newEdu.fieldOfStudy}
                              onChange={(e) => setNewEdu({ ...newEdu, fieldOfStudy: e.target.value })}
                            />
                            <input
                              type="number"
                              className={inputCls}
                              placeholder={t("profile:fields.passing_year")}
                              value={newEdu.passingYear}
                              onChange={(e) => setNewEdu({ ...newEdu, passingYear: e.target.value })}
                            />
                            <input
                              type="text"
                              className={inputCls}
                              placeholder={t("profile:fields.result")}
                              value={newEdu.result}
                              onChange={(e) => setNewEdu({ ...newEdu, result: e.target.value })}
                            />
                          </div>
                          <button
                            onClick={handleAddEducation}
                            disabled={addingEdu}
                            className="btn btn-outline btn-primary btn-sm gap-2"
                          >
                            {addingEdu ? (
                              <span className="loading loading-spinner loading-xs" />
                            ) : (
                              <FiPlus size={14} />
                            )}
                            {t("profile:fields.add_record")}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ══ STEP 4 ══════════════════════════════ */}
                {currentStep === 4 && (
                  <div className="space-y-4">
                    {[
                      { key: "facebook", labelKey: "facebook", icon: FiFacebook, placeholderKey: "facebook_placeholder" },
                      { key: "twitter", labelKey: "twitter", icon: FiTwitter, placeholderKey: "twitter_placeholder" },
                      { key: "youtube", labelKey: "youtube", icon: FiYoutube, placeholderKey: "youtube_placeholder" },
                      { key: "instagram", labelKey: "instagram", icon: FiInstagram, placeholderKey: "instagram_placeholder" },
                    ].map(({ key, labelKey, icon: Icon, placeholderKey }) => (
                      <FormField key={key} label={t(`profile:fields.${labelKey}`)}>
                        <label className="input input-bordered input-sm flex items-center gap-2 bg-base-100 focus-within:border-primary">
                          <Icon size={14} className="text-base-content/40 shrink-0" />
                          <input
                            type="url"
                            className="grow text-sm bg-transparent outline-none"
                            placeholder={t(`profile:fields.${placeholderKey}`)}
                            value={social[key]}
                            onChange={(e) => setSocial({ ...social, [key]: e.target.value })}
                            disabled={isLocked}
                          />
                        </label>
                      </FormField>
                    ))}

                    {/* Submit section */}
                    {!isLocked && (
                      <div className="mt-6 p-4 rounded-2xl bg-success/10 border border-success/20">
                        <div className="flex items-start gap-3">
                          <FiCheckCircle className="text-success shrink-0 mt-0.5" size={16} />
                          <div className="flex-1">
                            <p className="font-semibold text-base-content text-sm">
                              {t("profile:submit.ready_title")}
                            </p>
                            <p className="text-xs text-base-content/50 mt-0.5">
                              {t("profile:submit.ready_desc")}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-3">
                              <button
                                onClick={handleSaveStep}
                                disabled={saving}
                                className="btn btn-outline btn-success btn-sm gap-2"
                              >
                                {saving
                                  ? <span className="loading loading-spinner loading-xs" />
                                  : <FiCheckCircle size={13} />}
                                {t("profile:submit.save")}
                              </button>
                              <button
                                onClick={handleSubmit}
                                disabled={submitLoading}
                                className="btn btn-success btn-sm gap-2"
                              >
                                {submitLoading
                                  ? <span className="loading loading-spinner loading-xs" />
                                  : <FiSend size={13} />}
                                {t("profile:submit.submit_review")}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Card footer — navigation ────────────────── */}
          {!loading && (
            <div className="px-6 py-4 border-t border-base-200 flex items-center justify-between gap-3 bg-base-200/30">
              <button
                onClick={() => navigate("/tutor/dashboard")}
                className="btn btn-ghost btn-sm gap-1 text-base-content/50"
              >
                <FiChevronLeft size={15} />
                {t("profile:nav.back_dashboard")}
              </button>

              <div className="flex items-center gap-2">
                {currentStep > 1 && (
                  <button
                    onClick={() => setCurrentStep((s) => s - 1)}
                    className="btn btn-outline btn-sm gap-1"
                  >
                    <FiChevronLeft size={14} /> {t("profile:nav.previous")}
                  </button>
                )}

                {currentStep < STEP_META.length ? (
                  <button
                    onClick={handleSaveAndNext}
                    disabled={saving || isLocked}
                    className="btn btn-primary btn-sm gap-1"
                  >
                    {saving
                      ? <span className="loading loading-spinner loading-xs" />
                      : (
                        <>
                          {t("profile:nav.save_next")} <FiChevronRight size={14} />
                        </>
                      )}
                  </button>
                ) : (
                  currentStep === STEP_META.length && isLocked && (
                    <button
                      onClick={() => navigate("/tutor/dashboard")}
                      className="btn btn-primary btn-sm"
                    >
                      {t("profile:nav.back_dashboard")}
                    </button>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TutorProfileEdit;
