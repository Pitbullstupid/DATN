-- AlterTable
ALTER TABLE "course_classes" ADD COLUMN     "studentConfirmedEnd" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tutorConfirmedEnd" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "course_sessions" ADD COLUMN     "studentConfirmed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tutorConfirmed" BOOLEAN NOT NULL DEFAULT false;
