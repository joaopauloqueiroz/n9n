-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPERADMIN', 'ADMIN');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'ADMIN';

-- Migrate existing data: isSuperAdmin = true -> SUPERADMIN, false -> ADMIN
UPDATE "users" SET "role" = 'SUPERADMIN' WHERE "isSuperAdmin" = true;
UPDATE "users" SET "role" = 'ADMIN' WHERE "isSuperAdmin" = false;

-- DropIndex
DROP INDEX IF EXISTS "users_isSuperAdmin_idx";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "isSuperAdmin";

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

