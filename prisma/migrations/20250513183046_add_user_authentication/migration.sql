/*
  Warnings:

  - Added the required column `userId` to the `Plant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `SystemLog` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- Create a default user for existing data
INSERT INTO "User" ("email", "name", "password", "updatedAt")
VALUES ('admin@hydrolog.com', 'Admin', '$2b$10$RwhKUs4GG8Y.j6qps9C5a.G9/RL7NJEcA6mKQYaO05jRIUpcbWw3W', CURRENT_TIMESTAMP);
-- Note: password is 'password' - this is just for migration purposes and should be changed after login

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Plant" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "position" INTEGER,
    "status" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Plant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
-- Assign all existing plants to the default user (userId = 1)
INSERT INTO "new_Plant" ("createdAt", "id", "name", "position", "startDate", "status", "type", "updatedAt", "userId") 
SELECT "createdAt", "id", "name", "position", "startDate", "status", "type", "updatedAt", 1 FROM "Plant";
DROP TABLE "Plant";
ALTER TABLE "new_Plant" RENAME TO "Plant";
CREATE TABLE "new_PlantLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "plantId" INTEGER NOT NULL,
    "note" TEXT NOT NULL,
    "photo" TEXT,
    "status" TEXT NOT NULL,
    "logDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlantLog_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PlantLog" ("createdAt", "id", "logDate", "note", "photo", "plantId", "status") SELECT "createdAt", "id", "logDate", "note", "photo", "plantId", "status" FROM "PlantLog";
DROP TABLE "PlantLog";
ALTER TABLE "new_PlantLog" RENAME TO "PlantLog";
CREATE TABLE "new_SystemLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "note" TEXT,
    "logDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "SystemLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
-- Assign all existing system logs to the default user (userId = 1)
INSERT INTO "new_SystemLog" ("createdAt", "id", "logDate", "note", "type", "unit", "value", "userId") 
SELECT "createdAt", "id", "logDate", "note", "type", "unit", "value", 1 FROM "SystemLog";
DROP TABLE "SystemLog";
ALTER TABLE "new_SystemLog" RENAME TO "SystemLog";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
