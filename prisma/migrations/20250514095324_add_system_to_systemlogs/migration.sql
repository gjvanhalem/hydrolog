-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SystemLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "note" TEXT,
    "logDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "systemId" INTEGER,
    "systemName" TEXT,
    CONSTRAINT "SystemLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SystemLog_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "System" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_SystemLog" ("createdAt", "id", "logDate", "note", "type", "unit", "userId", "value") SELECT "createdAt", "id", "logDate", "note", "type", "unit", "userId", "value" FROM "SystemLog";
DROP TABLE "SystemLog";
ALTER TABLE "new_SystemLog" RENAME TO "SystemLog";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
