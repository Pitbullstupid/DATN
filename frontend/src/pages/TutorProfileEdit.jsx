import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiUser, FiBook, FiAward, FiShare2, FiGlobe,
  FiPhone, FiMapPin, FiDollarSign, FiClock,
  FiPlus, FiTrash2, FiChevronLeft, FiChevronRight,
  FiSend, FiCheckCircle, FiAlertCircle, FiInfo,
  FiLinkedin, FiFacebook, FiTwitter, FiYoutube, FiInstagram,
} from "react-icons/fi";
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

// ─── Constants ────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: "Personal Info",   icon: FiUser  },
  { id: 2, label: "Teaching Info",   icon: FiBook  },
  { id: 3, label: "Qualification",   icon: FiAward },
  { id: 4, label: "Social Media",    icon: FiShare2},
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

// ═════════════════════════════════════════════════════════════
const TutorProfileEdit = () => {
  const navigate = useNavigate();

  // ── State ─────────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState(1);
  const [loading,  setLoading ] = useState(true);
  const [saving,   setSaving  ] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [toast,    setToast   ] = useState(null); // { type, msg }
  const [profileStatus, setProfileStatus] = useState("PENDING");

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
        showToast("error", "Could not load profile data.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Toast ────────────────────────────────────────────────
  const showToast = useCallback((type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ── Locked guard ─────────────────────────────────────────
  const isLocked = ["REVIEWING", "APPROVED", "SUSPENDED"].includes(profileStatus);

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
      showToast("success", "Saved successfully!");
    } catch (err) {
      showToast("error", err.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndNext = async () => {
    await handleSaveStep();
    if (currentStep < STEPS.length) setCurrentStep((s) => s + 1);
  };

  // ── Education handlers ───────────────────────────────────
  const handleAddEducation = async () => {
    if (!newEdu.universityName || !newEdu.fieldOfStudy || !newEdu.passingYear || !newEdu.result) {
      showToast("error", "Please fill in all education fields.");
      return;
    }
    setAddingEdu(true);
    try {
      const { data } = await addEducation({ ...newEdu, passingYear: Number(newEdu.passingYear) });
      setEducations((prev) => [...prev, data.data.education]);
      setNewEdu({ universityName: "", fieldOfStudy: "", passingYear: "", result: "" });
      showToast("success", "Education record added.");
    } catch (err) {
      showToast("error", err.message || "Failed to add education.");
    } finally {
      setAddingEdu(false);
    }
  };

  const handleDeleteEducation = async (eduId) => {
    try {
      await deleteEducation(eduId);
      setEducations((prev) => prev.filter((e) => e.id !== eduId));
      showToast("success", "Education record removed.");
    } catch (err) {
      showToast("error", err.message || "Failed to delete.");
    }
  };

  // ── Submit profile ───────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitLoading(true);
    try {
      await submitProfile();
      setProfileStatus("REVIEWING");
      showToast("success", "Profile submitted for review!");
      setTimeout(() => navigate("/tutor/dashboard"), 1500);
    } catch (err) {
      showToast("error", err.message || "Submission failed.");
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
            Tutor Portal
          </p>
          <h1 className="text-primary-content text-3xl font-bold">Edit Profile</h1>
        </div>
      </div>

      {/* Locked banner */}
      {!loading && isLocked && (
        <div className="max-w-3xl mx-auto px-4 mt-6">
          <div className="alert alert-warning rounded-2xl shadow-sm">
            <FiAlertCircle size={16} />
            <span>
              Your profile is currently <strong>{profileStatus}</strong> and cannot be edited.
            </span>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-20">

        {/* ── Step indicator ─────────────────────────────── */}
        <div className="bg-base-100 rounded-2xl border border-base-300 shadow-sm p-4 mb-6">
          <ul className="steps steps-horizontal w-full">
            {STEPS.map((step) => (
              <li
                key={step.id}
                className={`step text-xs cursor-pointer transition-colors ${
                  currentStep >= step.id ? "step-primary" : ""
                }`}
                onClick={() => setCurrentStep(step.id)}
              >
                {step.label}
              </li>
            ))}
          </ul>
        </div>

        {/* ── Form card ──────────────────────────────────── */}
        <div className="bg-base-100 rounded-2xl border border-base-300 shadow-sm overflow-hidden">

          {/* Card header */}
          <div className="h-1 w-full bg-primary" />
          <div className="px-6 py-5 border-b border-base-200 flex items-center gap-3">
            {React.createElement(STEPS[currentStep - 1].icon, {
              size: 18,
              className: "text-primary",
            })}
            <div>
              <h2 className="font-bold text-base-content text-base">
                Step {currentStep}: {STEPS[currentStep - 1].label}
              </h2>
              <p className="text-xs text-base-content/40 mt-0.5">
                {currentStep === 1 && "Basic personal information visible on your public profile"}
                {currentStep === 2 && "Teaching preferences, pricing and availability"}
                {currentStep === 3 && "Qualifications, certificates and academic background"}
                {currentStep === 4 && "Optional social media links"}
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
                    <FormField label="Bio" hint="Describe yourself to potential students">
                      <textarea
                        className={textareaCls}
                        placeholder="Tell students about your teaching style, experience, and passion..."
                        value={step1.bio}
                        onChange={(e) => setStep1({ ...step1, bio: e.target.value })}
                        disabled={isLocked}
                      />
                    </FormField>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField label="Phone" required>
                        <label className="input input-bordered input-sm flex items-center gap-2 bg-base-100 focus-within:border-primary">
                          <FiPhone size={14} className="text-base-content/40 shrink-0" />
                          <input
                            type="tel"
                            className="grow text-sm bg-transparent outline-none"
                            placeholder="e.g. 0901234567"
                            value={step1.phone}
                            onChange={(e) => setStep1({ ...step1, phone: e.target.value })}
                            disabled={isLocked}
                          />
                        </label>
                      </FormField>

                      <FormField label="Country">
                        <label className="input input-bordered input-sm flex items-center gap-2 bg-base-100 focus-within:border-primary">
                          <FiGlobe size={14} className="text-base-content/40 shrink-0" />
                          <input
                            type="text"
                            className="grow text-sm bg-transparent outline-none"
                            placeholder="e.g. Vietnam"
                            value={step1.country}
                            onChange={(e) => setStep1({ ...step1, country: e.target.value })}
                            disabled={isLocked}
                          />
                        </label>
                      </FormField>
                    </div>

                    <FormField label="Address">
                      <label className="input input-bordered input-sm flex items-center gap-2 bg-base-100 focus-within:border-primary">
                        <FiMapPin size={14} className="text-base-content/40 shrink-0" />
                        <input
                          type="text"
                          className="grow text-sm bg-transparent outline-none"
                          placeholder="Your city or district"
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
                    <FormField label="Subjects" required hint="Pick all subjects you can teach">
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
                      <FormField label="Tutoring Style" required>
                        <select
                          className="select select-bordered select-sm w-full bg-base-100 focus:select-primary"
                          value={step2.tutoringStyle}
                          onChange={(e) => setStep2({ ...step2, tutoringStyle: e.target.value })}
                          disabled={isLocked}
                        >
                          <option value="">Select style</option>
                          {TUTORING_STYLES.map((s) => (
                            <option key={s} value={s}>{s.replace("_", " ")}</option>
                          ))}
                        </select>
                      </FormField>

                      <FormField label="Timing Shift">
                        <select
                          className="select select-bordered select-sm w-full bg-base-100 focus:select-primary"
                          value={step2.timingShift}
                          onChange={(e) => setStep2({ ...step2, timingShift: e.target.value })}
                          disabled={isLocked}
                        >
                          <option value="">Select shift</option>
                          {TIMING_SHIFTS.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </FormField>

                      <FormField label="Price / Hour (USD)" required>
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

                      <FormField label="Days / Week">
                        <label className="input input-bordered input-sm flex items-center gap-2 bg-base-100 focus-within:border-primary">
                          <FiClock size={14} className="text-base-content/40 shrink-0" />
                          <input
                            type="number" min={1} max={7}
                            className="grow text-sm bg-transparent outline-none"
                            placeholder="1 – 7"
                            value={step2.daysPerWeek}
                            onChange={(e) => setStep2({ ...step2, daysPerWeek: e.target.value })}
                            disabled={isLocked}
                          />
                        </label>
                      </FormField>

                      <FormField label="Experience (years)">
                        <input
                          type="number" min={0}
                          className={inputCls}
                          placeholder="e.g. 3"
                          value={step2.experience}
                          onChange={(e) => setStep2({ ...step2, experience: e.target.value })}
                          disabled={isLocked}
                        />
                      </FormField>

                      <FormField label="Tuition Duration (months)">
                        <input
                          type="number" min={1}
                          className={inputCls}
                          placeholder="e.g. 6"
                          value={step2.tuitionDuration}
                          onChange={(e) => setStep2({ ...step2, tuitionDuration: e.target.value })}
                          disabled={isLocked}
                        />
                      </FormField>
                    </div>

                    <FormField label="Preferred Areas" hint="Comma separated, e.g. Hanoi, Ho Chi Minh">
                      <input
                        type="text"
                        className={inputCls}
                        placeholder="Hanoi, District 1, ..."
                        value={step2.preferredAreas}
                        onChange={(e) => setStep2({ ...step2, preferredAreas: e.target.value })}
                        disabled={isLocked}
                      />
                    </FormField>

                    <FormField label="Languages" hint="Comma separated, e.g. Vietnamese, English">
                      <input
                        type="text"
                        className={inputCls}
                        placeholder="Vietnamese, English, ..."
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
                      <FormField label="Highest Qualification" required>
                        <input
                          type="text"
                          className={inputCls}
                          placeholder="e.g. Bachelor of Science"
                          value={step3.qualification}
                          onChange={(e) => setStep3({ ...step3, qualification: e.target.value })}
                          disabled={isLocked}
                        />
                      </FormField>

                      <FormField label="Certificate" hint="Any teaching certificate or license">
                        <input
                          type="text"
                          className={inputCls}
                          placeholder="e.g. IELTS 8.0, TESOL"
                          value={step3.certificate}
                          onChange={(e) => setStep3({ ...step3, certificate: e.target.value })}
                          disabled={isLocked}
                        />
                      </FormField>
                    </div>

                    {/* Education list */}
                    <div>
                      <p className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-3">
                        Education History
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
                          No education records yet.
                        </p>
                      )}

                      {/* Add education form */}
                      {!isLocked && (
                        <div className="rounded-xl border border-dashed border-base-300 p-4 bg-base-200/30 space-y-3">
                          <p className="text-xs font-semibold text-base-content/50">
                            Add Education Record
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <input
                              type="text"
                              className={inputCls}
                              placeholder="University name"
                              value={newEdu.universityName}
                              onChange={(e) => setNewEdu({ ...newEdu, universityName: e.target.value })}
                            />
                            <input
                              type="text"
                              className={inputCls}
                              placeholder="Field of study"
                              value={newEdu.fieldOfStudy}
                              onChange={(e) => setNewEdu({ ...newEdu, fieldOfStudy: e.target.value })}
                            />
                            <input
                              type="number"
                              className={inputCls}
                              placeholder="Passing year"
                              value={newEdu.passingYear}
                              onChange={(e) => setNewEdu({ ...newEdu, passingYear: e.target.value })}
                            />
                            <input
                              type="text"
                              className={inputCls}
                              placeholder="Result / GPA"
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
                            Add Record
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
                      { key: "facebook",  label: "Facebook",  icon: FiFacebook,  placeholder: "https://facebook.com/yourpage" },
                      { key: "twitter",   label: "Twitter / X",icon: FiTwitter,  placeholder: "https://twitter.com/handle"    },
                      { key: "youtube",   label: "YouTube",   icon: FiYoutube,   placeholder: "https://youtube.com/channel"   },
                      { key: "instagram", label: "Instagram", icon: FiInstagram, placeholder: "https://instagram.com/handle"  },
                    ].map(({ key, label, icon: Icon, placeholder }) => (
                      <FormField key={key} label={label}>
                        <label className="input input-bordered input-sm flex items-center gap-2 bg-base-100 focus-within:border-primary">
                          <Icon size={14} className="text-base-content/40 shrink-0" />
                          <input
                            type="url"
                            className="grow text-sm bg-transparent outline-none"
                            placeholder={placeholder}
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
                              Ready to submit?
                            </p>
                            <p className="text-xs text-base-content/50 mt-0.5">
                              Save your social media links, then submit your profile for admin review.
                              You won't be able to edit while it's under review.
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
                                Save
                              </button>
                              <button
                                onClick={handleSubmit}
                                disabled={submitLoading}
                                className="btn btn-success btn-sm gap-2"
                              >
                                {submitLoading
                                  ? <span className="loading loading-spinner loading-xs" />
                                  : <FiSend size={13} />}
                                Submit for Review
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
                Back to Dashboard
              </button>

              <div className="flex items-center gap-2">
                {currentStep > 1 && (
                  <button
                    onClick={() => setCurrentStep((s) => s - 1)}
                    className="btn btn-outline btn-sm gap-1"
                  >
                    <FiChevronLeft size={14} /> Previous
                  </button>
                )}

                {currentStep < STEPS.length ? (
                  <button
                    onClick={handleSaveAndNext}
                    disabled={saving || isLocked}
                    className="btn btn-primary btn-sm gap-1"
                  >
                    {saving
                      ? <span className="loading loading-spinner loading-xs" />
                      : <>Save & Next <FiChevronRight size={14} /></>}
                  </button>
                ) : (
                  currentStep === STEPS.length && isLocked && (
                    <button
                      onClick={() => navigate("/tutor/dashboard")}
                      className="btn btn-primary btn-sm"
                    >
                      Back to Dashboard
                    </button>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Toast notification ───────────────────────────── */}
      {toast && (
        <div className="toast toast-top toast-end z-50">
          <div className={`alert shadow-lg ${toast.type === "success" ? "alert-success" : "alert-error"}`}>
            {toast.type === "success"
              ? <FiCheckCircle size={15} />
              : <FiAlertCircle size={15} />}
            <span className="text-sm">{toast.msg}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TutorProfileEdit;