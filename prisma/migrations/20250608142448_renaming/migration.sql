/*
  Warnings:

  - You are about to drop the column `cpuCont` on the `ServerIntend` table. All the data in the column will be lost.
  - You are about to drop the column `ramCount` on the `ServerIntend` table. All the data in the column will be lost.
  - Added the required column `cpuPercent` to the `ServerIntend` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ramMB` to the `ServerIntend` table without a default value. This is not possible if the table is not empty.

*/
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
    CONSTRAINT "ServerIntend_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ServerIntend_cpuId_fkey" FOREIGN KEY ("cpuId") REFERENCES "CPU" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ServerIntend_ramId_fkey" FOREIGN KEY ("ramId") REFERENCES "RAM" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ServerIntend" ("cpuId", "id", "ramId", "userId") SELECT "cpuId", "id", "ramId", "userId" FROM "ServerIntend";
DROP TABLE "ServerIntend";
ALTER TABLE "new_ServerIntend" RENAME TO "ServerIntend";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
