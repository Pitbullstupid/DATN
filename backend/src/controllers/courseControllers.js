import { prisma } from "../config/db.js";

// ─────────────────────────────────────────────────────────────
// HELPER: generate danh sách CourseSession từ lịch + ngày bắt đầu
// ─────────────────────────────────────────────────────────────
const generateSessions = (startDate, endDate, schedules, durationMin, totalSessions) => {
  const sessions = [];
  const current  = new Date(startDate);
  const end      = new Date(endDate);
  let   number   = 1;

  while (current <= end && sessions.length < totalSessions) {
    const dow = current.getDay(); // 0=CN ... 6=T7
    const slot = schedules.find((s) => s.dayOfWeek === dow);

    if (slot) {
      const [h, m] = slot.startTime.split(":").map(Number);
      const scheduledAt = new Date(current);
      scheduledAt.setHours(h, m, 0, 0);

      sessions.push({
        sessionNumber: number++,
        scheduledAt,
        durationMin,
        status: "SCHEDULED",
      });
    }

    current.setDate(current.getDate() + 1);
  }

  return sessions;
};

// ─────────────────────────────────────────────────────────────
// HELPER: quyền truy cập
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

// ─────────────────────────────────────────────────────────────
// POST /courses  (gọi từ bookingController khi ACCEPT)
// Tạo lớp học + thời khóa biểu + generate toàn bộ buổi học
// Body: { bookingRequestId, subject, startDate, endDate,
//         totalSessions, durationMin, pricePerSession,
//         schedules: [{ dayOfWeek, startTime, endTime }],
//         note? }
// ─────────────────────────────────────────────────────────────
export const createCourse = async (req, res) => {
  try {
    const {
      bookingRequestId,
      subject,
      startDate,
      endDate,
      totalSessions,
      durationMin = 60,
      pricePerSession,
      schedules,
      note,
    } = req.body;

    if (!schedules?.length) {
      return res.status(400).json({ status: "error", message: "Vui lòng cung cấp thời khóa biểu" });
    }
    if (!startDate || !endDate || !totalSessions) {
      return res.status(400).json({ status: "error", message: "Thiếu thông tin khóa học" });
    }

    // Lấy booking để biết studentId
    const booking = await prisma.bookingRequest.findUnique({
      where: { id: bookingRequestId },
      include: { tutorProfile: { select: { userId: true } } },
    });

    if (!booking) {
      return res.status(404).json({ status: "error", message: "Không tìm thấy booking" });
    }
    if (booking.tutorProfile.userId !== req.user.id) {
      return res.status(403).json({ status: "error", message: "Không có quyền thực hiện" });
    }
    if (booking.status !== "PENDING") {
      return res.status(400).json({ status: "error", message: "Booking không ở trạng thái PENDING" });
    }

    const totalPrice = pricePerSession ? pricePerSession * totalSessions : null;

    // Generate danh sách buổi học
    const sessionData = generateSessions(
      startDate, endDate, schedules, durationMin, totalSessions
    );

    // Transaction: update booking + tạo course + schedules + sessions
    const [, course] = await prisma.$transaction([
      prisma.bookingRequest.update({
        where: { id: bookingRequestId },
        data: { status: "ACCEPTED" },
      }),
      prisma.courseClass.create({
        data: {
          studentId:       booking.studentId,
          tutorProfileId:  booking.tutorProfileId,
          bookingRequestId,
          subject:         subject || booking.subject,
          startDate:       new Date(startDate),
          endDate:         new Date(endDate),
          totalSessions:   parseInt(totalSessions),
          durationMin:     parseInt(durationMin),
          pricePerSession: pricePerSession ? parseFloat(pricePerSession) : null,
          totalPrice,
          note:            note || null,
          status:          "UPCOMING",
          schedules: {
            create: schedules.map((s) => ({
              dayOfWeek: s.dayOfWeek,
              startTime: s.startTime,
              endTime:   s.endTime,
            })),
          },
          sessions: {
            create: sessionData,
          },
        },
        include: {
          schedules: true,
          sessions:  { orderBy: { sessionNumber: "asc" } },
        },
      }),
    ]);

    res.status(201).json({
      status: "success",
      message: "Đã tạo lớp học và thời khóa biểu thành công",
      data: { course },
    });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ status: "error", message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /courses/student   — Student xem danh sách lớp
// GET /courses/tutor     — Tutor xem danh sách lớp
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
        where, skip, take,
        orderBy: { startDate: "desc" },
        include: {
          tutorProfile: {
            select: {
              id: true, subjects: true, pricePerHour: true,
              user: { select: { name: true, avatar: true } },
            },
          },
          schedules: true,
          review:    { select: { id: true, rating: true } },
          _count:    { select: { sessions: true } },
        },
      }),
      prisma.courseClass.count({ where }),
    ]);

    res.status(200).json({
      status: "success",
      data: {
        courses,
        pagination: {
          total, page: parseInt(page), limit: take,
          totalPages: Math.ceil(total / take),
        },
      },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

export const getMyCoursesAsTutor = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { userId: req.user.id },
    });
    if (!tutorProfile) {
      return res.status(404).json({ status: "error", message: "Không tìm thấy hồ sơ gia sư" });
    }

    const where = { tutorProfileId: tutorProfile.id };
    if (status) where.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [courses, total] = await prisma.$transaction([
      prisma.courseClass.findMany({
        where, skip, take,
        orderBy: { startDate: "desc" },
        include: {
          student:  { select: { id: true, name: true, avatar: true, email: true } },
          schedules: true,
          review:   { select: { id: true, rating: true } },
          _count:   { select: { sessions: true } },
        },
      }),
      prisma.courseClass.count({ where }),
    ]);

    res.status(200).json({
      status: "success",
      data: {
        courses,
        pagination: {
          total, page: parseInt(page), limit: take,
          totalPages: Math.ceil(total / take),
        },
      },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /courses/:id   — Chi tiết lớp học + toàn bộ buổi học
// ─────────────────────────────────────────────────────────────
export const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    await getCourseWithAccess(id, req.user.id);

    const course = await prisma.courseClass.findUnique({
      where: { id },
      include: {
        student: { select: { id: true, name: true, avatar: true, email: true } },
        tutorProfile: {
          select: {
            id: true, subjects: true, pricePerHour: true,
            user: { select: { name: true, avatar: true } },
          },
        },
        schedules: { orderBy: { dayOfWeek: "asc" } },
        sessions:  { orderBy: { sessionNumber: "asc" } },
        review:    true,
        messages: {
          orderBy: { createdAt: "asc" },
          take: 50,
          include: { sender: { select: { id: true, name: true, avatar: true } } },
        },
      },
    });

    res.status(200).json({ status: "success", data: { course } });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ status: "error", message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /courses/:id/start   — Tutor bắt đầu khóa học
// ─────────────────────────────────────────────────────────────
export const startCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { course, isTutor } = await getCourseWithAccess(id, req.user.id);

    if (!isTutor) return res.status(403).json({ status: "error", message: "Chỉ gia sư mới có thể bắt đầu lớp học" });
    if (course.status !== "UPCOMING") return res.status(400).json({ status: "error", message: `Lớp đang ở trạng thái "${course.status}"` });

    const updated = await prisma.courseClass.update({
      where: { id },
      data: { status: "ONGOING" },
    });

    res.status(200).json({ status: "success", message: "Lớp học đã bắt đầu", data: { course: updated } });
  } catch (err) {
    const s = err.status || 500;
    res.status(s).json({ status: "error", message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /courses/:id/complete   — Tutor kết thúc khóa học
// ─────────────────────────────────────────────────────────────
export const completeCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { course, isTutor } = await getCourseWithAccess(id, req.user.id);

    if (!isTutor) return res.status(403).json({ status: "error", message: "Chỉ gia sư mới có thể kết thúc lớp học" });
    if (course.status !== "ONGOING") return res.status(400).json({ status: "error", message: `Lớp đang ở trạng thái "${course.status}"` });

    // Đánh dấu tất cả buổi SCHEDULED còn lại là COMPLETED
    await prisma.$transaction([
      prisma.courseSession.updateMany({
        where: { courseClassId: id, status: "SCHEDULED" },
        data:  { status: "COMPLETED" },
      }),
      prisma.courseClass.update({
        where: { id },
        data:  { status: "COMPLETED" },
      }),
    ]);

    res.status(200).json({ status: "success", message: "Lớp học đã hoàn thành!" });
  } catch (err) {
    const s = err.status || 500;
    res.status(s).json({ status: "error", message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /courses/:id/cancel   — Huỷ lớp học
// ─────────────────────────────────────────────────────────────
export const cancelCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { course } = await getCourseWithAccess(id, req.user.id);

    if (!["UPCOMING", "ONGOING"].includes(course.status)) {
      return res.status(400).json({ status: "error", message: `Không thể huỷ lớp ở trạng thái "${course.status}"` });
    }

    await prisma.$transaction([
      prisma.courseSession.updateMany({
        where: { courseClassId: id, status: "SCHEDULED" },
        data:  { status: "CANCELLED" },
      }),
      prisma.courseClass.update({
        where: { id },
        data:  { status: "CANCELLED" },
      }),
    ]);

    res.status(200).json({ status: "success", message: "Đã huỷ lớp học" });
  } catch (err) {
    const s = err.status || 500;
    res.status(s).json({ status: "error", message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /courses/:id/sessions/:sessionId
// Tutor cập nhật trạng thái 1 buổi học cụ thể
// Body: { status, note? }
// ─────────────────────────────────────────────────────────────
export const updateSession = async (req, res) => {
  try {
    const { id, sessionId } = req.params;
    const { status, note } = req.body;
    const { isTutor } = await getCourseWithAccess(id, req.user.id);

    if (!isTutor) return res.status(403).json({ status: "error", message: "Chỉ gia sư mới có thể cập nhật buổi học" });

    const validStatuses = ["SCHEDULED", "ONGOING", "COMPLETED", "CANCELLED", "ABSENT"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ status: "error", message: "Trạng thái không hợp lệ" });
    }

    const session = await prisma.courseSession.findFirst({
      where: { id: sessionId, courseClassId: id },
    });
    if (!session) return res.status(404).json({ status: "error", message: "Không tìm thấy buổi học" });

    const [updatedSession] = await prisma.$transaction(async (tx) => {
      const s = await tx.courseSession.update({
        where: { id: sessionId },
        data: { status, ...(note !== undefined ? { note } : {}) },
      });

      // Cập nhật sessionsDone nếu COMPLETED
      if (status === "COMPLETED" && session.status !== "COMPLETED") {
        await tx.courseClass.update({
          where: { id },
          data: { sessionsDone: { increment: 1 } },
        });
      }
      // Giảm lại nếu từ COMPLETED → status khác
      if (session.status === "COMPLETED" && status !== "COMPLETED") {
        await tx.courseClass.update({
          where: { id },
          data: { sessionsDone: { decrement: 1 } },
        });
      }

      return [s];
    });

    res.status(200).json({
      status: "success",
      message: "Đã cập nhật buổi học",
      data: { session: updatedSession },
    });
  } catch (err) {
    const s = err.status || 500;
    res.status(s).json({ status: "error", message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /courses/:id/review
// Student đánh giá sau khi khóa COMPLETED
// Body: { rating (1-5), comment? }
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
      const r = await tx.review.create({
        data: {
          courseClassId:  id,
          studentId:      req.user.id,
          tutorProfileId: course.tutorProfileId,
          rating:         parseInt(rating),
          comment:        comment || null,
        },
      });

      const agg = await tx.review.aggregate({
        where: { tutorProfileId: course.tutorProfileId },
        _avg:   { rating: true },
        _count: { rating: true },
      });

      await tx.tutorProfile.update({
        where: { id: course.tutorProfileId },
        data: {
          rating:       agg._avg.rating ?? 0,
          totalReviews: agg._count.rating,
        },
      });

      return [r];
    });

    res.status(201).json({ status: "success", message: "Cảm ơn bạn đã đánh giá!", data: { review } });
  } catch (err) {
    const s = err.status || 500;
    res.status(s).json({ status: "error", message: err.message });
  }
};