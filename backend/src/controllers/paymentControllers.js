import Stripe from "stripe";
import { prisma } from "../config/db.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ─────────────────────────────────────────────────────────────
// POST /payments/checkout/:courseId
// Student tạo Stripe Checkout Session để thanh toán
// ─────────────────────────────────────────────────────────────
export const createCheckoutSession = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await prisma.courseClass.findUnique({
      where: { id: courseId },
      include: {
        tutorProfile: { select: { userId: true, user: { select: { name: true } } } },
        student:      { select: { id: true, name: true, email: true } },
      },
    });

    if (!course) return res.status(404).json({ status: "error", message: "Không tìm thấy khóa học" });
    if (course.studentId !== req.user.id) return res.status(403).json({ status: "error", message: "Không có quyền" });
    if (course.status !== "PENDING_PAYMENT") return res.status(400).json({ status: "error", message: "Khóa học không cần thanh toán" });
    if (!course.totalPrice) return res.status(400).json({ status: "error", message: "Khóa học chưa có thông tin học phí" });

    // Kiểm tra đã có payment chưa
    const existingPayment = await prisma.payment.findUnique({ where: { courseClassId: courseId } });
    if (existingPayment?.status === "PAID") {
      return res.status(400).json({ status: "error", message: "Khóa học đã được thanh toán" });
    }

    // Tạo Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: course.student.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Khóa học: ${course.subject}`,
              description: `Gia sư: ${course.tutorProfile.user.name} · ${course.totalSessions} buổi × ${course.durationMin} phút`,
            },
            unit_amount: Math.round(course.totalPrice * 100), // Stripe tính bằng cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        courseClassId: course.id,
        studentId:     course.studentId,
        tutorProfileId: course.tutorProfileId,
      },
      success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${process.env.CLIENT_URL}/payment/cancel?course_id=${course.id}`,
    });

    // Upsert Payment record với status PENDING
    await prisma.payment.upsert({
      where: { courseClassId: courseId },
      update: { stripeSessionId: session.id, status: "PENDING" },
      create: {
        courseClassId:  courseId,
        studentId:      course.studentId,
        tutorProfileId: course.tutorProfileId,
        amount:         course.totalPrice,
        currency:       "usd",
        status:         "PENDING",
        stripeSessionId: session.id,
      },
    });

    res.status(200).json({
      status: "success",
      data: { url: session.url, sessionId: session.id },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /payments/webhook
// Stripe gọi khi có sự kiện (raw body required)
// ─────────────────────────────────────────────────────────────
export const stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body, // raw buffer
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    await handlePaymentSuccess(session);
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object;
    await prisma.payment.updateMany({
      where: { stripeSessionId: session.id },
      data:  { status: "FAILED" },
    });
  }

  res.json({ received: true });
};

// ─── Xử lý thanh toán thành công ─────────────────────────────
const handlePaymentSuccess = async (session) => {
  const { courseClassId, tutorProfileId } = session.metadata;

  await prisma.$transaction(async (tx) => {
    const existingPayment = await tx.payment.findUnique({
      where: { courseClassId },
    });

    if (!existingPayment) {
      throw new Error("Payment not found");
    }

    if (["PAID", "RELEASED"].includes(existingPayment.status)) {
      return;
    }

    // 1. Cập nhật Payment → PAID
    const payment = await tx.payment.update({
      where:  { courseClassId },
      data: {
        status:               "PAID",
        stripePaymentIntent:  session.payment_intent,
        paidAt:               new Date(),
      },
    });

    // 2. CourseClass → UPCOMING (bắt đầu được học)
    await tx.courseClass.update({
      where: { id: courseClassId },
      data:  { status: "UPCOMING" },
    });

    // 3. Upsert TutorWallet — cộng vào heldAmount (chưa rút được)
    await tx.tutorWallet.upsert({
      where:  { tutorProfileId },
      update: {
        heldAmount:  { increment: payment.amount },
        totalEarned: { increment: payment.amount },
      },
      create: {
        tutorProfileId,
        heldAmount:  payment.amount,
        totalEarned: payment.amount,
        balance:     0,
      },
    });
  });
};

// ─────────────────────────────────────────────────────────────
// GET /payments/course/:courseId
// Xem trạng thái thanh toán của 1 khóa học
// ─────────────────────────────────────────────────────────────
export const getPaymentByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await prisma.courseClass.findUnique({ where: { id: courseId } });
    if (!course) return res.status(404).json({ status: "error", message: "Không tìm thấy khóa học" });

    // Chỉ student hoặc tutor liên quan
    const tutorProfile = await prisma.tutorProfile.findUnique({ where: { userId: req.user.id } });
    const isTutor   = tutorProfile && course.tutorProfileId === tutorProfile.id;
    const isStudent = course.studentId === req.user.id;
    if (!isTutor && !isStudent) return res.status(403).json({ status: "error", message: "Không có quyền" });

    const payment = await prisma.payment.findUnique({
      where: { courseClassId: courseId },
      select: {
        id: true, amount: true, currency: true, status: true,
        paidAt: true, releasedAt: true, createdAt: true,
      },
    });

    res.status(200).json({ status: "success", data: { payment } });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /payments/wallet
// Tutor xem ví của mình
// ─────────────────────────────────────────────────────────────
export const getMyWallet = async (req, res) => {
  try {
    const tutorProfile = await prisma.tutorProfile.findUnique({ where: { userId: req.user.id } });
    if (!tutorProfile) return res.status(404).json({ status: "error", message: "Không tìm thấy hồ sơ gia sư" });

    const wallet = await prisma.tutorWallet.findUnique({
      where: { tutorProfileId: tutorProfile.id },
      include: {
        withdrawals: {
          orderBy: { requestedAt: "desc" },
          take: 10,
        },
      },
    });

    // Lấy danh sách payment đã RELEASED (có thể rút)
    const releasedPayments = await prisma.payment.findMany({
      where: { tutorProfileId: tutorProfile.id, status: "RELEASED" },
      include: {
        courseClass: { select: { subject: true, totalSessions: true } },
      },
      orderBy: { releasedAt: "desc" },
    });

    res.status(200).json({
      status: "success",
      data: {
        wallet: wallet ?? { balance: 0, heldAmount: 0, totalEarned: 0, withdrawals: [] },
        releasedPayments,
      },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /payments/release/:courseId   (internal / admin trigger)
// Giải phóng tiền cho tutor sau khi khóa học COMPLETED
// Được gọi tự động trong courseControllers khi cả 2 confirm end
// ─────────────────────────────────────────────────────────────
export const releasePayment = async (courseId) => {
  const payment = await prisma.payment.findUnique({ where: { courseClassId: courseId } });
  if (!payment || payment.status !== "PAID") return;

  await prisma.$transaction(async (tx) => {
    // Payment → RELEASED
    await tx.payment.update({
      where: { id: payment.id },
      data:  { status: "RELEASED", releasedAt: new Date() },
    });

    // Wallet: chuyển từ heldAmount → balance
    await tx.tutorWallet.update({
      where: { tutorProfileId: payment.tutorProfileId },
      data: {
        heldAmount: { decrement: payment.amount },
        balance:    { increment: payment.amount },
      },
    });
  });
};

// ─────────────────────────────────────────────────────────────
// POST /payments/withdraw
// Tutor yêu cầu rút tiền
// Body: { amount }
// ─────────────────────────────────────────────────────────────
export const requestWithdrawal = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ status: "error", message: "Số tiền không hợp lệ" });
    }

    const tutorProfile = await prisma.tutorProfile.findUnique({ where: { userId: req.user.id } });
    if (!tutorProfile) return res.status(404).json({ status: "error", message: "Không tìm thấy hồ sơ gia sư" });

    const wallet = await prisma.tutorWallet.findUnique({ where: { tutorProfileId: tutorProfile.id } });
    if (!wallet) return res.status(400).json({ status: "error", message: "Chưa có ví" });

    const withdrawAmount = parseFloat(amount);
    if (withdrawAmount > wallet.balance) {
      return res.status(400).json({
        status: "error",
        message: `Số dư không đủ. Số dư hiện tại: $${wallet.balance.toFixed(2)}`,
      });
    }

    // Tạo Stripe Payout (cần tutor đã connect Stripe account)
    // Nếu chưa có stripeAccountId thì chỉ ghi record, admin xử lý thủ công
    const withdrawal = await prisma.$transaction(async (tx) => {
      const w = await tx.withdrawal.create({
        data: {
          walletId: wallet.id,
          amount:   withdrawAmount,
          status:   "PENDING",
        },
      });

      // Trừ balance ngay
      await tx.tutorWallet.update({
        where: { id: wallet.id },
        data:  { balance: { decrement: withdrawAmount } },
      });

      return w;
    });

    res.status(201).json({
      status: "success",
      message: "Yêu cầu rút tiền đã được ghi nhận. Sẽ được xử lý trong 1-3 ngày làm việc.",
      data: { withdrawal },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /payments/success
// Sau khi Stripe redirect về — xác nhận lại trạng thái
// ─────────────────────────────────────────────────────────────
export const verifyPayment = async (req, res) => {
  try {
    const { session_id } = req.query;
    if (!session_id) return res.status(400).json({ status: "error", message: "Thiếu session_id" });

    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === "paid") {
      await handlePaymentSuccess(session);
    }

    const payment = await prisma.payment.findUnique({
      where: { stripeSessionId: session_id },
      include: {
        courseClass: {
          select: {
            id: true, subject: true, status: true,
            totalSessions: true, totalPrice: true,
          },
        },
      },
    });

    if (!payment) return res.status(404).json({ status: "error", message: "Không tìm thấy giao dịch" });

    res.status(200).json({
      status: "success",
      data: {
        paymentStatus: payment.status,
        courseStatus:  payment.courseClass.status,
        course:        payment.courseClass,
        stripeStatus:  session.payment_status,
      },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
