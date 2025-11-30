/*
  Warnings:

  - You are about to drop the `_PromotionToUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "_PromotionToUser_B_index";

-- DropIndex
DROP INDEX "_PromotionToUser_AB_unique";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_PromotionToUser";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Promotion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'automatic',
    "used" BOOLEAN NOT NULL DEFAULT false,
    "minSpending" INTEGER,
    "rate" REAL,
    "points" INTEGER,
    "userId" INTEGER,
    CONSTRAINT "Promotion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Promotion" ("id", "minSpending", "name", "points", "rate", "type") SELECT "id", "minSpending", "name", "points", "rate", "type" FROM "Promotion";
DROP TABLE "Promotion";
ALTER TABLE "new_Promotion" RENAME TO "Promotion";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
