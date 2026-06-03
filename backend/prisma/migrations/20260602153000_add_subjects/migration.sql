CREATE TABLE "subjects" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "subjects_name_key" ON "subjects"("name");

INSERT INTO "subjects" ("id", "name", "isActive", "createdAt", "updatedAt")
VALUES
  ('subject-math', 'Math', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('subject-physics', 'Physics', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('subject-chemistry', 'Chemistry', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('subject-biology', 'Biology', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('subject-english', 'English', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('subject-literature', 'Literature', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('subject-history', 'History', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('subject-geography', 'Geography', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('subject-computer-science', 'Computer Science', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('subject-economics', 'Economics', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;
