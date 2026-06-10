import axiosInstance from "./axiosInstance.js";

export const paymentApi = {
  /** Student tạo checkout session → nhận Stripe URL */
  createCheckout: (courseId) =>
    axiosInstance.post(`/payments/checkout/${courseId}`),

  /** Xác nhận sau khi Stripe redirect về */
  verifyPayment: (sessionId) =>
    axiosInstance.get(`/payments/success?session_id=${sessionId}`),

  /** Xem trạng thái thanh toán của khóa học */
  getPaymentByCourse: (courseId) =>
    axiosInstance.get(`/payments/course/${courseId}`),

  /** Tutor xem ví */
  getMyWallet: () =>
    axiosInstance.get("/payments/wallet"),

  /** Tutor yêu cầu rút tiền */
  requestWithdrawal: (amount, bankAccountId) =>
    axiosInstance.post("/payments/withdraw", { amount, bankAccountId }),

  // ── Bank accounts ──────────────────────────────────────────

  /** Lấy danh sách tài khoản ngân hàng */
  getBankAccounts: () =>
    axiosInstance.get("/payments/bank-accounts"),

  /** Thêm tài khoản ngân hàng mới */
  createBankAccount: (data) =>
    axiosInstance.post("/payments/bank-accounts", data),

  /** Cập nhật tài khoản ngân hàng */
  updateBankAccount: (id, data) =>
    axiosInstance.patch(`/payments/bank-accounts/${id}`, data),

  /** Xoá tài khoản ngân hàng */
  deleteBankAccount: (id) =>
    axiosInstance.delete(`/payments/bank-accounts/${id}`),
};