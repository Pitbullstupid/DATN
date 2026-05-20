import { prisma } from "../config/db.js";

// ─────────────────────────────────────────────────────────────
// HELPER
// ─────────────────────────────────────────────────────────────
const getCourseWithAccess = async (courseId, userId) => {
  const course = await prisma.courseClass.findUnique({
    where: { id: courseId },
    include: { tutorProfile: { select: { userId: true } } },
  });
  if (!course) throw { status: 404, message: "Không tìm thấy lớp học" };
  const isTutor   = course.tutorProfile.userId === userId;
  const isStudent = course.studentId === userId;
  if (!isTutor && !isStudent)
    throw { status: 403, message: "Không có quyền truy cập lớp học này" };
  return { course, isTutor, isStudent };
};

const generateSessions = (startDate, endDate, schedules, durationMin, totalSessions) => {
  const sessions = [];
  const current  = new Date(startDate);
  const end      = new Date(endDate);
  let number = 1;
  while (current <= end && sessions.length < totalSessions) {
    const slot = schedules.find((s) => s.dayOfWeek === current.getDay());
    if (slot) {
      const [h, m] = slot.startTime.split(":").map(Number);
      const scheduledAt = new Date(current);
      scheduledAt.setHours(h, m, 0, 0);
      sessions.push({ sessionNumber: number++, scheduledAt, durationMin, status: "SCHEDULED" });
    }
    current.setDate(current.getDate() + 1);
  }
  return sessions;
};

