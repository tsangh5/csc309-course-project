/*
  Warnings:

  - You are about to drop the column `activated` on the `User` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "Promotion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'automatic',
    "minSpending" INTEGER,
    "rate" REAL,
    "points" INTEGER
);

-- CreateTable
CREATE TABLE "_PromotionToUser" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_PromotionToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Promotion" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_PromotionToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "utorid" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "role" TEXT NOT NULL DEFAULT 'regular',
    "expiresAt" DATETIME,
    "resetToken" TEXT,
    "birthday" DATETIME,
    "points" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLogin" DATETIME,
    "avatarUrl" TEXT
);
INSERT INTO "new_User" ("email", "expiresAt", "id", "password", "resetToken", "role", "utorid", "verified") SELECT "email", "expiresAt", "id", "password", "resetToken", "role", "utorid", "verified" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_utorid_key" ON "User"("utorid");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "_PromotionToUser_AB_unique" ON "_PromotionToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_PromotionToUser_B_index" ON "_PromotionToUser"("B");
