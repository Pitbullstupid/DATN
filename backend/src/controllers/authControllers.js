import { prisma } from "../config/db.js";
import bcrypt from "bcrypt";
import { generateToken } from "../utils/generateToken.js";

const register = async (req, res) => {
  const { name, email, password, role } = req.body;

  // Validate role
  if (role !== "STUDENT" && role !== "TUTOR") {
    return res.status(400).json({ message: "Vai trò không hợp lệ" });
  }

  // User exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });
  if (existingUser) {
    return res.status(400).json({ message: "Email đã tồn tại" });
  }

  // Hash Password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user + tutor profile trong 1 transaction
  const newUser = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0ea5e9&color=fff`,
      },
    });

    // Nếu là TUTOR thì tạo profile trống luôn
    if (role === "TUTOR") {
      await tx.tutorProfile.create({
        data: {
          userId: user.id,
          status: "PENDING", // chưa điền gì
        },
      });
    }

    return user;
  });

  // Generate token
  const token = generateToken(newUser.id, res);

  res.status(201).json({
    status: "success",
    message: "Đăng ký thành công!",
    data: {
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        avatar: newUser.avatar,
        createdAt: newUser.createdAt,
        gender:newUser.gender,
      },
      token,
      // Frontend dựa vào redirect này để điều hướng
      redirect: role === "TUTOR" ? "/tutor/dashboard" : "/",
    },
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
    // Lấy kèm tutorProfile để kiểm tra status khi login
    include: {
      tutorProfile: {
        select: { status: true },
      },
    },
  });

  if (!user) {
    return res.status(400).json({ message: "Email hoặc mật khẩu không đúng" });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(400).json({ message: "Email hoặc mật khẩu không đúng" });
  }

  // Tài khoản TUTOR cũ có thể chưa có hồ sơ — tạo bản ghi trống để API /me/* không 404
  if (user.role === "TUTOR" && !user.tutorProfile) {
    await prisma.tutorProfile.create({
      data: { userId: user.id, status: "PENDING" },
    });
    user.tutorProfile = { status: "PENDING" };
  }

  // Xác định redirect khi login dựa trên trạng thái profile gia sư
  let redirect = "/";
  if (user.role === "TUTOR") {
    redirect = "/tutor/dashboard";
  }

  const token = generateToken(user.id, res);

  res.status(200).json({
    status: "success",
    message: "Đăng nhập thành công!",
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        tutorStatus: user.tutorProfile?.status ?? null,
        createdAt: user.createdAt,
        gender:user.gender
      },
      token,
      redirect,
    },
  });
};

const logout = async (req, res) => {
  res.clearCookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({
    status: "success",
    message: "Đăng xuất thành công",
  });
};


export { register, login, logout };
