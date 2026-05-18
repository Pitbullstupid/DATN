import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5001/api",
  withCredentials: true, // gửi cookie jwt tự động
});

// ─── Tự động đính kèm token từ localStorage (nếu dùng Bearer) ───
API.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Xử lý lỗi tập trung ────────────────────────────────────────
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại";
    return Promise.reject(new Error(message));
  }
);

// ================================================================
// PUBLIC
// ================================================================

/**
 * Lấy danh sách gia sư đã APPROVED
 * @param {Object} params - filter + phân trang
 * @param {string}  [params.subject]       - lọc theo môn học
 * @param {string}  [params.area]          - lọc theo khu vực
 * @param {number}  [params.minPrice]
 * @param {number}  [params.maxPrice]
 * @param {string}  [params.tutoringStyle] - ONE_ON_ONE | GROUP | BOTH
 * @param {string}  [params.timingShift]   - MORNING | AFTERNOON | EVENING | FLEXIBLE
 * @param {number}  [params.page]          - mặc định 1
 * @param {number}  [params.limit]         - mặc định 12
 */
export const getTutors = (params = {}) =>
  API.get("/tutors", { params });

/**
 * Xem profile công khai của 1 gia sư
 * @param {string} tutorProfileId
 */
export const getTutorById = (tutorProfileId) =>
  API.get(`/tutors/${tutorProfileId}`);

// ================================================================
// TUTOR (đã đăng nhập, role = TUTOR)
// ================================================================

/**
 * Lấy full profile của gia sư đang đăng nhập
 */
export const getMyProfile = () =>
  API.get("/tutors/me/profile");

/**
 * Cập nhật bước 1 – Thông tin cá nhân
 * @param {{ bio, phone, address, country }} data
 */
export const updateStep1 = (data) =>
  API.patch("/tutors/me/step1", data);

/**
 * Cập nhật bước 2 – Thông tin dạy học
 * @param {{
 *   subjects, preferredAreas, daysPerWeek,
 *   timingShift, pricePerHour, tutoringStyle,
 *   experience, tuitionDuration, languages
 * }} data
 */
export const updateStep2 = (data) =>
  API.patch("/tutors/me/step2", data);

/**
 * Cập nhật bước 3 – Bằng cấp
 * @param {{ qualification, certificate }} data
 */
export const updateStep3 = (data) =>
  API.patch("/tutors/me/step3", data);

/**
 * Cập nhật mạng xã hội
 * @param {{ facebook, twitter, youtube, instagram }} data
 */
export const updateSocialMedia = (data) =>
  API.patch("/tutors/me/social-media", data);

/**
 * Thêm 1 bản ghi học vấn
 * @param {{ universityName, fieldOfStudy, passingYear, result }} data
 */
export const addEducation = (data) =>
  API.post("/tutors/me/education", data);

/**
 * Xoá 1 bản ghi học vấn
 * @param {string} eduId
 */
export const deleteEducation = (eduId) =>
  API.delete(`/tutors/me/education/${eduId}`);

/**
 * Nộp hồ sơ để admin duyệt → status chuyển sang REVIEWING
 */
export const submitProfile = () =>
  API.post("/tutors/me/submit");