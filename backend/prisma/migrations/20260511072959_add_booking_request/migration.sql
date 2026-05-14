/*
  Warnings:

  - You are about to drop the column `education` on the `tutor_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `isAvailable` on the `tutor_schedules` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[bookingRequestId]` on the table `class_sessions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `tutor_schedules` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TutoringStyle" AS ENUM ('ONE_ON_ONE', 'GROUP', 'BOTH');

-- CreateEnum
CREATE TYPE "TimingShift" AS ENUM ('MORNING', 'AFTERNOON', 'EVENING', 'FLEXIBLE');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED');

-- DropIndex
DROP INDEX "tutor_schedules_tutorProfileId_dayOfWeek_startTime_key";

-- AlterTable
ALTER TABLE "class_sessions" ADD COLUMN     "bookingRequestId" TEXT;

-- AlterTable
ALTER TABLE "tutor_profiles" DROP COLUMN "education",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "daysPerWeek" INTEGER,
ADD COLUMN     "languages" TEXT[],
ADD COLUMN     "preferredAreas" TEXT[],
ADD COLUMN     "qualification" TEXT,
ADD COLUMN     "timingShift" "TimingShift",
ADD COLUMN     "tuitionDuration" INTEGER,
ADD COLUMN     "tutoringStyle" "TutoringStyle";

-- AlterTable
ALTER TABLE "tutor_schedules" DROP COLUMN "isAvailable",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "tutor_educations" (
    "id" TEXT NOT NULL,
    "tutorProfileId" TEXT NOT NULL,
    "universityName" TEXT NOT NULL,
    "fieldOfStudy" TEXT NOT NULL,
    "passingYear" INTEGER NOT NULL,
    "result" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tutor_educations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tutor_social_media" (
    "id" TEXT NOT NULL,
    "tutorProfileId" TEXT NOT NULL,
    "facebook" TEXT,
    "twitter" TEXT,
    "youtube" TEXT,
    "instagram" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tutor_social_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_requests" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "tutorProfileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "tutorNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tutor_social_media_tutorProfileId_key" ON "tutor_social_media"("tutorProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "class_sessions_bookingRequestId_key" ON "class_sessions"("bookingRequestId");

-- AddForeignKey
ALTER TABLE "tutor_educations" ADD CONSTRAINT "tutor_educations_tutorProfileId_fkey" FOREIGN KEY ("tutorProfileId") REFERENCES "tutor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutor_social_media" ADD CONSTRAINT "tutor_social_media_tutorProfileId_fkey" FOREIGN KEY ("tutorProfileId") REFERENCES "tutor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_requests" ADD CONSTRAINT "booking_requests_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_requests" ADD CONSTRAINT "booking_requests_tutorProfileId_fkey" FOREIGN KEY ("tutorProfileId") REFERENCES "tutor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_sessions" ADD CONSTRAINT "class_sessions_bookingRequestId_fkey" FOREIGN KEY ("bookingRequestId") REFERENCES "booking_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
