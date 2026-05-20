import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FiUser,
  FiMail,
  FiCamera,
  FiSave,
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowLeft,
  FiCheck,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { userApi } from "../api/userApi";

// ─── Constants ────────────────────────────────────────────────────────────────
const GENDER_OPTIONS = [
  { label: "Không chỉ định", value: "" },
  { label: "Nam", value: "male" },
  { label: "Nữ", value: "female" },
  { label: "Khác", value: "other" },
];

// ─── Avatar preview ───────────────────────────────────────────────────────────
const AvatarUpload = ({ value, name, onChange, refreshUser }) => {
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(value || "");

  useEffect(() => {
    setPreview(value || "");
  }, [value]);

const handleFile = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    toast.error("Chỉ hỗ trợ ảnh JPG, JPEG, PNG hoặc WEBP");
    return;
  }
  if (file.size > 2 * 1024 * 1024) { toast.error("Ảnh không được vượt quá 2MB"); return; }

  // Preview ngay lập tức
  const objectUrl = URL.createObjectURL(file);
  setPreview(objectUrl);

  try {
    const res = await userApi.uploadAvatar(file);
    const avatarUrl = res.data?.data?.user?.avatar;
    onChange(avatarUrl); // truyền URL Cloudinary lên form
    await refreshUser(); // cập nhật context
    toast.success("Tải ảnh lên thành công!");
  } catch (err) {
    toast.error(err.message);
    setPreview(value || ""); // rollback preview
  }
};

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        {preview ? (
          <img
            src={preview}
            alt={name}
            className="w-24 h-24 rounded-full object-cover ring-4 ring-secondary/20"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-secondary/10 ring-4 ring-secondary/20 flex items-center justify-center text-secondary">
            <FiUser size={36} />
          </div>
        )}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="absolute bottom-0 right-0 w-8 h-8 bg-secondary text-secondary-content rounded-full flex items-center justify-center shadow-md hover:bg-secondary/80 transition-colors"
        >
          <FiCamera size={14} />
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
      {preview && (
        <button
          type="button"
          onClick={() => {
            setPreview("");
            onChange("");
          }}
          className="text-xs text-error hover:underline"
        >
          Xoá ảnh
        </button>
      )}
    </div>
  );
};

