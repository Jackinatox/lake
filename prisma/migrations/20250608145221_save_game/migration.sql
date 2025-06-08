-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ServerIntend" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "cpuId" INTEGER NOT NULL,
    "ramId" INTEGER NOT NULL,
    "ramMB" INTEGER NOT NULL,
    "cpuPercent" INTEGER NOT NULL,
    "gameConfig" JSONB,
    "gameDataId" INTEGER,
    CONSTRAINT "ServerIntend_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ServerIntend_gameDataId_fkey" FOREIGN KEY ("gameDataId") REFERENCES "GameData" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ServerIntend_cpuId_fkey" FOREIGN KEY ("cpuId") REFERENCES "CPU" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ServerIntend_ramId_fkey" FOREIGN KEY ("ramId") REFERENCES "RAM" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ServerIntend" ("cpuId", "cpuPercent", "gameConfig", "id", "ramId", "ramMB", "userId") SELECT "cpuId", "cpuPercent", "gameConfig", "id", "ramId", "ramMB", "userId" FROM "ServerIntend";
DROP TABLE "ServerIntend";
ALTER TABLE "new_ServerIntend" RENAME TO "ServerIntend";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
