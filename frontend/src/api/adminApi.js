import axios from "axios";

// ─── Axios instance (dùng chung với userApi) ──────────────────────────────────
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

// ─── Stats ────────────────────────────────────────────────────────────────────

/**
 * Tổng quan hệ thống
 * @returns {{ totalUsers, totalTutors, totalStudents, totalCourses,
 *             activeCourses, pendingApprovals, avgRating, totalReviews,
 *             totalRevenue, pendingPayouts }}
 */
const getStats = () => API.get("/admin/stats");

// ─── Users ────────────────────────────────────────────────────────────────────

/**
 * Danh sách người dùng
 * @param {{ page?, limit?, role?: "STUDENT"|"TUTOR", search? }} params
 */
const getUsers = (params = {}) => API.get("/admin/users", { params });

/**
 * Chi tiết 1 user
 * @param {string} id
 */
const getUserById = (id) => API.get(`/admin/users/${id}`);

/**
 * Khoá / mở khoá tài khoản (toggle)
 * @param {string} id
 */
const toggleSuspendUser = (id) => API.patch(`/admin/users/${id}/suspend`);

// ─── Tutor Approvals ──────────────────────────────────────────────────────────

/**
 * Danh sách hồ sơ gia sư chờ duyệt
 * @param {{ page?, limit?, status?: "PENDING"|"REVIEWING"|"APPROVED"|"REJECTED" }} params
 */
const getTutorApprovals = (params = {}) =>
  API.get("/admin/tutor-approvals", { params });

/**
 * Chi tiết hồ sơ gia sư (để admin xem trước khi duyệt)
 * @param {string} tutorProfileId
 */
const getTutorDetail = (tutorProfileId) =>
  API.get(`/admin/tutors/${tutorProfileId}`);

/**
 * Duyệt hồ sơ gia sư
 * @param {string} tutorProfileId
 */
const approveTutor = (tutorProfileId) =>
  API.patch(`/admin/tutors/${tutorProfileId}/approve`);

/**
 * Từ chối hồ sơ gia sư
 * @param {string} tutorProfileId
 * @param {string} adminNote  Lý do từ chối (bắt buộc điền cho gia sư biết)
 */
const rejectTutor = (tutorProfileId, adminNote = "") =>
  API.patch(`/admin/tutors/${tutorProfileId}/reject`, { adminNote });

// ─── Courses ──────────────────────────────────────────────────────────────────

/**
 * Danh sách khoá học toàn hệ thống
 * @param {{ page?, limit?, status?: CourseStatus, search? }} params
 * CourseStatus: "PENDING_PAYMENT" | "UPCOMING" | "ONGOING" | "COMPLETED" | "CANCELLED"
 */
const getCourses = (params = {}) => API.get("/admin/courses", { params });

/**
 * Chi tiết 1 khoá học
 * @param {string} courseId
 */
const getCourseById = (courseId) => API.get(`/admin/courses/${courseId}`);

// ─── Payments ─────────────────────────────────────────────────────────────────

/**
 * Danh sách giao dịch thanh toán
 * @param {{ page?, limit?, status?: "PENDING"|"PAID"|"RELEASED"|"REFUNDED"|"FAILED" }} params
 */
const getPayments = (params = {}) => API.get("/admin/payments", { params });

/**
 * Danh sách yêu cầu rút tiền của gia sư
 * @param {{ page?, limit?, status?: "PENDING"|"PROCESSING"|"COMPLETED"|"FAILED" }} params
 */
const getWithdrawals = (params = {}) =>
  API.get("/admin/withdrawals", { params });

/**
 * Xử lý yêu cầu rút tiền
 * @param {string} withdrawalId
 * @param {"PROCESSING"|"COMPLETED"|"FAILED"} status
 *   - PROCESSING: đang xử lý
 *   - COMPLETED:  đã chuyển tiền thành công
 *   - FAILED:     thất bại → tự động hoàn balance về ví gia sư
 */
const processWithdrawal = (withdrawalId, status) =>
  API.patch(`/admin/withdrawals/${withdrawalId}/process`, { status });

// ─── Reviews ──────────────────────────────────────────────────────────────────

/**
 * Danh sách đánh giá
 * @param {{ page?, limit?, flagged?: boolean }} params
 *   flagged=true → chỉ lấy review có rating <= 2
 */
const getReviews = (params = {}) => API.get("/admin/reviews", { params });

/**
 * Xoá đánh giá vi phạm (tự động tính lại rating gia sư)
 * @param {string} reviewId
 */
const deleteReview = (reviewId) => API.delete(`/admin/reviews/${reviewId}`);

// ─── Export ───────────────────────────────────────────────────────────────────
export const adminApi = {
  // Stats
  getStats,

  // Users
  getUsers,
  getUserById,
  toggleSuspendUser,

  // Tutor approvals
  getTutorApprovals,
  getTutorDetail,
  approveTutor,
  rejectTutor,

  // Courses
  getCourses,
  getCourseById,

  // Payments
  getPayments,
  getWithdrawals,
  processWithdrawal,

  // Reviews
  getReviews,
  deleteReview,
};
