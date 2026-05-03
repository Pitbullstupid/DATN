import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });

const prisma = new PrismaClient({
  adapter,
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],
});

const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log("Kết nối đến cơ sở dữ liệu thành công!");
  } catch (error) {
    console.error("Lỗi kết nối đến cơ sở dữ liệu:", error);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  await prisma.$disconnect();
  console.log("Đã ngắt kết nối đến cơ sở dữ liệu.");
};

export { connectDB, disconnectDB, prisma };