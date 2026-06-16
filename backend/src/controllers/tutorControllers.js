import { prisma } from "../config/db.js";
import { notifyAdmin } from "../services/notificationService.js";

// ─────────────────────────────────────────────────────────────
// HELPER: lấy tutorProfile theo userId, ném lỗi nếu không có
// ─────────────────────────────────────────────────────────────
const getOwnProfile = async (userId) => {
  const profile = await prisma.tutorProfile.findUnique({
    where: { userId },
  });
  if (!profile) throw { status: 404, message: "Không tìm thấy hồ sơ gia sư" };
  return profile;
};

// ─────────────────────────────────────────────────────────────
// GET /tutors/me/profile
// Gia sư xem profile đầy đủ của chính mình
// ─────────────────────────────────────────────────────────────
export const getMyProfile = async (req, res) => {
  try {
    let profile = await prisma.tutorProfile.findUnique({
      where: { userId: req.user.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            gender: true,
          },
        },
        educations: true,
        socialMedia: true,
        schedules: true,
      },
    });

    if (!profile) {
      profile = await prisma.tutorProfile.create({
        data: { userId: req.user.id, status: "PENDING" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              gender: true,
            },
          },
          educations: true,
          socialMedia: true,
          schedules: true,
        },
      });
    }

    res.status(200).json({ status: "success", data: { profile } });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /tutors/me/step1
// Bước 1: thông tin cá nhân (bio, phone, address, country)
// ─────────────────────────────────────────────────────────────
export const updateStep1 = async (req, res) => {
  try {
    const { bio, phone, address, country, gender } = req.body;
    const profile = await getOwnProfile(req.user.id);

    // Chỉ block khi đang REVIEWING hoặc SUSPENDED
    // (APPROVED vẫn cho phép cập nhật thông tin cá nhân step 1)
    if (["REVIEWING", "SUSPENDED"].includes(profile.status)) {
      return res.status(403).json({
        status: "error",
        message:
          "Hồ sơ đang được duyệt hoặc đã bị tạm khóa, không thể chỉnh sửa",
      });
    }

    // Validate gender nếu có truyền lên
    const VALID_GENDERS = ["MALE", "FEMALE", "OTHER"];
    if (gender !== undefined && !VALID_GENDERS.includes(gender)) {
      return res.status(400).json({
        status: "error",
        message: "Giá trị giới tính không hợp lệ (MALE | FEMALE | OTHER)",
      });
    }

    // Cập nhật gender lên bảng User (nếu có)
    if (gender !== undefined) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { gender },
      });
    }

    const updated = await prisma.tutorProfile.update({
      where: { userId: req.user.id },
      data: {
        bio,
        phone,
        address,
        country,
        // Nếu đang PENDING → chuyển sang INCOMPLETE (đã bắt đầu điền)
        status: profile.status === "PENDING" ? "INCOMPLETE" : profile.status,
      },
    });

    res.status(200).json({
      status: "success",
      message: "Cập nhật thông tin cá nhân thành công",
      data: { profile: updated },
    });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ status: "error", message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /tutors/me/step2
