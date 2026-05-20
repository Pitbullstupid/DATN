import { prisma } from "../config/db.js";
import bcrypt from "bcrypt";

// ─────────────────────────────────────────────────────────────
// GET /users/me
// Lấy thông tin user hiện tại
// ─────────────────────────────────────────────────────────────
export const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        gender: true,
        avatar: true,
        role: true,
        createdAt: true,
      },
    });
    if (!user)
      return res
        .status(404)
        .json({ status: "error", message: "Không tìm thấy người dùng" });
    res.status(200).json({ status: "success", data: { user } });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /users/me
// Cập nhật thông tin cá nhân (name, gender, avatar)
// ─────────────────────────────────────────────────────────────
export const updateMe = async (req, res) => {
  try {
    const { name, gender, avatar } = req.body;

    // Validate
    if (name !== undefined && !name.trim()) {
      return res
        .status(400)
        .json({ status: "error", message: "Tên không được để trống" });
    }

    const validGenders = ["male", "female", "other", null, ""];
    if (gender !== undefined && !validGenders.includes(gender)) {
      return res
        .status(400)
        .json({ status: "error", message: "Giới tính không hợp lệ" });
    }

    const data = {};
    if (name !== undefined) data.name = name.trim();
    if (gender !== undefined) data.gender = gender || null;
    if (avatar !== undefined) data.avatar = avatar || null;

    if (Object.keys(data).length === 0) {
      return res
        .status(400)
        .json({
          status: "error",
          message: "Không có thông tin nào để cập nhật",
        });
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        gender: true,
        avatar: true,
        role: true,
        createdAt: true,
      },
    });

    res.status(200).json({
      status: "success",
      message: "Cập nhật thông tin thành công",
      data: { user: updated },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /users/me/password
// Đổi mật khẩu
// Body: { currentPassword, newPassword }
// ─────────────────────────────────────────────────────────────
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({
          status: "error",
          message: "Vui lòng nhập đầy đủ mật khẩu cũ và mới",
        });
    }
    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({
          status: "error",
          message: "Mật khẩu mới phải có ít nhất 6 ký tự",
        });
    }
    if (currentPassword === newPassword) {
      return res
        .status(400)
        .json({
          status: "error",
          message: "Mật khẩu mới phải khác mật khẩu cũ",
        });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ status: "error", message: "Mật khẩu hiện tại không đúng" });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashed },
    });

    res
      .status(200)
      .json({ status: "success", message: "Đổi mật khẩu thành công" });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file)
      return res
        .status(400)
        .json({ status: "error", message: "Không có file" });

    // Cloudinary trả về URL qua req.file.path
    const avatarUrl = req.file.path;

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatar: avatarUrl },
      select: {
        id: true,
        name: true,
        email: true,
        gender: true,
        avatar: true,
        role: true,
      },
    });

    res
      .status(200)
      .json({
        status: "success",
        message: "Upload ảnh thành công",
        data: { user: updated },
      });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
