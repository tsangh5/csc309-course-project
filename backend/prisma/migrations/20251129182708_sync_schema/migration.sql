/*
  Warnings:

  - Added the required column `description` to the `Promotion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endTime` to the `Promotion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startTime` to the `Promotion` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Promotion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "minSpending" REAL,
    "rate" REAL,
    "points" INTEGER
);
INSERT INTO "new_Promotion" ("id", "minSpending", "name", "points", "rate", "type") SELECT "id", "minSpending", "name", "points", "rate", "type" FROM "Promotion";
DROP TABLE "Promotion";
ALTER TABLE "new_Promotion" RENAME TO "Promotion";
CREATE TABLE "new_Transaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "relatedId" INTEGER,
    "userId" INTEGER,
    "awarded" INTEGER,
    "redeemed" INTEGER,
    "spent" REAL,
    "remark" TEXT,
    "promotionIds" TEXT,
    "suspicious" BOOLEAN NOT NULL DEFAULT false,
    "createdById" INTEGER NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedById" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Transaction_relatedId_fkey" FOREIGN KEY ("relatedId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Transaction_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Transaction_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Transaction" ("awarded", "createdAt", "createdById", "id", "processed", "processedById", "redeemed", "relatedId", "remark", "type", "userId") SELECT "awarded", "createdAt", "createdById", "id", "processed", "processedById", "redeemed", "relatedId", "remark", "type", "userId" FROM "Transaction";
DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
