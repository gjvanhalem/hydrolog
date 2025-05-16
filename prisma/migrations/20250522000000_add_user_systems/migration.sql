-- CreateTable
CREATE TABLE "UserSystem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "systemId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserSystem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserSystem_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "System" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create unique constraint to ensure a user cannot have the same system twice
CREATE UNIQUE INDEX "UserSystem_userId_systemId_key" ON "UserSystem"("userId", "systemId");

-- Create index to improve lookup performance
CREATE INDEX "UserSystem_userId_isActive_idx" ON "UserSystem"("userId", "isActive");

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

-- First migrate existing user-system relationships to the new table
INSERT INTO "UserSystem" ("userId", "systemId", "isActive", "createdAt", "updatedAt")
SELECT "id", "systemId", TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "User"
WHERE "systemId" IS NOT NULL;

-- Then modify the User table to remove systemId
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" STRING NOT NULL,
    "name" STRING,
    "password" STRING NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

INSERT INTO "new_User" ("id", "email", "name", "password", "createdAt", "updatedAt")
SELECT "id", "email", "name", "password", "createdAt", "updatedAt" FROM "User";

DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