// ─── Password field ───────────────────────────────────────────────────────────
const PasswordField = ({
  label,
  name,
  value,
  onChange,
  error,
  placeholder,
}) => {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="text-sm font-medium text-base-content mb-1 block">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`input input-bordered w-full pr-10 focus:outline-none focus:border-secondary ${
            error ? "input-error" : ""
          }`}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
        >
          {show ? <FiEyeOff size={16} /> : <FiEye size={16} />}
        </button>
      </div>
      {error && <p className="text-error text-xs mt-1">{error}</p>}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StudentEditProfilePage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  // ── Profile form state ────────────────────────────────────
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    gender: "",
    avatar: "",
  });
  const [profileErrors, setProfileErrors] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // ── Password form state ───────────────────────────────────
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [savingPassword, setSavingPassword] = useState(false);

  const [loadingUser, setLoadingUser] = useState(true);

  // ── Fetch current user ────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await userApi.getMe();
        const u = res.data?.data?.user;
        if (u) {
          setProfile({
            name: u.name || "",
            email: u.email || "",
            gender: u.gender || "",
            avatar: u.avatar || "",
          });
        }
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoadingUser(false);
      }
    })();
  }, []);

  // ── Profile handlers ──────────────────────────────────────
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile((p) => ({ ...p, [name]: value }));
    if (profileErrors[name]) setProfileErrors((e) => ({ ...e, [name]: "" }));
    setProfileSaved(false);
  };

  const validateProfile = () => {
    const errs = {};
    if (!profile.name.trim()) errs.name = "Tên không được để trống";
    return errs;
  };

  const handleSaveProfile = async () => {
    const errs = validateProfile();
    if (Object.keys(errs).length) {
      setProfileErrors(errs);
      return;
    }

    setSavingProfile(true);
    try {
      await userApi.updateMe({
        name: profile.name.trim(),
        gender: profile.gender || null,
        avatar: profile.avatar || null,
      });
      await refreshUser();
      setProfileSaved(true);
      toast.success("Cập nhật thông tin thành công!");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  // ── Password handlers ─────────────────────────────────────
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords((p) => ({ ...p, [name]: value }));
    if (passwordErrors[name]) setPasswordErrors((e) => ({ ...e, [name]: "" }));
  };

  const validatePasswords = () => {
    const errs = {};
    if (!passwords.currentPassword)
      errs.currentPassword = "Nhập mật khẩu hiện tại";
    if (!passwords.newPassword) errs.newPassword = "Nhập mật khẩu mới";
    else if (passwords.newPassword.length < 6)
      errs.newPassword = "Mật khẩu mới phải có ít nhất 6 ký tự";
    if (!passwords.confirmPassword)
      errs.confirmPassword = "Xác nhận mật khẩu mới";
    else if (passwords.newPassword !== passwords.confirmPassword)
      errs.confirmPassword = "Mật khẩu xác nhận không khớp";
    if (
      passwords.currentPassword &&
      passwords.newPassword &&
      passwords.currentPassword === passwords.newPassword
    )
      errs.newPassword = "Mật khẩu mới phải khác mật khẩu cũ";
    return errs;
  };

  const handleSavePassword = async () => {
    const errs = validatePasswords();
    if (Object.keys(errs).length) {
      setPasswordErrors(errs);
      return;
    }

    setSavingPassword(true);
    try {
      await userApi.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      toast.success("Đổi mật khẩu thành công!");
      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingPassword(false);
    }
  };

  // ── Render ────────────────────────────────────────────────
  if (loadingUser)
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-secondary" />
      </div>
    );

  return (
    <div className="min-h-screen bg-base-200">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            className="btn btn-ghost btn-sm btn-circle"
            onClick={() => navigate(-1)}
          >
            <FiArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-base-content">
              Chỉnh sửa hồ sơ
            </h1>
            <p className="text-base-content/50 text-sm">
              Cập nhật thông tin cá nhân của bạn
            </p>
          </div>
        </div>

        <div className="space-y-5">
          {/* ── Profile info card ─────────────────────────── */}
          <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-base-200 flex items-center gap-2">
              <FiUser size={16} className="text-secondary" />
              <h2 className="font-bold text-base-content">Thông tin cá nhân</h2>
            </div>

            <div className="p-6 space-y-5">
              {/* Avatar */}
              <div className="flex justify-center">
                <AvatarUpload
                  value={profile.avatar}
                  name={profile.name}
                  refreshUser={refreshUser}
                  onChange={(url) => {
                    setProfile((p) => ({ ...p, avatar: url }));
                    setProfileSaved(false);
                  }}
                />
              </div>

              {/* Name */}
              <div>
                <label className="text-sm font-medium text-base-content mb-1 block">
                  Họ và tên <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={profile.name}
                  onChange={handleProfileChange}
                  placeholder="Nhập họ và tên"
                  className={`input input-bordered w-full focus:outline-none focus:border-secondary ${
                    profileErrors.name ? "input-error" : ""
                  }`}
                />
                {profileErrors.name && (
                  <p className="text-error text-xs mt-1">
                    {profileErrors.name}
                  </p>
                )}
              </div>

              {/* Email — readonly */}
              <div>
                <label className="text-sm font-medium text-base-content mb-1 block">
                  Email
                  <span className="text-base-content/40 font-normal ml-1">
                    (không thể thay đổi)
                  </span>
                </label>
                <div className="relative">
                  <FiMail
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/30"
                    size={15}
                  />
                  <input
                    type="email"
                    value={profile.email}
                    readOnly
                    className="input input-bordered w-full pl-9 bg-base-200/50 cursor-not-allowed text-base-content/60"
                  />
                </div>
              </div>

              {/* Gender */}
              <div>
                <label className="text-sm font-medium text-base-content mb-1 block">
                  Giới tính
                </label>
                <div className="flex gap-3 flex-wrap">
                  {GENDER_OPTIONS.map(({ label, value }) => (
                    <label
                      key={value}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer transition-all text-sm ${
                        profile.gender === value
                          ? "border-secondary bg-secondary/10 text-secondary font-medium"
                          : "border-base-300 text-base-content/60 hover:border-secondary/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="gender"
                        value={value}
                        checked={profile.gender === value}
                        onChange={handleProfileChange}
                        className="hidden"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Save button */}
              <button
                className={`btn w-full gap-2 ${profileSaved ? "btn-success" : "btn-secondary"}`}
                onClick={handleSaveProfile}
                disabled={savingProfile}
              >
                {savingProfile ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : profileSaved ? (
                  <FiCheck size={16} />
                ) : (
                  <FiSave size={16} />
                )}
                {savingProfile
                  ? "Đang lưu..."
                  : profileSaved
                    ? "Đã lưu!"
                    : "Lưu thông tin"}
              </button>
            </div>
          </div>

          {/* ── Change password card ───────────────────────── */}
          <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-base-200 flex items-center gap-2">
              <FiLock size={16} className="text-secondary" />
              <h2 className="font-bold text-base-content">Đổi mật khẩu</h2>
            </div>

            <div className="p-6 space-y-4">
              <PasswordField
                label="Mật khẩu hiện tại"
                name="currentPassword"
                value={passwords.currentPassword}
                onChange={handlePasswordChange}
                error={passwordErrors.currentPassword}
                placeholder="Nhập mật khẩu hiện tại"
              />
              <PasswordField
                label="Mật khẩu mới"
                name="newPassword"
                value={passwords.newPassword}
                onChange={handlePasswordChange}
                error={passwordErrors.newPassword}
                placeholder="Ít nhất 6 ký tự"
              />
              <PasswordField
                label="Xác nhận mật khẩu mới"
                name="confirmPassword"
                value={passwords.confirmPassword}
                onChange={handlePasswordChange}
                error={passwordErrors.confirmPassword}
                placeholder="Nhập lại mật khẩu mới"
              />

              {/* Strength hint */}
              {passwords.newPassword && (
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4].map((level) => {
                    const strength =
                      passwords.newPassword.length >= 12
                        ? 4
                        : passwords.newPassword.length >= 10
                          ? 3
                          : passwords.newPassword.length >= 6
                            ? 2
                            : 1;
                    return (
                      <div
                        key={level}
                        className={`h-1.5 flex-1 rounded-full transition-all ${
                          level <= strength
                            ? strength >= 4
                              ? "bg-success"
                              : strength >= 3
                                ? "bg-warning"
                                : strength >= 2
                                  ? "bg-info"
                                  : "bg-error"
                            : "bg-base-300"
                        }`}
                      />
                    );
                  })}
                  <span className="text-xs text-base-content/40 ml-1">
                    {
                      ["", "Yếu", "Trung bình", "Mạnh", "Rất mạnh"][
                        passwords.newPassword.length >= 12
                          ? 4
                          : passwords.newPassword.length >= 10
                            ? 3
                            : passwords.newPassword.length >= 6
                              ? 2
                              : 1
                      ]
                    }
                  </span>
                </div>
              )}

              <button
                className="btn btn-secondary w-full gap-2"
                onClick={handleSavePassword}
                disabled={savingPassword}
              >
                {savingPassword ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  <FiLock size={15} />
                )}
                {savingPassword ? "Đang đổi..." : "Đổi mật khẩu"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
