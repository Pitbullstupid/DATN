import express from "express";
import {config} from "dotenv";
import { connectDB, disconnectDB } from "./config/db.js";
// Import routes
import tutorRoutes from "./routes/tutorRoutes.js";
import authRoutes from "./routes/authRoutes.js";

config();
connectDB();

const app = express();

const PORT = 5001;


// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


//API routes
app.use("/api/tutors", tutorRoutes);
app.use("/api/auth", authRoutes);

const server = app.listen(PORT, () =>{
    console.log(`Backend đang chạy ở cổng http://localhost:${PORT}`);
});

process.on("unhandledRejection", async (error) => {
    console.error(" Lỗi không được xử lý:", error);
    server.close(async() => {
        await disconnectDB();
        process.exit(1);
    });
})