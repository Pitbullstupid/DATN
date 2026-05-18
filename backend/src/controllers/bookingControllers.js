import { prisma } from "../config/db.js";

// ─────────────────────────────────────────────────────────────
// POST /bookings
// Student gửi yêu cầu thuê gia sư
// ─────────────────────────────────────────────────────────────
export const createBooking = async (req, res) => {
  try {
    const { tutorProfileId, name, email, subject, message } = req.body;

    // Kiểm tra gia sư tồn tại và đã được duyệt
    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { id: tutorProfileId },
    });

    if (!tutorProfile || tutorProfile.status !== "APPROVED") {
      return res.status(404).json({
        status: "error",
        message: "Không tìm thấy gia sư",
      });
    }

    // Student không thể tự thuê chính mình
    if (tutorProfile.userId === req.user.id) {
      return res.status(400).json({
        status: "error",
        message: "Bạn không thể gửi yêu cầu cho chính mình",
      });
    }

    // Kiểm tra xem đã có booking PENDING với gia sư này chưa
    const existing = await prisma.bookingRequest.findFirst({
      where: {
        studentId: req.user.id,
        tutorProfileId,
        status: "PENDING",
      },
    });

    if (existing) {
      return res.status(400).json({
        status: "error",
        message: "Bạn đã có yêu cầu đang chờ xử lý với gia sư này",
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
      },
      include: {
        tutorProfile: {
          select: {
            id: true,
            user: { select: { name: true, avatar: true } },
          },
        },
      },
    });

    res.status(201).json({
      status: "success",
      message: "Gửi yêu cầu thành công! Vui lòng chờ gia sư phản hồi.",
      data: { booking },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /bookings/student
// Student xem danh sách booking của mình
// ─────────────────────────────────────────────────────────────
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

    res.status(200).json({
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

// ─────────────────────────────────────────────────────────────
// GET /bookings/tutor
// Tutor xem danh sách booking gửi đến mình
// ─────────────────────────────────────────────────────────────
export const getMyBookingsAsTutor = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    // Lấy tutorProfile của user hiện tại
    let tutorProfile = await prisma.tutorProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!tutorProfile) {
      tutorProfile = await prisma.tutorProfile.create({
        data: { userId: req.user.id, status: "PENDING" },
      });
    }

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

    res.status(200).json({
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

// ─────────────────────────────────────────────────────────────
// GET /bookings/:id
// Xem chi tiết 1 booking (student hoặc tutor liên quan)
// ─────────────────────────────────────────────────────────────
export const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await prisma.bookingRequest.findUnique({
      where: { id },
      include: {
        student: { select: { id: true, name: true, avatar: true, email: true } },
        tutorProfile: {
          select: {
            id: true,
            subjects: true,
            pricePerHour: true,
            userId: true,
            user: { select: { name: true, avatar: true } },
          },
        },
        classSession: true,
      },
    });

    if (!booking) {
      return res.status(404).json({ status: "error", message: "Không tìm thấy booking" });
    }

    // Chỉ student hoặc tutor liên quan mới được xem
    const isTutorOwner = booking.tutorProfile.userId === req.user.id;
    const isStudentOwner = booking.studentId === req.user.id;

    if (!isTutorOwner && !isStudentOwner) {
      return res.status(403).json({ status: "error", message: "Không có quyền truy cập" });
    }

    res.status(200).json({ status: "success", data: { booking } });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /bookings/:id/accept
// Tutor chấp nhận booking → tạo ClassSession
// Body: { scheduledAt, durationMin?, tutorNote? }
// ─────────────────────────────────────────────────────────────
// export const acceptBooking = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { scheduledAt, durationMin = 60, tutorNote } = req.body;

//     if (!scheduledAt) {
//       return res.status(400).json({
//         status: "error",
//         message: "Vui lòng cung cấp thời gian dạy (scheduledAt)",
//       });
//     }

//     const booking = await prisma.bookingRequest.findUnique({
//       where: { id },
//       include: {
//         tutorProfile: { select: { userId: true } },
//       },
//     });

//     if (!booking) {
//       return res.status(404).json({ status: "error", message: "Không tìm thấy booking" });
//     }

//     if (booking.tutorProfile.userId !== req.user.id) {
//       return res.status(403).json({ status: "error", message: "Không có quyền thực hiện" });
//     }

//     if (booking.status !== "PENDING") {
//       return res.status(400).json({
//         status: "error",
//         message: `Booking đang ở trạng thái "${booking.status}", không thể chấp nhận`,
//       });
//     }

//     // Transaction: cập nhật booking + tạo ClassSession cùng lúc
//     const [updatedBooking, classSession] = await prisma.$transaction([
//       prisma.bookingRequest.update({
//         where: { id },
//         data: { status: "ACCEPTED", tutorNote: tutorNote || null },
//       }),
//       prisma.classSession.create({
//         data: {
//           studentId: booking.studentId,
//           tutorProfileId: booking.tutorProfileId,
//           bookingRequestId: booking.id,
//           subject: booking.subject,
//           scheduledAt: new Date(scheduledAt),
//           durationMin: parseInt(durationMin),
//           note: tutorNote || null,
//           status: "CONFIRMED",
//         },
//       }),
//     ]);

//     res.status(200).json({
//       status: "success",
//       message: "Đã chấp nhận yêu cầu và tạo buổi học thành công",
//       data: { booking: updatedBooking, classSession },
//     });
//   } catch (err) {
//     res.status(500).json({ status: "error", message: err.message });
//   }
// };

// ─────────────────────────────────────────────────────────────
// PATCH /bookings/:id/reject
// Tutor từ chối booking
// Body: { tutorNote? }
// ─────────────────────────────────────────────────────────────
export const rejectBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { tutorNote } = req.body;

    const booking = await prisma.bookingRequest.findUnique({
      where: { id },
      include: { tutorProfile: { select: { userId: true } } },
    });

    if (!booking) {
      return res.status(404).json({ status: "error", message: "Không tìm thấy booking" });
    }

    if (booking.tutorProfile.userId !== req.user.id) {
      return res.status(403).json({ status: "error", message: "Không có quyền thực hiện" });
    }

    if (booking.status !== "PENDING") {
      return res.status(400).json({
        status: "error",
        message: `Booking đang ở trạng thái "${booking.status}", không thể từ chối`,
      });
    }

    const updated = await prisma.bookingRequest.update({
      where: { id },
      data: { status: "REJECTED", tutorNote: tutorNote || null },
    });

    res.status(200).json({
      status: "success",
      message: "Đã từ chối yêu cầu",
      data: { booking: updated },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /bookings/:id/cancel
// Student huỷ booking của chính mình (chỉ khi còn PENDING)
// ─────────────────────────────────────────────────────────────
export const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await prisma.bookingRequest.findUnique({ where: { id } });

    if (!booking) {
      return res.status(404).json({ status: "error", message: "Không tìm thấy booking" });
    }

    if (booking.studentId !== req.user.id) {
      return res.status(403).json({ status: "error", message: "Không có quyền thực hiện" });
    }

    if (booking.status !== "PENDING") {
      return res.status(400).json({
        status: "error",
        message: `Booking đang ở trạng thái "${booking.status}", không thể huỷ`,
      });
    }

    const updated = await prisma.bookingRequest.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    res.status(200).json({
      status: "success",
      message: "Đã huỷ yêu cầu thành công",
      data: { booking: updated },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};