// ─────────────────────────────────────────────────────────────
// POST /courses — Tạo lớp khi accept booking
// ─────────────────────────────────────────────────────────────
export const createCourse = async (req, res) => {
  try {
    const { bookingRequestId, subject, startDate, endDate,
            totalSessions, durationMin = 60, pricePerSession, schedules, note } = req.body;

    if (!schedules?.length) return res.status(400).json({ status: "error", message: "Vui lòng cung cấp thời khóa biểu" });
    if (!startDate || !endDate || !totalSessions) return res.status(400).json({ status: "error", message: "Thiếu thông tin khóa học" });

    const booking = await prisma.bookingRequest.findUnique({
      where: { id: bookingRequestId },
      include: { tutorProfile: { select: { userId: true } } },
    });
    if (!booking) return res.status(404).json({ status: "error", message: "Không tìm thấy booking" });
    if (booking.tutorProfile.userId !== req.user.id) return res.status(403).json({ status: "error", message: "Không có quyền" });
    if (booking.status !== "PENDING") return res.status(400).json({ status: "error", message: "Booking không ở trạng thái PENDING" });

    const sessionData = generateSessions(startDate, endDate, schedules, parseInt(durationMin), parseInt(totalSessions));
    const totalPrice  = pricePerSession ? parseFloat(pricePerSession) * parseInt(totalSessions) : null;

    const [, course] = await prisma.$transaction([
      prisma.bookingRequest.update({ where: { id: bookingRequestId }, data: { status: "ACCEPTED" } }),
      prisma.courseClass.create({
        data: {
          studentId: booking.studentId, tutorProfileId: booking.tutorProfileId,
          bookingRequestId, subject: subject || booking.subject,
          startDate: new Date(startDate), endDate: new Date(endDate),
          totalSessions: parseInt(totalSessions), durationMin: parseInt(durationMin),
          pricePerSession: pricePerSession ? parseFloat(pricePerSession) : null,
          totalPrice, note: note || null, status: "UPCOMING",
          schedules: { create: schedules.map((s) => ({ dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime })) },
          sessions:  { create: sessionData },
        },
        include: { schedules: true, sessions: { orderBy: { sessionNumber: "asc" } } },
      }),
    ]);

    res.status(201).json({ status: "success", message: "Đã tạo lớp học thành công", data: { course } });
  } catch (err) {
    res.status(err.status || 500).json({ status: "error", message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /courses/student | /courses/tutor
// ─────────────────────────────────────────────────────────────
export const getMyCoursesAsStudent = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const where = { studentId: req.user.id };
    if (status) where.status = status;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    const [courses, total] = await prisma.$transaction([
      prisma.courseClass.findMany({
        where, skip, take, orderBy: { startDate: "desc" },
        include: {
          tutorProfile: { select: { id: true, subjects: true, pricePerHour: true, user: { select: { name: true, avatar: true } } } },
          schedules: true, review: { select: { id: true, rating: true } }, _count: { select: { sessions: true } },
        },
      }),
      prisma.courseClass.count({ where }),
    ]);
    res.status(200).json({ status: "success", data: { courses, pagination: { total, page: parseInt(page), limit: take, totalPages: Math.ceil(total / take) } } });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

export const getMyCoursesAsTutor = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const tutorProfile = await prisma.tutorProfile.findUnique({ where: { userId: req.user.id } });
    if (!tutorProfile) return res.status(404).json({ status: "error", message: "Không tìm thấy hồ sơ gia sư" });
    const where = { tutorProfileId: tutorProfile.id };
    if (status) where.status = status;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    const [courses, total] = await prisma.$transaction([
      prisma.courseClass.findMany({
        where, skip, take, orderBy: { startDate: "desc" },
        include: {
          student: { select: { id: true, name: true, avatar: true, email: true } },
          schedules: true, review: { select: { id: true, rating: true } }, _count: { select: { sessions: true } },
        },
      }),
      prisma.courseClass.count({ where }),
    ]);
    res.status(200).json({ status: "success", data: { courses, pagination: { total, page: parseInt(page), limit: take, totalPages: Math.ceil(total / take) } } });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /courses/:id
// ─────────────────────────────────────────────────────────────
export const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    await getCourseWithAccess(id, req.user.id);
    const course = await prisma.courseClass.findUnique({
      where: { id },
      include: {
        student:      { select: { id: true, name: true, avatar: true, email: true } },
        tutorProfile: { select: { id: true, subjects: true, pricePerHour: true, user: { select: { name: true, avatar: true } } } },
        schedules:    { orderBy: { dayOfWeek: "asc" } },
        sessions:     { orderBy: { sessionNumber: "asc" } },
        review: true,
      },
    });
    res.status(200).json({ status: "success", data: { course } });
  } catch (err) {
    res.status(err.status || 500).json({ status: "error", message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /courses/:id/start
// ─────────────────────────────────────────────────────────────
export const startCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { course, isTutor } = await getCourseWithAccess(id, req.user.id);
    if (!isTutor) return res.status(403).json({ status: "error", message: "Chỉ gia sư mới có thể bắt đầu lớp học" });
    if (course.status !== "UPCOMING") return res.status(400).json({ status: "error", message: `Lớp đang ở trạng thái "${course.status}"` });
    const updated = await prisma.courseClass.update({ where: { id }, data: { status: "ONGOING" } });
    res.status(200).json({ status: "success", message: "Lớp học đã bắt đầu", data: { course: updated } });
  } catch (err) {
    res.status(err.status || 500).json({ status: "error", message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /courses/:id/request-end
// Tutor yêu cầu / Student xác nhận kết thúc khóa (2 chiều)
// → Cả 2 confirm → status = COMPLETED
// ─────────────────────────────────────────────────────────────
export const requestEndCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { course, isTutor } = await getCourseWithAccess(id, req.user.id);

    if (course.status !== "ONGOING")
      return res.status(400).json({ status: "error", message: "Chỉ có thể kết thúc lớp đang ONGOING" });

    const data = isTutor ? { tutorConfirmedEnd: true } : { studentConfirmedEnd: true };
    const updated = await prisma.courseClass.update({ where: { id }, data });

    if (updated.tutorConfirmedEnd && updated.studentConfirmedEnd) {
      await prisma.$transaction([
        prisma.courseSession.updateMany({ where: { courseClassId: id, status: "SCHEDULED" }, data: { status: "CANCELLED" } }),
        prisma.courseClass.update({ where: { id }, data: { status: "COMPLETED" } }),
      ]);
      return res.status(200).json({ status: "success", message: "Cả hai đã xác nhận — khóa học đã kết thúc!", data: { completed: true } });
    }

    const waitingFor = isTutor ? "học viên" : "gia sư";
    res.status(200).json({
      status: "success",
      message: `Đã ghi nhận. Đang chờ ${waitingFor} xác nhận.`,
      data: { completed: false, tutorConfirmedEnd: updated.tutorConfirmedEnd, studentConfirmedEnd: updated.studentConfirmedEnd },
    });
  } catch (err) {
    res.status(err.status || 500).json({ status: "error", message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /courses/:id/cancel
// ─────────────────────────────────────────────────────────────
export const cancelCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { course } = await getCourseWithAccess(id, req.user.id);
    if (!["UPCOMING", "ONGOING"].includes(course.status))
      return res.status(400).json({ status: "error", message: `Không thể huỷ lớp ở trạng thái "${course.status}"` });
    await prisma.$transaction([
      prisma.courseSession.updateMany({ where: { courseClassId: id, status: "SCHEDULED" }, data: { status: "CANCELLED" } }),
      prisma.courseClass.update({ where: { id }, data: { status: "CANCELLED" } }),
    ]);
    res.status(200).json({ status: "success", message: "Đã huỷ khóa học" });
  } catch (err) {
    res.status(err.status || 500).json({ status: "error", message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /courses/:id/sessions/:sessionId/confirm
// Tutor hoặc Student xác nhận hoàn thành buổi học (2 chiều)
// → Cả 2 confirm → COMPLETED, không sửa được nữa
// ─────────────────────────────────────────────────────────────
export const confirmSession = async (req, res) => {
  try {
    const { id, sessionId } = req.params;
    const { isTutor } = await getCourseWithAccess(id, req.user.id);

    const session = await prisma.courseSession.findFirst({ where: { id: sessionId, courseClassId: id } });
    if (!session) return res.status(404).json({ status: "error", message: "Không tìm thấy buổi học" });

    if (session.tutorConfirmed && session.studentConfirmed)
      return res.status(400).json({ status: "error", message: "Buổi học đã được cả 2 bên xác nhận, không thể thay đổi" });

    // Kiểm tra người dùng chưa confirm
    if (isTutor && session.tutorConfirmed)
      return res.status(400).json({ status: "error", message: "Bạn đã xác nhận buổi học này rồi" });
    if (!isTutor && session.studentConfirmed)
      return res.status(400).json({ status: "error", message: "Bạn đã xác nhận buổi học này rồi" });

    const data = isTutor ? { tutorConfirmed: true } : { studentConfirmed: true };
    const updated = await prisma.courseSession.update({ where: { id: sessionId }, data });

    if (updated.tutorConfirmed && updated.studentConfirmed) {
      await prisma.$transaction([
        prisma.courseSession.update({ where: { id: sessionId }, data: { status: "COMPLETED" } }),
        ...(session.status !== "COMPLETED"
          ? [prisma.courseClass.update({ where: { id }, data: { sessionsDone: { increment: 1 } } })]
          : []),
      ]);
      return res.status(200).json({ status: "success", message: "Cả hai đã xác nhận — buổi học hoàn thành!", data: { bothConfirmed: true } });
    }

    const waitingFor = isTutor ? "học viên" : "gia sư";
    res.status(200).json({
      status: "success",
      message: `Đã xác nhận. Đang chờ ${waitingFor} xác nhận.`,
      data: { bothConfirmed: false, tutorConfirmed: updated.tutorConfirmed, studentConfirmed: updated.studentConfirmed },
    });
  } catch (err) {
    res.status(err.status || 500).json({ status: "error", message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /courses/:id/sessions/:sessionId
// Tutor cập nhật trạng thái (chỉ khi chưa bị lock bởi cả 2)
// ─────────────────────────────────────────────────────────────
export const updateSession = async (req, res) => {
  try {
    const { id, sessionId } = req.params;
    const { status, note } = req.body;
    const { isTutor } = await getCourseWithAccess(id, req.user.id);

    if (!isTutor) return res.status(403).json({ status: "error", message: "Chỉ gia sư mới có thể cập nhật buổi học" });

    const session = await prisma.courseSession.findFirst({ where: { id: sessionId, courseClassId: id } });
    if (!session) return res.status(404).json({ status: "error", message: "Không tìm thấy buổi học" });

    if (session.tutorConfirmed && session.studentConfirmed)
      return res.status(400).json({ status: "error", message: "Buổi học đã được cả 2 bên xác nhận, không thể thay đổi" });

    const valid = ["SCHEDULED", "ONGOING", "COMPLETED", "CANCELLED", "ABSENT"];
    if (!valid.includes(status)) return res.status(400).json({ status: "error", message: "Trạng thái không hợp lệ" });

    const [updatedSession] = await prisma.$transaction(async (tx) => {
      const s = await tx.courseSession.update({ where: { id: sessionId }, data: { status, ...(note !== undefined ? { note } : {}) } });
      if (status === "COMPLETED" && session.status !== "COMPLETED")
        await tx.courseClass.update({ where: { id }, data: { sessionsDone: { increment: 1 } } });
      if (session.status === "COMPLETED" && status !== "COMPLETED")
        await tx.courseClass.update({ where: { id }, data: { sessionsDone: { decrement: 1 } } });
      return [s];
    });

    res.status(200).json({ status: "success", message: "Đã cập nhật buổi học", data: { session: updatedSession } });
  } catch (err) {
    res.status(err.status || 500).json({ status: "error", message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /courses/:id/review
// ─────────────────────────────────────────────────────────────
export const reviewCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const { course, isStudent } = await getCourseWithAccess(id, req.user.id);
    if (!isStudent) return res.status(403).json({ status: "error", message: "Chỉ học sinh mới có thể đánh giá" });
    if (course.status !== "COMPLETED") return res.status(400).json({ status: "error", message: "Chỉ đánh giá được khóa học đã hoàn thành" });
    if (course.review) return res.status(400).json({ status: "error", message: "Bạn đã đánh giá khóa học này rồi" });
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ status: "error", message: "Rating phải từ 1 đến 5" });

    const [review] = await prisma.$transaction(async (tx) => {
      const r = await tx.review.create({ data: { courseClassId: id, studentId: req.user.id, tutorProfileId: course.tutorProfileId, rating: parseInt(rating), comment: comment || null } });
      const agg = await tx.review.aggregate({ where: { tutorProfileId: course.tutorProfileId }, _avg: { rating: true }, _count: { rating: true } });
      await tx.tutorProfile.update({ where: { id: course.tutorProfileId }, data: { rating: agg._avg.rating ?? 0, totalReviews: agg._count.rating } });
      return [r];
    });

    res.status(201).json({ status: "success", message: "Cảm ơn bạn đã đánh giá!", data: { review } });
  } catch (err) {
    res.status(err.status || 500).json({ status: "error", message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET  /courses/:id/messages — Lấy tin nhắn (cursor-based)
// POST /courses/:id/messages — Gửi tin nhắn
// ─────────────────────────────────────────────────────────────
export const getMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const { cursor, limit = 50 } = req.query;
    await getCourseWithAccess(id, req.user.id);

    const where = { courseClassId: id };
    if (cursor) where.createdAt = { lt: new Date(cursor) };

    const messages = await prisma.message.findMany({
      where, take: parseInt(limit),
      orderBy: { createdAt: "desc" },
      include: { sender: { select: { id: true, name: true, avatar: true } } },
    });

    res.status(200).json({ status: "success", data: { messages: messages.reverse() } });
  } catch (err) {
    res.status(err.status || 500).json({ status: "error", message: err.message });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ status: "error", message: "Nội dung không được để trống" });

    await getCourseWithAccess(id, req.user.id);

    const message = await prisma.message.create({
      data: { courseClassId: id, senderId: req.user.id, content: content.trim() },
      include: { sender: { select: { id: true, name: true, avatar: true } } },
    });

    res.status(201).json({ status: "success", data: { message } });
  } catch (err) {
    res.status(err.status || 500).json({ status: "error", message: err.message });
  }
};