// Bước 2: thông tin dạy học
// ─────────────────────────────────────────────────────────────
export const updateStep2 = async (req, res) => {
  try {
    const {
      subjects,
      preferredAreas,
      daysPerWeek,
      timingShift,
      pricePerHour,
      tutoringStyle,
      experience,
      tuitionDuration,
      languages,
    } = req.body;

    const profile = await getOwnProfile(req.user.id);

    if (["REVIEWING", "APPROVED", "SUSPENDED"].includes(profile.status)) {
      return res.status(403).json({
        status: "error",
        message:
          "Hồ sơ đang được duyệt hoặc đã được phê duyệt, không thể chỉnh sửa",
      });
    }

    const uniqueSubjects = Array.isArray(subjects)
      ? [...new Set(subjects)]
      : subjects;
    if (Array.isArray(uniqueSubjects) && uniqueSubjects.length > 0) {
      const activeSubjects = await prisma.subject.findMany({
        where: { name: { in: uniqueSubjects }, isActive: true },
        select: { name: true },
      });

      if (activeSubjects.length !== uniqueSubjects.length) {
        return res
          .status(400)
          .json({ status: "error", message: "Môn học không hợp lệ" });
      }
    }

    const updated = await prisma.tutorProfile.update({
      where: { userId: req.user.id },
      data: {
        subjects: uniqueSubjects,
        preferredAreas,
        daysPerWeek,
        timingShift,
        pricePerHour,
        tutoringStyle,
        experience,
        tuitionDuration,
        languages,
        status: profile.status === "PENDING" ? "INCOMPLETE" : profile.status,
      },
    });

    res.status(200).json({
      status: "success",
      message: "Cập nhật thông tin dạy học thành công",
      data: { profile: updated },
    });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ status: "error", message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /tutors/me/step3
// Bước 3: bằng cấp / học vấn tổng quát
// ─────────────────────────────────────────────────────────────
export const updateStep3 = async (req, res) => {
  try {
    const { qualification, certificate } = req.body;
    const profile = await getOwnProfile(req.user.id);

    if (["REVIEWING", "APPROVED", "SUSPENDED"].includes(profile.status)) {
      return res.status(403).json({
        status: "error",
        message:
          "Hồ sơ đang được duyệt hoặc đã được phê duyệt, không thể chỉnh sửa",
      });
    }

    const updated = await prisma.tutorProfile.update({
      where: { userId: req.user.id },
      data: {
        qualification,
        certificate,
        status: profile.status === "PENDING" ? "INCOMPLETE" : profile.status,
      },
    });

    res.status(200).json({
      status: "success",
      message: "Cập nhật bằng cấp thành công",
      data: { profile: updated },
    });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ status: "error", message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /tutors/me/social-media
// Cập nhật mạng xã hội (upsert)
// ─────────────────────────────────────────────────────────────
export const updateSocialMedia = async (req, res) => {
  try {
    const { facebook, twitter, youtube, instagram } = req.body;
    const profile = await getOwnProfile(req.user.id);

    const socialMedia = await prisma.tutorSocialMedia.upsert({
      where: { tutorProfileId: profile.id },
      update: { facebook, twitter, youtube, instagram },
      create: {
        tutorProfileId: profile.id,
        facebook,
        twitter,
        youtube,
        instagram,
      },
    });

    res.status(200).json({
      status: "success",
      message: "Cập nhật mạng xã hội thành công",
      data: { socialMedia },
    });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ status: "error", message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /tutors/me/education
// Thêm 1 bản ghi học vấn
// ─────────────────────────────────────────────────────────────
export const updateEducation = async (req, res) => {
  try {
    const { universityName, fieldOfStudy, passingYear, result } = req.body;
    const profile = await getOwnProfile(req.user.id);

    if (["REVIEWING", "APPROVED", "SUSPENDED"].includes(profile.status)) {
      return res.status(403).json({
        status: "error",
        message:
          "Hồ sơ đang được duyệt hoặc đã được phê duyệt, không thể chỉnh sửa",
      });
    }

    const education = await prisma.tutorEducation.create({
      data: {
        tutorProfileId: profile.id,
        universityName,
        fieldOfStudy,
        passingYear,
        result,
      },
    });

    res.status(201).json({
      status: "success",
      message: "Thêm học vấn thành công",
      data: { education },
    });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ status: "error", message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE /tutors/me/education/:eduId
// Xoá 1 bản ghi học vấn (chỉ xoá của chính mình)
// ─────────────────────────────────────────────────────────────
export const deleteEducation = async (req, res) => {
  try {
    const { eduId } = req.params;
    const profile = await getOwnProfile(req.user.id);

    if (["REVIEWING", "APPROVED", "SUSPENDED"].includes(profile.status)) {
      return res.status(403).json({
        status: "error",
        message:
          "Hồ sơ đang được duyệt hoặc đã được phê duyệt, không thể chỉnh sửa",
      });
    }

    // Kiểm tra bản ghi có thuộc profile này không
    const edu = await prisma.tutorEducation.findFirst({
      where: { id: eduId, tutorProfileId: profile.id },
    });
    if (!edu) {
      return res
        .status(404)
        .json({ status: "error", message: "Không tìm thấy bản ghi học vấn" });
    }

    await prisma.tutorEducation.delete({ where: { id: eduId } });

    res
      .status(200)
      .json({ status: "success", message: "Xoá học vấn thành công" });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ status: "error", message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /tutors/me/submit
// Gia sư nộp hồ sơ → chuyển sang REVIEWING
// ─────────────────────────────────────────────────────────────
export const submitProfile = async (req, res) => {
  try {
    const profile = await prisma.tutorProfile.findUnique({
      where: { userId: req.user.id },
      include: { educations: true },
    });

    if (!profile) {
      return res
        .status(404)
        .json({ status: "error", message: "Không tìm thấy hồ sơ" });
    }

    if (profile.status === "REVIEWING") {
      return res
        .status(400)
        .json({ status: "error", message: "Hồ sơ đang chờ duyệt" });
    }
    if (profile.status === "APPROVED") {
      return res
        .status(400)
        .json({ status: "error", message: "Hồ sơ đã được phê duyệt" });
    }

    // Kiểm tra các trường bắt buộc trước khi submit
    const requiredFields = [
      "bio",
      "phone",
      "subjects",
      "pricePerHour",
      "qualification",
    ];
    const missing = requiredFields.filter((f) => {
      const val = profile[f];
      return (
        val === null ||
        val === undefined ||
        (Array.isArray(val) && val.length === 0)
      );
    });

    if (missing.length > 0) {
      return res.status(400).json({
        status: "error",
        message: `Hồ sơ chưa đầy đủ. Vui lòng điền: ${missing.join(", ")}`,
      });
    }

    const updated = await prisma.tutorProfile.update({
      where: { userId: req.user.id },
      data: { status: "REVIEWING", adminNote: null },
    });
    await notifyAdmin({
      type: "TUTOR_PROFILE_SUBMITTED",
      title: "Hồ sơ gia sư mới",
      body: `${req.user.name} vừa nộp hồ sơ chờ duyệt.`,
      meta: { tutorProfileId: profile.id },
    });
    res.status(200).json({
      status: "success",
      message: "Nộp hồ sơ thành công! Vui lòng chờ admin xét duyệt.",
      data: { profile: updated },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /tutors
// Public: danh sách gia sư APPROVED, có filter & phân trang
// ─────────────────────────────────────────────────────────────
export const getAllTutors = async (req, res) => {
  try {
    const {
      subject,
      area,
      minPrice,
      maxPrice,
      tutoringStyle,
      timingShift,
      page = 1,
      limit = 12,
    } = req.query;

    const where = { status: "APPROVED" };

    if (subject) {
      where.subjects = { has: subject };
    }
    if (area) {
      where.preferredAreas = { has: area };
    }
    if (tutoringStyle) {
      where.tutoringStyle = tutoringStyle;
    }
    if (timingShift) {
      where.timingShift = timingShift;
    }
    if (minPrice || maxPrice) {
      where.pricePerHour = {};
      if (minPrice) where.pricePerHour.gte = parseFloat(minPrice);
      if (maxPrice) where.pricePerHour.lte = parseFloat(maxPrice);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [tutors, total] = await prisma.$transaction([
      prisma.tutorProfile.findMany({
        where,
        skip,
        take,
        orderBy: { rating: "desc" },
        select: {
          id: true,
          bio: true,
          subjects: true,
          preferredAreas: true,
          pricePerHour: true,
          tutoringStyle: true,
          timingShift: true,
          experience: true,
          rating: true,
          totalReviews: true,
          daysPerWeek: true,
          user: {
            select: { id: true, name: true, avatar: true, gender: true },
          },
        },
      }),
      prisma.tutorProfile.count({ where }),
    ]);

    res.status(200).json({
      status: "success",
      data: {
        tutors,
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
// GET /tutors/:id
// Public: xem profile công khai của 1 gia sư
// ─────────────────────────────────────────────────────────────
export const getTutorById = async (req, res) => {
  try {
    const { id } = req.params;

    const profile = await prisma.tutorProfile.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, avatar: true, gender: true } },
        educations: true,
        socialMedia: true,
        schedules: true,
        reviews: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            student: { select: { name: true, avatar: true } },
          },
        },
      },
    });

    if (!profile || profile.status !== "APPROVED") {
      return res
        .status(404)
        .json({ status: "error", message: "Không tìm thấy gia sư" });
    }

    res.status(200).json({ status: "success", data: { profile } });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
