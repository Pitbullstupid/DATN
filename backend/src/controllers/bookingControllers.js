import { prisma } from "../config/db.js";
import {
  notifyBookingReceived,
  notifyBookingRejected,
  notifyBookingCancelled,
} from "../services/notificationService.js";

const parsePreferredStudyTime = (startDate, preferredTime) => {
  if (!startDate || !preferredTime) return null;
  if (!/^\d{2}:\d{2}$/.test(preferredTime)) return null;

  const datePart =
    startDate instanceof Date
      ? startDate.toISOString().slice(0, 10)
      : String(startDate).slice(0, 10);
  const selectedAt = new Date(`${datePart}T${preferredTime}:00`);
  return Number.isNaN(selectedAt.getTime()) ? null : selectedAt;
};

const nextDateForDayOfWeek = (dayOfWeek) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  const diff = (dayOfWeek - date.getDay() + 7) % 7;
  date.setDate(date.getDate() + diff);
  return date;
};

const normalizeSchedules = (schedules = []) =>
  schedules
    .map((schedule) => ({
      dayOfWeek: Number(schedule.dayOfWeek),
      startTime: schedule.startTime,
      endTime: schedule.endTime,
    }))
    .filter(
      (schedule) =>
        Number.isInteger(schedule.dayOfWeek) &&
        schedule.dayOfWeek >= 0 &&
        schedule.dayOfWeek <= 6 &&
        /^\d{2}:\d{2}$/.test(schedule.startTime || "") &&
        /^\d{2}:\d{2}$/.test(schedule.endTime || ""),
    );

const hasScheduleOverlap = (slot, existing) =>
  slot.dayOfWeek === existing.dayOfWeek &&
  slot.startTime < existing.endTime &&
  slot.endTime > existing.startTime;

export const createBooking = async (req, res) => {
  try {
    const {
      tutorProfileId,
      name,
      email,
      subject,
      message,
      startDate,
      preferredTime,
      schedules,
    } = req.body;
    const weeklySchedules = normalizeSchedules(schedules);
    const firstSchedule = weeklySchedules[0];
    const bookingStartDate =
      startDate || (firstSchedule ? nextDateForDayOfWeek(firstSchedule.dayOfWeek) : null);
    const bookingPreferredTime = preferredTime || firstSchedule?.startTime;
    const preferredStudyAt = parsePreferredStudyTime(
      bookingStartDate,
      bookingPreferredTime,
    );

    if (!preferredStudyAt && weeklySchedules.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Vui lòng chọn ngày và thời gian học mong muốn",
      });
    }

    const invalidSchedule = weeklySchedules.find(
      (schedule) => schedule.startTime >= schedule.endTime,
    );
    if (invalidSchedule) {
      return res.status(400).json({
        status: "error",
        message: "Giờ kết thúc phải sau giờ bắt đầu",
      });
    }

    const selectedSubject = await prisma.subject.findFirst({
      where: { name: subject, isActive: true },
      select: { id: true },
    });

    if (!selectedSubject) {
      return res
        .status(400)
        .json({ status: "error", message: "Môn học không hợp lệ" });
    }

    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { id: tutorProfileId },
      select: { userId: true, status: true },
    });
    if (!tutorProfile || tutorProfile.status !== "APPROVED")
      return res
        .status(404)
        .json({ status: "error", message: "Không tìm thấy gia sư" });
    if (tutorProfile.userId === req.user.id)
      return res
        .status(400)
        .json({
          status: "error",
          message: "Bạn không thể gửi yêu cầu cho chính mình",
        });

    const existing = await prisma.bookingRequest.findFirst({
      where: { studentId: req.user.id, tutorProfileId, status: "PENDING" },
    });
    if (existing)
      return res
        .status(400)
        .json({
          status: "error",
          message: "Bạn đã có yêu cầu đang chờ xử lý với gia sư này",
        });

    let conflictingSession = null;

    if (weeklySchedules.length > 0) {
      const existingSchedules = await prisma.courseSchedule.findMany({
        where: {
          dayOfWeek: { in: weeklySchedules.map((slot) => slot.dayOfWeek) },
          courseClass: {
            tutorProfileId,
            status: { in: ["PENDING_PAYMENT", "UPCOMING", "ONGOING"] },
          },
        },
        select: { dayOfWeek: true, startTime: true, endTime: true },
      });

      conflictingSession = weeklySchedules.find((slot) =>
        existingSchedules.some((existingSchedule) =>
          hasScheduleOverlap(slot, existingSchedule),
        ),
      );
    } else if (preferredStudyAt) {
      const preferredStudyDayStart = new Date(preferredStudyAt);
      preferredStudyDayStart.setHours(0, 0, 0, 0);
      const preferredStudyDayEnd = new Date(preferredStudyDayStart);
      preferredStudyDayEnd.setDate(preferredStudyDayEnd.getDate() + 1);

      const existingSessions = await prisma.courseSession.findMany({
        where: {
          scheduledAt: { gte: preferredStudyDayStart, lt: preferredStudyDayEnd },
          status: { not: "CANCELLED" },
          courseClass: {
            tutorProfileId,
            status: { in: ["PENDING_PAYMENT", "UPCOMING", "ONGOING"] },
          },
        },
        select: { scheduledAt: true, durationMin: true },
      });

      conflictingSession = existingSessions.find((session) => {
        const sessionStart = new Date(session.scheduledAt);
        const sessionEnd = new Date(sessionStart);
        sessionEnd.setMinutes(sessionEnd.getMinutes() + session.durationMin);
        return preferredStudyAt >= sessionStart && preferredStudyAt < sessionEnd;
      });
    }

    if (conflictingSession) {
      return res.status(409).json({
        status: "error",
        message: "Thời gian này đã trùng với lịch học có sẵn của gia sư",
      });
    }

    const booking = await prisma.bookingRequest.create({
      data: {
        studentId: req.user.id,
        tutorProfileId,
        name,
        email,
        subject,
        message,
        startDate: preferredStudyAt,
        preferredDays: weeklySchedules.map((slot) => String(slot.dayOfWeek)),
        preferredTime: bookingPreferredTime,
      },
      include: {
        tutorProfile: {
          select: { id: true, user: { select: { name: true, avatar: true } } },
        },
      },
    });

    await notifyBookingReceived(booking, tutorProfile.userId);

    res.status(201).json({
      status: "success",
      message: "Gửi yêu cầu thành công! Vui lòng chờ gia sư phản hồi.",
      data: { booking },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

export const getMyBookingsAsStudent = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const where = { studentId: req.user.id };
    if (status) where.status = status;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    const [bookings, total] = await prisma.$transaction([
      prisma.bookingRequest.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          tutorProfile: {
            select: {
              id: true,
              subjects: true,
              pricePerHour: true,
              user: { select: { name: true, avatar: true } },
            },
          },
        },
      }),
      prisma.bookingRequest.count({ where }),
    ]);
    res
      .status(200)
      .json({
        status: "success",
        data: {
          bookings,
          pagination: {
            total,
            page: parseInt(page),
            limit: take,
            totalPages: Math.ceil(total / take),
          },
        },
      });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

