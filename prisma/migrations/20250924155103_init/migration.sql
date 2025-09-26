/*
  Warnings:

  - Added the required column `colorCode` to the `colors` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."colors" ADD COLUMN     "colorCode" TEXT NOT NULL;
