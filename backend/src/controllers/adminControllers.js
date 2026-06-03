import { prisma } from "../config/db.js";
import {
  notify,
  notifyWithdrawalCompleted,
} from "../services/notificationService.js";
// Tái sử dụng releasePayment từ paymentControllers thay vì viết lại
import { releasePayment } from "./paymentControllers.js";

// ─────────────────────────────────────────────────────────────
// MIDDLEWARE: isAdmin
// ─────────────────────────────────────────────────────────────
export const isAdmin = (req, res, next) => {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ status: "error", message: "Không có quyền truy cập" });
  }
  next();
};

// ─────────────────────────────────────────────────────────────
// SHARED HELPERS (tái sử dụng pattern từ các controller hiện có)
// ─────────────────────────────────────────────────────────────

/** Tính phân trang — dùng ở mọi list endpoint */
const paginate = (page, limit) => ({
  skip: (parseInt(page) - 1) * parseInt(limit),
  take: parseInt(limit),
});

/** Tái sử dụng pattern recalculate rating từ reviewCourse + deleteReview */
const recalcTutorRating = async (tx, tutorProfileId) => {
  const agg = await tx.review.aggregate({
    where:  { tutorProfileId },
    _avg:   { rating: true },
    _count: { id: true },
  });
  await tx.tutorProfile.update({
    where: { id: tutorProfileId },
    data:  { rating: agg._avg.rating ?? 0, totalReviews: agg._count.id },
  });
};

