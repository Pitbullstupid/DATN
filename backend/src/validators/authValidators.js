import { z } from "zod";

// ENUM role (match với Prisma)
const RoleEnum = z.enum(["STUDENT", "TUTOR", "ADMIN"]);

// ---------------- REGISTER ----------------
export const registerSchema = z.object({
  name: z.string().min(1, "Tên không được để trống"),

  email: z
    .string()
    .email("Email không hợp lệ"),

  password: z
    .string()
    .min(6, "Mật khẩu phải >= 6 ký tự"),

  role: RoleEnum,

  gender: z.string().optional(),

  avatar: z.string().url("Avatar phải là URL").optional(),

  // tutor fields
  educationLevel: z.string().optional(),
});

// ---------------- LOGIN ----------------
export const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu không hợp lệ"),
});