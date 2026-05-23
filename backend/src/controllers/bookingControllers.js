import { prisma } from "../config/db.js";
import {
  notifyBookingReceived,
  notifyBookingRejected,
  notifyBookingCancelled,
} from "../services/notificationService.js";

export const createBooking = async (req, res) => {
  try {
    const { tutorProfileId, name, email, subject, message } = req.body;
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

    const booking = await prisma.bookingRequest.create({
      data: {
        studentId: req.user.id,
        tutorProfileId,
        name,
        email,
        subject,
        message,
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
