-- Make PlantLog note field optional
ALTER TABLE "PlantLog" ALTER COLUMN "note" DROP NOT NULL;
