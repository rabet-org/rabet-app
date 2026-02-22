-- AlterTable
ALTER TABLE "requests" ADD COLUMN     "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "experience_level" TEXT,
ADD COLUMN     "is_urgent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "preferred_language" TEXT DEFAULT 'arabic',
ADD COLUMN     "project_duration" TEXT,
ADD COLUMN     "skills_required" TEXT[] DEFAULT ARRAY[]::TEXT[];
