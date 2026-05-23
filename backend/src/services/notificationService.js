import { prisma } from "../config/db.js";

// ─────────────────────────────────────────────────────────────
// SSE CLIENT MANAGER
// Lưu danh sách các client đang kết nối SSE
// Map<userId, Response[]>
// ─────────────────────────────────────────────────────────────
const clients = new Map();

export const addClient = (userId, res) => {
  if (!clients.has(userId)) clients.set(userId, []);
  clients.get(userId).push(res);
};

export const removeClient = (userId, res) => {
  if (!clients.has(userId)) return;
  const updated = clients.get(userId).filter((r) => r !== res);
  if (updated.length === 0) clients.delete(userId);
  else clients.set(userId, updated);
};

// Push event đến 1 user cụ thể
const pushToUser = (userId, data) => {
  const userClients = clients.get(userId);
  if (!userClients?.length) return;
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  userClients.forEach((res) => {
    try { res.write(payload); }
    catch { /* client đã disconnect */ }
  });
};

// ─────────────────────────────────────────────────────────────
// NOTIFICATION FACTORY
// Tạo notification trong DB + push SSE ngay lập tức
// ─────────────────────────────────────────────────────────────
export const notify = async ({ userId, type, title, body, courseId, bookingId }) => {
  try {
    const notification = await prisma.notification.create({
      data: { userId, type, title, body, courseId: courseId || null, bookingId: bookingId || null },
    });

    // Push real-time nếu user đang online
    pushToUser(userId, {
      event: "notification",
      data:  notification,
    });

    return notification;
  } catch (err) {
    console.error("notify error:", err.message);
  }
};

// Push nhiều notification cùng lúc (vd: thông báo cho cả 2 người)
export const notifyMany = async (notifications) => {
  return Promise.all(notifications.map((n) => notify(n)));
};

// ─────────────────────────────────────────────────────────────
// HELPER FUNCTIONS — gọi từ controllers
// ─────────────────────────────────────────────────────────────

/** Khi student gửi booking */
export const notifyBookingReceived = (booking, tutorUserId) =>
  notify({
    userId:    tutorUserId,
    type:      "BOOKING_RECEIVED",
    title:     "Yêu cầu thuê gia sư mới",
    body:      `${booking.name} muốn học môn ${booking.subject}`,
    bookingId: booking.id,
  });

/** Khi tutor tạo lớp (accept booking) → student cần thanh toán */
export const notifyPaymentRequired = (course, studentId) =>
  notify({
    userId:   studentId,
    type:     "PAYMENT_REQUIRED",
    title:    "Thanh toán để bắt đầu học",
    body:     `Gia sư đã chấp nhận yêu cầu. Vui lòng thanh toán $${Number(course.totalPrice).toFixed(2)} để kích hoạt lớp "${course.subject}"`,
    courseId: course.id,
  });

/** Khi tutor reject booking */
export const notifyBookingRejected = (booking, studentId, tutorNote) =>
  notify({
    userId:    studentId,
    type:      "BOOKING_REJECTED",
    title:     "Yêu cầu không được chấp nhận",
    body:      tutorNote ? `Lý do: ${tutorNote}` : `Gia sư đã từ chối yêu cầu môn ${booking.subject}`,
    bookingId: booking.id,
  });

/** Khi student huỷ booking */
export const notifyBookingCancelled = (booking, tutorUserId) =>
  notify({
    userId:    tutorUserId,
    type:      "BOOKING_CANCELLED",
    title:     "Yêu cầu đã bị huỷ",
    body:      `${booking.name} đã huỷ yêu cầu học môn ${booking.subject}`,
    bookingId: booking.id,
  });

/** Khi thanh toán thành công — notify cả 2 */
export const notifyPaymentSuccess = async (course, studentId, tutorUserId) =>
  notifyMany([
    {
      userId:   studentId,
      type:     "PAYMENT_SUCCESS",
      title:    "Thanh toán thành công!",
      body:     `Lớp "${course.subject}" đã được kích hoạt. Gia sư sẽ liên hệ sớm.`,
      courseId: course.id,
    },
    {
      userId:   tutorUserId,
      type:     "PAYMENT_RECEIVED",
      title:    "Học viên đã thanh toán",
      body:     `$${Number(course.totalPrice).toFixed(2)} đang được giữ escrow cho lớp "${course.subject}"`,
      courseId: course.id,
    },
  ]);

