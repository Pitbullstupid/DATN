// src/api/axiosInstance.js
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5001/api",
  withCredentials: true, // gửi cookie nếu dùng session/refresh token
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor: tự động gắn token vào header nếu có
axiosInstance.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: xử lý lỗi toàn cục
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      // Có thể redirect về trang chủ nếu cần
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
