import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5001/api",
  withCredentials: true,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) =>
    Promise.reject(new Error(err.response?.data?.message || "Có lỗi xảy ra")),
);

/** Lấy thông tin user hiện tại */
const getMe = () => API.get("/users/me");

/**
 * Cập nhật thông tin cá nhân
 * @param {{ name?, gender?, avatar? }} data
 */
const updateMe = (data) => API.patch("/users/me", data);

/**
 * Đổi mật khẩu
 * @param {{ currentPassword, newPassword }} data
 */
const changePassword = (data) => API.patch("/users/me/password", data);
const uploadAvatar = (file) => {
  const formData = new FormData();
  formData.append("avatar", file);
  return API.post("/users/me/avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const userApi = {
  getMe,
  updateMe,
  changePassword,
  uploadAvatar,
};
