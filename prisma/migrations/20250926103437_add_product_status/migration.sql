-- CreateEnum
CREATE TYPE "public"."ProductStatus" AS ENUM ('active', 'inactive', 'deleted');

-- AlterTable
ALTER TABLE "public"."products" ADD COLUMN     "status" "public"."ProductStatus" NOT NULL DEFAULT 'active';