// ─────────────────────────────────────────────────────────────
// GET /admin/stats
// ─────────────────────────────────────────────────────────────
export const getStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalTutors,
      totalStudents,
      totalCourses,
      activeCourses,
      pendingApprovals,
      reviewStats,
      revenueAgg,
      pendingPayoutsAgg,
    ] = await prisma.$transaction([
      prisma.user.count(),
      prisma.user.count({ where: { role: "TUTOR" } }),
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.courseClass.count(),
      prisma.courseClass.count({ where: { status: { in: ["UPCOMING", "ONGOING"] } } }),
      prisma.tutorProfile.count({ where: { status: { in: ["PENDING", "REVIEWING"] } } }),
      prisma.review.aggregate({ _avg: { rating: true }, _count: { id: true } }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: { in: ["PAID", "RELEASED"] } },
      }),
      prisma.withdrawal.aggregate({
        _sum: { amount: true },
        where: { status: "PENDING" },
      }),
    ]);

    res.status(200).json({
      status: "success",
      data: {
        totalUsers,
        totalTutors,
        totalStudents,
        totalCourses,
        activeCourses,
        pendingApprovals,
        avgRating:     Number((reviewStats._avg.rating ?? 0).toFixed(1)),
        totalReviews:  reviewStats._count.id,
        totalRevenue:  revenueAgg._sum.amount ?? 0,
        pendingPayouts: pendingPayoutsAgg._sum.amount ?? 0,
      },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /admin/users
// Tái sử dụng pattern phân trang từ getMyBookingsAsStudent,
// getMyCoursesAsTutor, getNotifications
// ─────────────────────────────────────────────────────────────
export const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const { skip, take } = paginate(page, limit);

    const where = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { name:  { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: {
          id: true, name: true, email: true,
          role: true, gender: true, avatar: true, createdAt: true,
          tutorProfile: { select: { id: true, status: true } },
          _count: { select: { enrolledCourses: true, bookingsSent: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.status(200).json({
      status: "success",
      data: {
        users,
        pagination: { total, page: parseInt(page), limit: take, totalPages: Math.ceil(total / take) },
      },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /admin/users/:id
// ─────────────────────────────────────────────────────────────
export const getUserById = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, name: true, email: true,
        role: true, gender: true, avatar: true, createdAt: true,
        tutorProfile: {
          include: { educations: true, socialMedia: true, wallet: true },
        },
        enrolledCourses: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true, subject: true, status: true, totalPrice: true, startDate: true,
            tutorProfile: { select: { user: { select: { name: true } } } },
          },
        },
        studentPayments: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: { id: true, amount: true, status: true, createdAt: true },
        },
      },
    });

    if (!user) return res.status(404).json({ status: "error", message: "Không tìm thấy user" });

    res.status(200).json({ status: "success", data: { user } });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /admin/users/:id/suspend
// Với TUTOR: toggle tutorProfile.status SUSPENDED ↔ APPROVED
// Với STUDENT: schema chưa có field isActive → trả hướng dẫn
// ─────────────────────────────────────────────────────────────
export const toggleSuspendUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({ status: "error", message: "Không thể tự khoá chính mình" });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: { tutorProfile: { select: { id: true, status: true } } },
    });
    if (!user) return res.status(404).json({ status: "error", message: "Không tìm thấy user" });

    if (user.role === "TUTOR" && user.tutorProfile) {
      const isSuspended = user.tutorProfile.status === "SUSPENDED";
      const newStatus   = isSuspended ? "APPROVED" : "SUSPENDED";

      await prisma.tutorProfile.update({
        where: { id: user.tutorProfile.id },
        data:  { status: newStatus },
      });

      // Notify gia sư
      await notify({
        userId: id,
        type:   isSuspended ? "BOOKING_RECEIVED" : "BOOKING_REJECTED",
        title:  isSuspended ? "Tài khoản đã được mở khoá" : "Tài khoản bị tạm khoá",
        body:   isSuspended
          ? "Tài khoản gia sư của bạn đã được khôi phục."
          : "Tài khoản của bạn đã bị tạm khoá. Vui lòng liên hệ admin.",
      });

      return res.status(200).json({
        status: "success",
        message: isSuspended ? "Đã mở khoá gia sư" : "Đã tạm khoá gia sư",
      });
    }

    return res.status(400).json({
      status: "error",
      message: "Student chưa hỗ trợ khoá tài khoản. Thêm field isActive Boolean vào model User trong schema.",
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /admin/tutor-approvals
// Tái sử dụng pattern include của getMyProfile (tutorControllers)
// ─────────────────────────────────────────────────────────────
export const getTutorApprovals = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const { skip, take } = paginate(page, limit);

    const where = {
      status: status ? status : { in: ["PENDING", "REVIEWING"] },
    };

    const [profiles, total] = await prisma.$transaction([
      prisma.tutorProfile.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "asc" }, // cũ nhất lên trước
        include: {
          user:       { select: { id: true, name: true, email: true, avatar: true } },
          educations: true,
          socialMedia: true,
        },
      }),
      prisma.tutorProfile.count({ where }),
    ]);

    res.status(200).json({
      status: "success",
      data: {
        profiles,
        pagination: { total, page: parseInt(page), limit: take, totalPages: Math.ceil(total / take) },
      },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /admin/tutors/:id
// Tái sử dụng include pattern của getTutorById (tutorControllers)
// — thêm wallet, không filter status APPROVED như public route
// ─────────────────────────────────────────────────────────────
export const getTutorDetail = async (req, res) => {
  try {
    const profile = await prisma.tutorProfile.findUnique({
      where: { id: req.params.id },
      include: {
        user:       { select: { id: true, name: true, email: true, avatar: true, gender: true, createdAt: true } },
        educations: true,
        socialMedia: true,
        schedules:  true,
        reviews: {
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { student: { select: { name: true, avatar: true } } },
        },
        wallet: true,
        _count: {
          select: { courses: true },
        },
      },
    });

    if (!profile) return res.status(404).json({ status: "error", message: "Không tìm thấy hồ sơ gia sư" });

    res.status(200).json({ status: "success", data: { profile } });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /admin/tutors/:id/approve
// FIX: dùng NotificationType hợp lệ từ schema
// ─────────────────────────────────────────────────────────────
export const approveTutor = async (req, res) => {
  try {
    const profile = await prisma.tutorProfile.findUnique({
      where: { id: req.params.id },
      select: { userId: true, status: true },
    });
    if (!profile) return res.status(404).json({ status: "error", message: "Không tìm thấy hồ sơ" });
    if (profile.status === "APPROVED") {
      return res.status(400).json({ status: "error", message: "Hồ sơ đã được duyệt trước đó" });
    }

    // FIX: submitProfile trong tutorControllers cũng reset adminNote → null, giữ nhất quán
    const updated = await prisma.tutorProfile.update({
      where: { id: req.params.id },
      data:  { status: "APPROVED", adminNote: null },
    });

    // Dùng notify() từ notificationService (tái sử dụng, không gọi prisma.notification.create trực tiếp)
    // FIX: type BOOKING_RECEIVED không đúng ngữ nghĩa — dùng PAYMENT_RECEIVED gần nhất có sẵn
    // → Khuyên thêm enum PROFILE_APPROVED vào schema sau, tạm dùng PAYMENT_RECEIVED
    await notify({
      userId: profile.userId,
      type:   "PAYMENT_RECEIVED", // TODO: thêm PROFILE_APPROVED vào NotificationType enum
      title:  "Hồ sơ đã được duyệt!",
      body:   "Chúc mừng! Hồ sơ gia sư của bạn đã được phê duyệt. Bạn có thể bắt đầu nhận học viên.",
    });

    res.status(200).json({
      status: "success",
      message: "Đã duyệt hồ sơ gia sư",
      data: { profile: updated },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /admin/tutors/:id/reject
// Body: { adminNote }
// ─────────────────────────────────────────────────────────────
export const rejectTutor = async (req, res) => {
  try {
    const { adminNote } = req.body;

    const profile = await prisma.tutorProfile.findUnique({
      where: { id: req.params.id },
      select: { userId: true, status: true },
    });
    if (!profile) return res.status(404).json({ status: "error", message: "Không tìm thấy hồ sơ" });
    if (profile.status === "REJECTED") {
      return res.status(400).json({ status: "error", message: "Hồ sơ đã bị từ chối trước đó" });
    }

    // FIX: submitProfile reset adminNote → null, reject ghi lý do → nhất quán
    const updated = await prisma.tutorProfile.update({
      where: { id: req.params.id },
      data:  { status: "REJECTED", adminNote: adminNote || null },
    });

    await notify({
      userId: profile.userId,
      type:   "BOOKING_REJECTED", // gần nhất về ngữ nghĩa "bị từ chối"
      title:  "Hồ sơ chưa được duyệt",
      body:   adminNote
        ? `Lý do: ${adminNote}`
        : "Hồ sơ của bạn chưa đáp ứng yêu cầu. Vui lòng cập nhật và nộp lại.",
    });

    res.status(200).json({
      status: "success",
      message: "Đã từ chối hồ sơ gia sư",
      data: { profile: updated },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /admin/courses
// Tái sử dụng include pattern của getMyCoursesAsTutor
// ─────────────────────────────────────────────────────────────
export const getCourses = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const { skip, take } = paginate(page, limit);

    const where = {};
    if (status) where.status = status;
    if (search)  where.subject = { contains: search, mode: "insensitive" };

    const [courses, total] = await prisma.$transaction([
      prisma.courseClass.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          student:      { select: { id: true, name: true, avatar: true } },
          tutorProfile: { select: { id: true, user: { select: { name: true, avatar: true } } } },
          payment:      { select: { status: true, amount: true } },
          _count:       { select: { sessions: true } },
        },
      }),
      prisma.courseClass.count({ where }),
    ]);

    res.status(200).json({
      status: "success",
      data: {
        courses,
        pagination: { total, page: parseInt(page), limit: take, totalPages: Math.ceil(total / take) },
      },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /admin/courses/:id
// Tái sử dụng include của getCourseById (courseControllers)
// — admin không cần check quyền truy cập
// ─────────────────────────────────────────────────────────────
export const getCourseById = async (req, res) => {
  try {
    const course = await prisma.courseClass.findUnique({
      where: { id: req.params.id },
      include: {
        student:      { select: { id: true, name: true, email: true, avatar: true } },
        tutorProfile: {
          select: {
            id: true, subjects: true, pricePerHour: true,
            user: { select: { name: true, email: true, avatar: true } },
          },
        },
        schedules: { orderBy: { dayOfWeek: "asc" } },
        sessions:  { orderBy: { sessionNumber: "asc" } },
        review:    true,
        payment:   true,
      },
    });

    if (!course) return res.status(404).json({ status: "error", message: "Không tìm thấy khoá học" });

    res.status(200).json({ status: "success", data: { course } });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /admin/payments
// ─────────────────────────────────────────────────────────────
export const getPayments = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const { skip, take } = paginate(page, limit);

    const where = {};
    if (status) where.status = status;

    const [payments, total] = await prisma.$transaction([
      prisma.payment.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          student:      { select: { id: true, name: true, email: true } },
          tutorProfile: { select: { id: true, user: { select: { name: true } } } },
          courseClass:  { select: { id: true, subject: true } },
        },
      }),
      prisma.payment.count({ where }),
    ]);

    res.status(200).json({
      status: "success",
      data: {
        payments,
        pagination: { total, page: parseInt(page), limit: take, totalPages: Math.ceil(total / take) },
      },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /admin/withdrawals
// ─────────────────────────────────────────────────────────────
export const getWithdrawals = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const { skip, take } = paginate(page, limit);

    const where = {};
    if (status) where.status = status;

    const [withdrawals, total] = await prisma.$transaction([
      prisma.withdrawal.findMany({
        where,
        skip,
        take,
        orderBy: { requestedAt: "desc" },
        include: {
          wallet: {
            include: {
              tutorProfile: { select: { user: { select: { id: true, name: true, email: true } } } },
            },
          },
        },
      }),
      prisma.withdrawal.count({ where }),
    ]);

    res.status(200).json({
      status: "success",
      data: {
        withdrawals,
        pagination: { total, page: parseInt(page), limit: take, totalPages: Math.ceil(total / take) },
      },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /admin/withdrawals/:id/process
// Body: { status: "PROCESSING" | "COMPLETED" | "FAILED" }
// FIX: nếu FAILED → hoàn balance về ví (tái sử dụng logic requestWithdrawal ngược lại)
// ─────────────────────────────────────────────────────────────
export const processWithdrawal = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["PROCESSING", "COMPLETED", "FAILED"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ status: "error", message: `status phải là: ${allowed.join(", ")}` });
    }

    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        status: true,
        amount: true,
        walletId: true,
        wallet: {
          select: {
            tutorProfile: {
              select: {
                userId: true,
                user: { select: { name: true } },
              },
            },
          },
        },
      },
    });
    if (!withdrawal) {
      return res.status(404).json({ status: "error", message: "Không tìm thấy yêu cầu rút tiền" });
    }
    if (withdrawal.status === "COMPLETED") {
      return res.status(400).json({ status: "error", message: "Yêu cầu này đã hoàn tất" });
    }

    const data = { status };
    if (status === "COMPLETED") data.completedAt = new Date();

    if (status === "FAILED") {
      // Hoàn balance — ngược lại với requestWithdrawal (trừ balance khi tạo)
      await prisma.$transaction([
        prisma.withdrawal.update({ where: { id: req.params.id }, data }),
        prisma.tutorWallet.update({
          where: { id: withdrawal.walletId },
          data:  { balance: { increment: withdrawal.amount } },
        }),
      ]);
    } else {
      await prisma.withdrawal.update({ where: { id: req.params.id }, data });
    }

    if (status === "COMPLETED") {
      await notifyWithdrawalCompleted(
        withdrawal,
        withdrawal.wallet.tutorProfile.userId,
        withdrawal.wallet.tutorProfile.user?.name,
      );
    }

    res.status(200).json({ status: "success", message: `Đã cập nhật trạng thái: ${status}` });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /admin/reviews
// "flagged" = rating <= 2 (nhất quán với UI dashboard đang dùng)
// ─────────────────────────────────────────────────────────────
export const getReviews = async (req, res) => {
  try {
    const { page = 1, limit = 20, flagged } = req.query;
    const { skip, take } = paginate(page, limit);

    const where = {};
    if (flagged === "true") where.rating = { lte: 2 };

    const [reviews, total] = await prisma.$transaction([
      prisma.review.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          student:      { select: { id: true, name: true, avatar: true } },
          tutorProfile: { select: { id: true, user: { select: { name: true } } } },
          courseClass:  { select: { subject: true } },
        },
      }),
      prisma.review.count({ where }),
    ]);

    res.status(200).json({
      status: "success",
      data: {
        reviews,
        pagination: { total, page: parseInt(page), limit: take, totalPages: Math.ceil(total / take) },
      },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE /admin/reviews/:id
// Tái sử dụng recalcTutorRating — cùng logic với reviewCourse
// (reviewCourse tính lại sau khi CREATE, đây tính lại sau DELETE)
// ─────────────────────────────────────────────────────────────
export const deleteReview = async (req, res) => {
  try {
    const review = await prisma.review.findUnique({
      where:  { id: req.params.id },
      select: { id: true, tutorProfileId: true },
    });
    if (!review) return res.status(404).json({ status: "error", message: "Không tìm thấy đánh giá" });

    await prisma.$transaction(async (tx) => {
      await tx.review.delete({ where: { id: req.params.id } });
      // Dùng helper dùng chung — cùng logic với reviewCourse trong courseControllers
      await recalcTutorRating(tx, review.tutorProfileId);
    });

    res.status(200).json({
      status: "success",
      message: "Đã xoá đánh giá và cập nhật rating gia sư",
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /admin/subjects
// ─────────────────────────────────────────────────────────────
export const getSubjectsAdmin = async (req, res) => {
  try {
    const { search, isActive } = req.query;

    const where = {};
    if (search) where.name = { contains: search, mode: "insensitive" };
    if (isActive !== undefined) where.isActive = isActive === "true";

    const subjects = await prisma.subject.findMany({
      where,
      orderBy: { name: "asc" },
    });

    res.status(200).json({ status: "success", data: { subjects } });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /admin/subjects
// Body: { name: string }
// ─────────────────────────────────────────────────────────────
export const createSubject = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ status: "error", message: "Tên môn học không được để trống" });
    }

    const subject = await prisma.subject.create({
      data: { name: name.trim() },
    });

    res.status(201).json({ status: "success", data: { subject } });
  } catch (err) {
    // Prisma unique constraint violation
    if (err.code === "P2002") {
      return res.status(409).json({ status: "error", message: "Môn học này đã tồn tại" });
    }
    res.status(500).json({ status: "error", message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /admin/subjects/:id
// Body: { name?, isActive? }
// ─────────────────────────────────────────────────────────────
export const updateSubject = async (req, res) => {
  try {
    const { name, isActive } = req.body;
    const { id } = req.params;

    const exists = await prisma.subject.findUnique({ where: { id } });
    if (!exists) {
      return res.status(404).json({ status: "error", message: "Không tìm thấy môn học" });
    }

    const data = {};
    if (name !== undefined) data.name = name.trim();
    if (isActive !== undefined) data.isActive = isActive;

    const subject = await prisma.subject.update({ where: { id }, data });

    res.status(200).json({ status: "success", data: { subject } });
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({ status: "error", message: "Tên môn học đã được dùng" });
    }
    res.status(500).json({ status: "error", message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE /admin/subjects/:id  — hard delete
// ─────────────────────────────────────────────────────────────
export const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;

    const exists = await prisma.subject.findUnique({ where: { id } });
    if (!exists) {
      return res.status(404).json({ status: "error", message: "Không tìm thấy môn học" });
    }

    await prisma.subject.delete({ where: { id } });

    res.status(200).json({ status: "success", message: "Đã xoá môn học" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};