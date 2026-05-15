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

API.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại";
    return Promise.reject(new Error(message));
  },
);

// ── Student ──────────────────────────────────────────────────────────────────

/**
 * Gửi yêu cầu thuê gia sư
 * @param {{ tutorProfileId, name, email, subject, message }} data
 */
export const createBooking = (data) => API.post("/bookings", data);

/**
 * Xem danh sách booking của student
 * @param {{ status?, page?, limit? }} params
 */
export const getMyBookingsAsStudent = (params = {}) =>
  API.get("/bookings/student", { params });

/**
 * Huỷ booking (chỉ khi PENDING)
 * @param {string} id
 */
export const cancelBooking = (id) => API.patch(`/bookings/${id}/cancel`);

// ── Tutor ────────────────────────────────────────────────────────────────────

/**
 * Xem danh sách booking gửi đến tutor
 * @param {{ status?, page?, limit? }} params
 */
export const getMyBookingsAsTutor = (params = {}) =>
  API.get("/bookings/tutor", { params });

/**
 * Chấp nhận booking → tạo ClassSession
 * @param {string} id
 * @param {{ scheduledAt, durationMin?, tutorNote? }} data
 */
export const acceptBooking = (id, data) =>
  API.patch(`/bookings/${id}/accept`, data);

/**
 * Từ chối booking
 * @param {string} id
 * @param {{ tutorNote? }} data
 */
export const rejectBooking = (id, data) =>
  API.patch(`/bookings/${id}/reject`, data);

// ── Chung ────────────────────────────────────────────────────────────────────

/**
 * Xem chi tiết 1 booking
 * @param {string} id
 */
export const getBookingById = (id) => API.get(`/bookings/${id}`);