/** Khi lớp bắt đầu */
export const notifyCourseStarted = (course, studentId) =>
  notify({
    userId:   studentId,
    type:     "COURSE_STARTED",
    title:    "Lớp học đã bắt đầu!",
    body:     `Gia sư đã bắt đầu lớp "${course.subject}". Chúc bạn học tốt!`,
    courseId: course.id,
  });

/** Khi tutor yêu cầu kết thúc */
export const notifyEndCourseRequested = (course, studentId) =>
  notify({
    userId:   studentId,
    type:     "END_COURSE_REQUESTED",
    title:    "Gia sư muốn kết thúc khóa học",
    body:     `Vui lòng xác nhận kết thúc lớp "${course.subject}" để giải phóng học phí.`,
    courseId: course.id,
  });

/** Khi student xác nhận kết thúc → báo tutor đang chờ xử lý */
export const notifyEndCourseWaiting = (course, tutorUserId) =>
  notify({
    userId:   tutorUserId,
    type:     "END_COURSE_WAITING",
    title:    "Học viên đã xác nhận kết thúc",
    body:     `Đang xử lý kết thúc lớp "${course.subject}"`,
    courseId: course.id,
  });

/** Khi khóa học hoàn thành + tiền được giải phóng */
export const notifyCourseCompleted = async (course, studentId, tutorUserId) =>
  notifyMany([
    {
      userId:   studentId,
      type:     "COURSE_COMPLETED",
      title:    "Khóa học hoàn thành!",
      body:     `Lớp "${course.subject}" đã kết thúc. Hãy để lại đánh giá cho gia sư nhé!`,
      courseId: course.id,
    },
    {
      userId:   tutorUserId,
      type:     "PAYMENT_RELEASED",
      title:    "Học phí đã được giải phóng!",
      body:     `$${Number(course.totalPrice).toFixed(2)} từ lớp "${course.subject}" đã vào ví của bạn.`,
      courseId: course.id,
    },
  ]);

/** Khi buổi học được cả 2 xác nhận */
export const notifySessionConfirmed = (session, courseSubject, studentId, tutorUserId) =>
  notifyMany([
    {
      userId:   studentId,
      type:     "SESSION_CONFIRMED",
      title:    "Buổi học đã xác nhận",
      body:     `Buổi ${session.sessionNumber} môn "${courseSubject}" đã được ghi nhận hoàn thành.`,
      courseId: session.courseClassId,
    },
    {
      userId:   tutorUserId,
      type:     "SESSION_CONFIRMED",
      title:    "Buổi học đã xác nhận",
      body:     `Buổi ${session.sessionNumber} môn "${courseSubject}" đã được ghi nhận hoàn thành.`,
      courseId: session.courseClassId,
    },
  ]);

/** Khi 1 bên xác nhận buổi học, chờ bên kia */
export const notifySessionConfirmWait = (session, courseSubject, waitingUserId, confirmedByRole) =>
  notify({
    userId:   waitingUserId,
    type:     "SESSION_CONFIRM_WAIT",
    title:    `${confirmedByRole === "TUTOR" ? "Gia sư" : "Học viên"} đã xác nhận buổi học`,
    body:     `Vui lòng xác nhận buổi ${session.sessionNumber} môn "${courseSubject}" để hoàn tất.`,
    courseId: session.courseClassId,
  });

/** Khi lớp bị huỷ */
export const notifyCourseCAncelled = async (course, studentId, tutorUserId, cancelledBy) =>
  notifyMany([
    {
      userId:   studentId,
      type:     "COURSE_CANCELLED",
      title:    "Lớp học đã bị huỷ",
      body:     `Lớp "${course.subject}" đã bị huỷ bởi ${cancelledBy === "TUTOR" ? "gia sư" : "học viên"}.${
        course.payment?.status === "PAID" 
          ? cancelledBy === "TUTOR" 
            ? " Học phí sẽ được hoàn lại."
            : " Học phí sẽ được cộng cho gia sư."
          : ""
      }`,
      courseId: course.id,
    },
    {
      userId:   tutorUserId,
      type:     "COURSE_CANCELLED",
      title:    "Lớp học đã bị huỷ",
      body:     `Lớp "${course.subject}" đã bị huỷ bởi ${cancelledBy === "STUDENT" ? "học viên" : "bạn"}.${
        course.payment?.status === "PAID"
          ? cancelledBy === "STUDENT"
            ? " Học phí sẽ được cộng vào ví của bạn."
            : " Học phí sẽ được hoàn lại cho học viên."
          : ""
      }`,
      courseId: course.id,
    },
  ]);