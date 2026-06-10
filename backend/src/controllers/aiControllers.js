// OpenRouter API — OpenAI-compatible, free tier với nhiều model
// Tài liệu: https://openrouter.ai/docs
// Đăng ký key tại: https://openrouter.ai/keys

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash"; // free, đọc PDF/ảnh tốt

// ─── Helper: gọi OpenRouter API ──────────────────────────────────
const callAI = async ({ system, messages, max_tokens = 1500 }) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY chưa được cấu hình");

  const formattedMessages = [];

  if (system) {
    formattedMessages.push({ role: "system", content: system });
  }

  for (const msg of messages) {
    formattedMessages.push({ role: msg.role, content: msg.content });
  }

  const payload = {
    model: MODEL,
    messages: formattedMessages,
    max_tokens,
    temperature: 0.1,
  };

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "http://localhost:5001",
      "X-Title": "TutorApp",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    console.error("[OpenRouter error]", JSON.stringify(err, null, 2));
    throw new Error(
      err?.error?.message || `OpenRouter API lỗi: ${response.status}`,
    );
  }

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content ?? "";

  return raw.replace(/```json|```/gi, "").trim();
};

// ─── System prompts ────────────────────────────────────────────────
const CV_SYSTEM_PROMPT = `Bạn là trợ lý trích xuất thông tin từ CV gia sư.
Hãy đọc CV và trả về DUY NHẤT một JSON object, không có text thêm, theo schema:

{
  "step1": {
    "bio":     string | null,
    "phone":   string | null,
    "address": string | null,
    "country": string | null
  },
  "step2": {
    "subjects":        string[]  | null,
    "preferredAreas":  string    | null,
    "daysPerWeek":     number    | null,
    "timingShift":     "MORNING"|"AFTERNOON"|"EVENING"|"FLEXIBLE" | null,
    "pricePerHour":    number    | null,
    "tutoringStyle":   "ONE_ON_ONE"|"GROUP"|"BOTH" | null,
    "experience":      number    | null,
    "tuitionDuration": number    | null,
    "languages":       string    | null
  },
  "step3": {
    "qualification": string | null,
    "certificate":   string | null
  },
  "educations": [
    {
      "universityName": string,
      "fieldOfStudy":   string,
      "passingYear":    number,
      "result":         string
    }
  ]
}

Quy tắc:
- Nếu không tìm được thông tin, đặt null (không đoán).
- subjects: mảng tên môn học (ví dụ: ["Toán", "Vật lý"]).
- preferredAreas, languages: string phân cách bằng dấu phẩy.
- pricePerHour, daysPerWeek, experience, tuitionDuration: số nguyên.
- Chỉ trả JSON, không kèm markdown, không giải thích.`;

const REVIEW_SYSTEM_PROMPT = `Bạn là trợ lý duyệt hồ sơ gia sư cho nền tảng dạy học tại Việt Nam.
Phân tích hồ sơ và trả về DUY NHẤT một JSON object:

{
  "decision":   "APPROVE" | "REJECT" | "NEEDS_REVIEW",
  "confidence": "HIGH" | "MEDIUM" | "LOW",
  "summary":    string (2-3 câu tóm tắt điểm mạnh/yếu),
  "strengths":  string[] (tối đa 4 điểm),
  "concerns":   string[] (tối đa 4 điểm),
  "adminNote":  string (lý do từ chối nếu REJECT/NEEDS_REVIEW, để trống nếu APPROVE)
}

Tiêu chí:
- APPROVE:       đủ thông tin (bio, phone, subjects, qualification, experience ≥ 0)
- REJECT:        thiếu nhiều trường quan trọng hoặc thông tin không hợp lệ
- NEEDS_REVIEW:  thiếu một vài trường nhưng có tiềm năng
- Chỉ trả JSON.`;

