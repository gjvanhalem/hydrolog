-- This migration adds pH, EC, and PPM fields to the Plant model
-- AlterTable
ALTER TABLE "Plant" ADD COLUMN "ph_min" DECIMAL(4,2);
ALTER TABLE "Plant" ADD COLUMN "ph_max" DECIMAL(4,2);
ALTER TABLE "Plant" ADD COLUMN "ec_min" DECIMAL(4,2);
ALTER TABLE "Plant" ADD COLUMN "ec_max" DECIMAL(4,2);
ALTER TABLE "Plant" ADD COLUMN "ppm_min" INTEGER;
ALTER TABLE "Plant" ADD COLUMN "ppm_max" INTEGER;
ALTER TABLE "Plant" ADD COLUMN "external_id" INTEGER;
