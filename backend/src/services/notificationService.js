import { prisma } from "../config/db.js";

// ─────────────────────────────────────────────────────────────
// SSE CLIENT MANAGER
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
  if (updated.length === 0) {
    clients.delete(userId);
  } else {
    clients.set(userId, updated);
  }
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

    pushToUser(userId, {
      event: "notification",
      data:  notification,
    });

    return notification;
  } catch (err) {
    console.error("notify error:", err.message);
  }
};

// Push nhiều notification cùng lúc
export const notifyMany = async (notifications) => {
  return Promise.all(notifications.map((n) => notify(n)));
};

// Tạo notification trong DB cho tất cả admin + push SSE nếu admin đang online.
// @param {{ type: string, title: string, body: string, meta?: object }} params
export const notifyAdmin = async ({ type, title, body, meta = {} }) => {
  try {
    const admins = await prisma.user.findMany({
      where:  { role: "ADMIN" },
      select: { id: true },
    });

    return notifyMany(
      admins.map((admin) => ({
        userId:    admin.id,
        type,
        title,
        body,
        courseId:  meta.courseId,
        bookingId: meta.bookingId,
      }))
    );
  } catch (err) {
    console.error("notifyAdmin error:", err.message);
    return [];
  }
};

// ─────────────────────────────────────────────────────────────
// HELPER FUNCTIONS — giữ nguyên toàn bộ từ file cũ
// ─────────────────────────────────────────────────────────────

export const notifyBookingReceived = (booking, tutorUserId) =>
  notify({
    userId:    tutorUserId,
    type:      "BOOKING_RECEIVED",
    title:     "Yêu cầu thuê gia sư mới",
    body:      `${booking.name} muốn học môn ${booking.subject}`,
    bookingId: booking.id,
  });

export const notifyPaymentRequired = (course, studentId) =>
  notify({
    userId:   studentId,
    type:     "PAYMENT_REQUIRED",
    title:    "Thanh toán để bắt đầu học",
    body:     `Gia sư đã chấp nhận yêu cầu. Vui lòng thanh toán $${Number(course.totalPrice).toFixed(2)} để kích hoạt lớp "${course.subject}"`,
    courseId: course.id,
  });

export const notifyBookingRejected = (booking, studentId, tutorNote) =>
  notify({
    userId:    studentId,
    type:      "BOOKING_REJECTED",
    title:     "Yêu cầu không được chấp nhận",
    body:      tutorNote ? `Lý do: ${tutorNote}` : `Gia sư đã từ chối yêu cầu môn ${booking.subject}`,
    bookingId: booking.id,
  });

export const notifyBookingCancelled = (booking, tutorUserId) =>
  notify({
    userId:    tutorUserId,
    type:      "BOOKING_CANCELLED",
    title:     "Yêu cầu đã bị huỷ",
    body:      `${booking.name} đã huỷ yêu cầu học môn ${booking.subject}`,
    bookingId: booking.id,
  });

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

export const notifyWithdrawalRequested = (withdrawal, tutorName) =>
  notifyAdmin({
    type:  "WITHDRAWAL_REQUESTED",
    title: "Yêu cầu rút tiền mới",
    body:  `${tutorName || "Gia sư"} vừa yêu cầu rút $${Number(withdrawal.amount).toFixed(2)}.`,
  });

export const notifyWithdrawalCompleted = async (withdrawal, tutorUserId, tutorName) => {
  await notifyAdmin({
    type:  "WITHDRAWAL_COMPLETED",
    title: "Rút tiền đã hoàn tất",
    body:  `Yêu cầu rút $${Number(withdrawal.amount).toFixed(2)} của ${tutorName || "gia sư"} đã hoàn tất.`,
  });

  return notify({
    userId: tutorUserId,
    type:   "WITHDRAWAL_COMPLETED",
    title:  "Tiền đã được chuyển",
    body:   `Admin đã chuyển thành công $${Number(withdrawal.amount).toFixed(2)} cho bạn.`,
  });
};

export const notifyCourseActivated = async (course, tutorUserId, studentName) => {
  await notifyAdmin({
    type:  "COURSE_ACTIVATED",
    title: "Lớp học mới đã được kích hoạt",
    body:  `${studentName || "Học viên"} đã thanh toán lớp "${course.subject}".`,
    meta:  { courseId: course.id },
  });

  return notify({
    userId:   tutorUserId,
    type:     "COURSE_ACTIVATED",
    title:    "Lớp học đã được kích hoạt",
    body:     `Học viên đã thanh toán lớp "${course.subject}". Bạn có thể bắt đầu chuẩn bị lịch học.`,
    courseId: course.id,
  });
};

export const notifyReviewCreated = async (review, course, tutorUserId, studentName) => {
  await notifyAdmin({
    type:  "REVIEW_CREATED",
    title: "Đánh giá mới",
    body:  `${studentName || "Học viên"} vừa đánh giá ${review.rating}/5 cho lớp "${course.subject}".`,
    meta:  { courseId: course.id },
  });

  return notify({
    userId:   tutorUserId,
    type:     "REVIEW_CREATED",
    title:    "Bạn có đánh giá mới",
    body:     `${studentName || "Học viên"} vừa đánh giá ${review.rating}/5 cho lớp "${course.subject}".`,
    courseId: course.id,
  });
};

export const notifyCourseStarted = (course, studentId) =>
  notify({
    userId:   studentId,
    type:     "COURSE_STARTED",
    title:    "Lớp học đã bắt đầu!",
    body:     `Gia sư đã bắt đầu lớp "${course.subject}". Chúc bạn học tốt!`,
    courseId: course.id,
  });

export const notifyEndCourseRequested = (course, studentId) =>
  notify({
    userId:   studentId,
    type:     "END_COURSE_REQUESTED",
    title:    "Gia sư muốn kết thúc khóa học",
    body:     `Vui lòng xác nhận kết thúc lớp "${course.subject}" để giải phóng học phí.`,
    courseId: course.id,
  });

export const notifyEndCourseWaiting = (course, tutorUserId) =>
  notify({
    userId:   tutorUserId,
    type:     "END_COURSE_WAITING",
    title:    "Học viên đã xác nhận kết thúc",
    body:     `Đang xử lý kết thúc lớp "${course.subject}"`,
    courseId: course.id,
  });

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

export const notifySessionConfirmWait = (session, courseSubject, waitingUserId, confirmedByRole) =>
  notify({
    userId:   waitingUserId,
    type:     "SESSION_CONFIRM_WAIT",
    title:    `${confirmedByRole === "TUTOR" ? "Gia sư" : "Học viên"} đã xác nhận buổi học`,
    body:     `Vui lòng xác nhận buổi ${session.sessionNumber} môn "${courseSubject}" để hoàn tất.`,
    courseId: session.courseClassId,
  });

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
