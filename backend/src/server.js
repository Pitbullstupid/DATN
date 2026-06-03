import express from "express";
import { config } from "dotenv";
import { connectDB, disconnectDB } from "./config/db.js";
// Import routes
import tutorRoutes from "./routes/tutorRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js"; 
import notificationRoutes from "./routes/notificationRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import subjectRoutes from "./routes/subjectRoutes.js";

import cors from "cors";
import cookieParser from "cookie-parser";

config();
connectDB();

const app = express();
// CORS middleware
app.use(
  cors({
    origin: "http://localhost:5173", // URL của Vite dev server
    credentials: true, // Cho phép gửi cookie
  }),
);

const PORT = 5001;

app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  (await import("./controllers/paymentControllers.js")).stripeWebhook,
);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//API routes
app.use("/api/tutors", tutorRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/payments", paymentRoutes); 
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/subjects", subjectRoutes);
const server = app.listen(PORT, () => {
  console.log(`Backend đang chạy ở cổng http://localhost:${PORT}`);
});

process.on("unhandledRejection", async (error) => {
  console.error(" Lỗi không được xử lý:", error);
  server.close(async () => {
    await disconnectDB();
    process.exit(1);
  });
});
