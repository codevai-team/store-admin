-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('active', 'inactive', 'deleted');

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "status" "public"."UserStatus" NOT NULL DEFAULT 'active';
