import { z } from "zod";

// ── Bước 1: Thông tin cá nhân ─────────────────────────────────
export const step1Schema = z.object({
  bio:     z.string().min(10, "Bio phải có ít nhất 10 ký tự").optional(),
  phone:   z.string().regex(/^\d{9,11}$/, "Số điện thoại không hợp lệ").optional(),
  address: z.string().min(3, "Địa chỉ quá ngắn").optional(),
  country: z.string().min(2, "Quốc gia không hợp lệ").optional(),
  gender:  z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
});

// ── Bước 2: Thông tin dạy học ─────────────────────────────────
export const step2Schema = z.object({
  subjects:       z.array(z.string()).min(1, "Chọn ít nhất 1 môn học").optional(),
  preferredAreas: z.array(z.string()).optional(),
  daysPerWeek:    z.number().int().min(1).max(7).optional(),
  timingShift:    z.enum(["MORNING", "AFTERNOON", "EVENING", "FLEXIBLE"]).optional(),
  pricePerHour:   z.number().positive("Giá phải lớn hơn 0").optional(),
  tutoringStyle:  z.enum(["ONE_ON_ONE", "GROUP", "BOTH"]).optional(),
  experience:     z.number().int().min(0).optional(),
  tuitionDuration:z.number().int().min(1).optional(),
  languages:      z.array(z.string()).optional(),
});

// ── Bước 3: Bằng cấp ─────────────────────────────────────────
export const step3Schema = z.object({
  qualification: z.string().min(2, "Vui lòng nhập bằng cấp").optional(),
  certificate:   z.string().optional(),
});

// ── Mạng xã hội ──────────────────────────────────────────────
export const socialMediaSchema = z.object({
  facebook:  z.string().url("URL không hợp lệ").optional().or(z.literal("")),
  twitter:   z.string().url("URL không hợp lệ").optional().or(z.literal("")),
  youtube:   z.string().url("URL không hợp lệ").optional().or(z.literal("")),
  instagram: z.string().url("URL không hợp lệ").optional().or(z.literal("")),
});

// ── Học vấn ──────────────────────────────────────────────────
export const educationSchema = z.object({
  universityName: z.string().min(2, "Tên trường không hợp lệ"),
  fieldOfStudy:   z.string().min(2, "Ngành học không hợp lệ"),
  passingYear:    z
    .number()
    .int()
    .min(1970)
    .max(new Date().getFullYear(), "Năm tốt nghiệp không hợp lệ"),
  result: z.string().min(1, "Vui lòng nhập kết quả học tập"),
});