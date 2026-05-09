import { prisma } from "../config/db.js";
import bcrypt from "bcrypt";
import { generateToken } from "../utils/generateToken.js";

const register = async (req, res) => {
  const { name, email, password, role } = req.body;

  // User exists
  const existingUser = await prisma.user.findUnique({
    where: { email: email },
  });
  if (existingUser) {
    return res.status(400).json({ message: "Email đã tồn tại" });
  }

  // Hash Password
  const hashedPassword = await bcrypt.hash(password, 10);

  //validate role
  if (role !== "STUDENT" && role !== "TUTOR") {
    return res.status(400).json({ message: "Vai trò không hợp lệ" });
  }

  // Create new user
  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0ea5e9&color=fff`,
    },
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
      },
      token,
    },
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  // User exists
  const user = await prisma.user.findUnique({
    where: { email: email },
  });

  if (!user) {
    return res.status(400).json({ message: "Email hoặc mật khẩu không đúng" });
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(400).json({ message: "Email hoặc mật khẩu không đúng" });
  }

  // Generate token
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
      },
      token,
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
