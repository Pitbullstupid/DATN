/*
  Warnings:

  - You are about to drop the column `classSessionId` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `classSessionId` on the `reviews` table. All the data in the column will be lost.
  - You are about to drop the `class_sessions` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[courseClassId]` on the table `reviews` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `courseClassId` to the `messages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `courseClassId` to the `reviews` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CourseStatus" AS ENUM ('UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED', 'ABSENT');

-- DropForeignKey
ALTER TABLE "class_sessions" DROP CONSTRAINT "class_sessions_bookingRequestId_fkey";

-- DropForeignKey
ALTER TABLE "class_sessions" DROP CONSTRAINT "class_sessions_studentId_fkey";

-- DropForeignKey
ALTER TABLE "class_sessions" DROP CONSTRAINT "class_sessions_tutorProfileId_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_classSessionId_fkey";

-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_classSessionId_fkey";

-- DropIndex
DROP INDEX "reviews_classSessionId_key";

-- AlterTable
ALTER TABLE "booking_requests" ADD COLUMN     "preferredDays" TEXT[],
ADD COLUMN     "preferredTime" TEXT,
ADD COLUMN     "startDate" TIMESTAMP(3),
ADD COLUMN     "totalSessions" INTEGER;

-- AlterTable
ALTER TABLE "messages" DROP COLUMN "classSessionId",
ADD COLUMN     "courseClassId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "reviews" DROP COLUMN "classSessionId",
ADD COLUMN     "courseClassId" TEXT NOT NULL;

-- DropTable
DROP TABLE "class_sessions";

-- DropEnum
DROP TYPE "ClassStatus";

-- CreateTable
CREATE TABLE "course_classes" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "tutorProfileId" TEXT NOT NULL,
    "bookingRequestId" TEXT,
    "subject" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "totalSessions" INTEGER NOT NULL,
    "sessionsDone" INTEGER NOT NULL DEFAULT 0,
    "durationMin" INTEGER NOT NULL DEFAULT 60,
    "pricePerSession" DOUBLE PRECISION,
    "totalPrice" DOUBLE PRECISION,
    "note" TEXT,
    "status" "CourseStatus" NOT NULL DEFAULT 'UPCOMING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_schedules" (
    "id" TEXT NOT NULL,
    "courseClassId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_sessions" (
    "id" TEXT NOT NULL,
    "courseClassId" TEXT NOT NULL,
    "sessionNumber" INTEGER NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "durationMin" INTEGER NOT NULL DEFAULT 60,
    "status" "SessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "course_classes_bookingRequestId_key" ON "course_classes"("bookingRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_courseClassId_key" ON "reviews"("courseClassId");

-- AddForeignKey
ALTER TABLE "course_classes" ADD CONSTRAINT "course_classes_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_classes" ADD CONSTRAINT "course_classes_tutorProfileId_fkey" FOREIGN KEY ("tutorProfileId") REFERENCES "tutor_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_classes" ADD CONSTRAINT "course_classes_bookingRequestId_fkey" FOREIGN KEY ("bookingRequestId") REFERENCES "booking_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_schedules" ADD CONSTRAINT "course_schedules_courseClassId_fkey" FOREIGN KEY ("courseClassId") REFERENCES "course_classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_sessions" ADD CONSTRAINT "course_sessions_courseClassId_fkey" FOREIGN KEY ("courseClassId") REFERENCES "course_classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_courseClassId_fkey" FOREIGN KEY ("courseClassId") REFERENCES "course_classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_courseClassId_fkey" FOREIGN KEY ("courseClassId") REFERENCES "course_classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