export const getMyBookingsAsTutor = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { userId: req.user.id },
    });
    if (!tutorProfile)
      return res
        .status(404)
        .json({ status: "error", message: "Không tìm thấy hồ sơ gia sư" });
    const where = { tutorProfileId: tutorProfile.id };
    if (status) where.status = status;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    const [bookings, total] = await prisma.$transaction([
      prisma.bookingRequest.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          student: {
            select: { id: true, name: true, avatar: true, email: true },
          },
        },
      }),
      prisma.bookingRequest.count({ where }),
    ]);
    res
      .status(200)
      .json({
        status: "success",
        data: {
          bookings,
          pagination: {
            total,
            page: parseInt(page),
            limit: take,
            totalPages: Math.ceil(total / take),
          },
        },
      });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

export const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await prisma.bookingRequest.findUnique({
      where: { id },
      include: {
        student: {
          select: { id: true, name: true, avatar: true, email: true },
        },
        tutorProfile: {
          select: {
            id: true,
            subjects: true,
            pricePerHour: true,
            userId: true,
            user: { select: { name: true, avatar: true } },
          },
        },
        courseClass: true,
      },
    });
    if (!booking)
      return res
        .status(404)
        .json({ status: "error", message: "Không tìm thấy booking" });
    const isTutorOwner = booking.tutorProfile.userId === req.user.id;
    const isStudentOwner = booking.studentId === req.user.id;
    if (!isTutorOwner && !isStudentOwner)
      return res
        .status(403)
        .json({ status: "error", message: "Không có quyền truy cập" });
    res.status(200).json({ status: "success", data: { booking } });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

export const rejectBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { tutorNote } = req.body;
    const booking = await prisma.bookingRequest.findUnique({
      where: { id },
      include: { tutorProfile: { select: { userId: true } } },
    });
    if (!booking)
      return res
        .status(404)
        .json({ status: "error", message: "Không tìm thấy booking" });
    if (booking.tutorProfile.userId !== req.user.id)
      return res
        .status(403)
        .json({ status: "error", message: "Không có quyền" });
    if (booking.status !== "PENDING")
      return res
        .status(400)
        .json({
          status: "error",
          message: `Booking đang ở trạng thái "${booking.status}"`,
        });
    const updated = await prisma.bookingRequest.update({
      where: { id },
      data: { status: "REJECTED", tutorNote: tutorNote || null },
    });
    await notifyBookingRejected(booking, booking.studentId, tutorNote);
    res
      .status(200)
      .json({
        status: "success",
        message: "Đã từ chối yêu cầu",
        data: { booking: updated },
      });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

export const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await prisma.bookingRequest.findUnique({
      where: { id },
      include: { tutorProfile: { select: { userId: true } } },
    });
    if (!booking)
      return res
        .status(404)
        .json({ status: "error", message: "Không tìm thấy booking" });
    if (booking.studentId !== req.user.id)
      return res
        .status(403)
        .json({ status: "error", message: "Không có quyền" });
    if (booking.status !== "PENDING")
      return res
        .status(400)
        .json({
          status: "error",
          message: `Booking đang ở trạng thái "${booking.status}"`,
        });
    const updated = await prisma.bookingRequest.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
    await notifyBookingCancelled(booking, booking.tutorProfile.userId);
    res
      .status(200)
      .json({
        status: "success",
        message: "Đã huỷ yêu cầu thành công",
        data: { booking: updated },
      });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
