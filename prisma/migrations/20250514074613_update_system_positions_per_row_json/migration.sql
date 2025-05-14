/*
  Warnings:

  - You are about to alter the column `positionsPerRow` on the `System` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Json`.
  - Made the column `systemId` on table `Plant` required. This step will fail if there are existing NULL values in that column.

*/
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
    "systemId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Plant_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "System" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Plant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Plant" ("createdAt", "id", "name", "position", "startDate", "status", "systemId", "type", "updatedAt", "userId") SELECT "createdAt", "id", "name", "position", "startDate", "status", "systemId", "type", "updatedAt", "userId" FROM "Plant";
DROP TABLE "Plant";
ALTER TABLE "new_Plant" RENAME TO "Plant";
CREATE TABLE "new_System" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "rows" INTEGER NOT NULL,
    "positionsPerRow" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_System" ("createdAt", "id", "name", "positionsPerRow", "rows", "updatedAt") SELECT "createdAt", "id", "name", "positionsPerRow", "rows", "updatedAt" FROM "System";
DROP TABLE "System";
ALTER TABLE "new_System" RENAME TO "System";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
