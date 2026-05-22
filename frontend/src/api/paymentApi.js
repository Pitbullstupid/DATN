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
  requestWithdrawal: (amount) =>
    axiosInstance.post("/payments/withdraw", { amount }),
};