// ─────────────────────────────────────────────────────────────────
// POST /ai/parse-cv
// ─────────────────────────────────────────────────────────────────
export const parseCV = async (req, res) => {
  try {
    let base64, mediaType;

    if (req.file) {
      base64 = req.file.buffer.toString("base64");
      mediaType = req.file.mimetype;
    } else if (req.body?.base64 && req.body?.mediaType) {
      base64 = req.body.base64;
      mediaType = req.body.mediaType;
    } else {
      return res
        .status(400)
        .json({ status: "error", message: "Thiếu dữ liệu file" });
    }

    const allowed = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
    ];
    if (!allowed.includes(mediaType)) {
      return res
        .status(400)
        .json({ status: "error", message: "Chỉ hỗ trợ PDF, JPG, PNG, WEBP" });
    }

    if (base64.length > 14_000_000) {
      return res
        .status(400)
        .json({ status: "error", message: "File quá lớn (tối đa ~10MB)" });
    }

    // OpenRouter / Gemini nhận file qua image_url với data URI
    const dataUrl = `data:${mediaType};base64,${base64}`;

    const jsonText = await callAI({
      system: CV_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: dataUrl },
            },
            {
              type: "text",
              text: "Trích xuất thông tin từ CV này.",
            },
          ],
        },
      ],
    });

    const parsed = JSON.parse(jsonText);
    res.status(200).json({ status: "success", data: parsed });
  } catch (err) {
    console.error("[parseCV]", err);
    res.status(500).json({ status: "error", message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────
// POST /ai/review-tutor
// ─────────────────────────────────────────────────────────────────
export const reviewTutor = async (req, res) => {
  try {
    const { profile } = req.body;
    if (!profile) {
      return res
        .status(400)
        .json({ status: "error", message: "Thiếu dữ liệu profile" });
    }

    const profileText = `
HỒ SƠ GIA SƯ:
- Tên: ${profile.user?.name ?? "—"}
- Email: ${profile.user?.email ?? "—"}
- Giới tính: ${profile.user?.gender ?? "—"}

THÔNG TIN CÁ NHÂN:
- Giới thiệu: ${profile.bio ?? "Chưa điền"}
- Điện thoại: ${profile.phone ?? "Chưa điền"}
- Địa chỉ: ${profile.address ?? "Chưa điền"}
- Quốc gia: ${profile.country ?? "Chưa điền"}

THÔNG TIN DẠY HỌC:
- Môn dạy: ${profile.subjects?.join(", ") ?? "Chưa điền"}
- Hình thức: ${profile.tutoringStyle ?? "Chưa điền"}
- Học phí/giờ: ${profile.pricePerHour != null ? `$${profile.pricePerHour.toLocaleString()}` : "Chưa điền"}
- Kinh nghiệm: ${profile.experience != null ? `${profile.experience} năm` : "Chưa điền"}
- Buổi/tuần: ${profile.daysPerWeek ?? "Chưa điền"}
- Ca dạy: ${profile.timingShift ?? "Chưa điền"}
- Ngôn ngữ: ${Array.isArray(profile.languages) ? profile.languages.join(", ") : (profile.languages ?? "Chưa điền")}
- Khu vực: ${Array.isArray(profile.preferredAreas) ? profile.preferredAreas.join(", ") : (profile.preferredAreas ?? "Chưa điền")}

BẰNG CẤP:
- Bằng cấp cao nhất: ${profile.qualification ?? "Chưa điền"}
- Chứng chỉ: ${profile.certificate ?? "Chưa điền"}

HỌC VẤN (${profile.educations?.length ?? 0} mục):
${
  profile.educations?.length > 0
    ? profile.educations
        .map(
          (e) =>
            `  • ${e.universityName} — ${e.fieldOfStudy} (${e.passingYear}) — ${e.result}`,
        )
        .join("\n")
    : "  Chưa có"
}

MẠNG XÃ HỘI:
${
  profile.socialMedia
    ? Object.entries(profile.socialMedia)
        .filter(([k, v]) => !["id", "tutorProfileId"].includes(k) && v)
        .map(([k, v]) => `  • ${k}: ${v}`)
        .join("\n") || "  Chưa có"
    : "  Chưa có"
}
`.trim();

    const jsonText = await callAI({
      system: REVIEW_SYSTEM_PROMPT,
      messages: [
        { role: "user", content: `Phân tích hồ sơ:\n\n${profileText}` },
      ],
    });

    const result = JSON.parse(jsonText);
    res.status(200).json({ status: "success", data: result });
  } catch (err) {
    console.error("[reviewTutor]", err);
    res.status(500).json({ status: "error", message: err.message });
  }
};
