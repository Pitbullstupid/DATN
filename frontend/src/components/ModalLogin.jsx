import React, { useState } from "react";
import logo from "../assets/logoDATN.png";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { Toaster } from "react-hot-toast";
import { FcGoogle } from "react-icons/fc";

const ModalLogin = ({ mode, onSwitchMode }) => {
  const { login, register } = useAuth();
  const [rememberMe, setRememberMe] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "STUDENT",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const closeModal = () => {
    document.getElementById("modal_login").close();
    setForm({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "STUDENT",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (mode === "signup" && form.password !== form.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        await toast.promise(
          login({ email: form.email, password: form.password }, rememberMe),
          {
            loading: "Đang đăng nhập...",
            success: null,
            error: (err) => err.response?.data?.message || "Đăng nhập thất bại",
          },
        );
      } else {
        await toast.promise(
          register({
            name: form.name,
            email: form.email,
            password: form.password,
            role: form.role,
          }),
          {
            loading: "Đang tạo tài khoản...",
            success: null,
            error: (err) => err.response?.data?.message || "Đăng ký thất bại",
          },
        );
      }
      closeModal();
    } finally {
      setLoading(false);
    }
  };

  return (
    <dialog id="modal_login" className="modal">
      <Toaster position="top-right" />
      <div className="modal-box max-w-3xl p-0 overflow-hidden">
        <div className="flex min-h-115">
          {/* Cột trái - Form */}
          <div className="flex-1 p-10 flex flex-col justify-center">
            {/* Logo */}
            <div className="flex items-center gap-2 mb-8">
              <img src={logo} alt="Logo" className="h-9 w-9" />
              <span className="text-xl font-semibold text-blue-700">
                TutorConnect
              </span>
            </div>

            <h2 className="text-2xl font-bold mb-6">
              {mode === "login" ? "Log in" : "Sign Up"}
            </h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {mode === "signup" && (
                <>
                  <label className="floating-label">
                    <span>Full Name *</span>
                    <input
                      type="text"
                      name="name"
                      placeholder="Full Name"
                      className="input input-bordered w-full"
                      value={form.name}
                      onChange={handleChange}
                    />
                  </label>

                  {/* Chọn role */}
                  <select
                    name="role"
                    className="select select-bordered w-full"
                    value={form.role}
                    onChange={handleChange}
                  >
                    <option value="STUDENT">Học sinh</option>
                    <option value="TUTOR">Gia sư</option>
                  </select>
                </>
              )}

              <label className="floating-label">
                <span>Email Address *</span>
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  className="input input-bordered w-full"
                  value={form.email}
                  onChange={handleChange}
                />
              </label>

              <label className="floating-label">
                <span>Password *</span>
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  className="input input-bordered w-full"
                  value={form.password}
                  onChange={handleChange}
                />
              </label>

              {mode === "signup" && (
                <label className="floating-label">
                  <span>Confirm Password *</span>
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    className="input input-bordered w-full"
                    value={form.confirmPassword}
                    onChange={handleChange}
                  />
                </label>
              )}

              {mode === "login" && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="text-sm">Remember me</span>
                </label>
              )}

              <button
                type="submit"
                className="btn btn-info w-full tracking-widest"
                disabled={loading}
              >
                {loading ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : mode === "login" ? (
                  "LOG IN"
                ) : (
                  "SIGN UP"
                )}
              </button>

              <button type="button" className="btn btn-outline w-full gap-2">
                  <FcGoogle size={20}/> Sign in with Google
                </button>

              <div className="flex justify-between text-sm">
                {mode === "login" ? (
                  <>
                    <a className="link link-error">Forgot password?</a>
                    <button
                      type="button"
                      className="link link-info"
                      onClick={() => {
                        onSwitchMode("signup");
                      }}
                    >
                      Don't have an account? Sign Up
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="link link-info"
                    onClick={() => {
                      onSwitchMode("login");
                    }}
                  >
                    Already have an account? Log in
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Cột phải - Illustration */}
          <div className="flex-1 bg-blue-50 hidden md:flex flex-col items-center justify-center p-8">
            <img src={logo} alt="illustration" className="w-64" />
            <p className="text-sm text-gray-500 mt-4 text-center">
              Copyright © <span className="text-blue-600">TutorConnect</span>{" "}
              2026.
            </p>
          </div>
        </div>

        {/* Nút đóng */}
        <button
          className="btn btn-sm  btn-circle btn-base absolute right-3 top-3"
          onClick={closeModal}
        >
          ✕
        </button>
      </div>

      {/* Backdrop */}
      <div className="modal-backdrop" onClick={closeModal} />
    </dialog>
  );
};

export default ModalLogin;
