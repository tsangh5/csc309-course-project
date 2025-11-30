/*
  Warnings:

  - You are about to drop the column `used` on the `Promotion` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Promotion` table. All the data in the column will be lost.
  - You are about to alter the column `minSpending` on the `Promotion` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.
  - You are about to drop the column `expiresAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `resetToken` on the `User` table. All the data in the column will be lost.
  - Added the required column `name` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "UserPromotion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "promotionId" INTEGER NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "UserPromotion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserPromotion_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Promotion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "minSpending" REAL,
    "rate" REAL,
    "points" INTEGER
);
INSERT INTO "new_Promotion" ("id", "minSpending", "name", "points", "rate", "type") SELECT "id", "minSpending", "name", "points", "rate", "type" FROM "Promotion";
DROP TABLE "Promotion";
ALTER TABLE "new_Promotion" RENAME TO "Promotion";
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "utorid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'regular',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "birthday" DATETIME,
    "points" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLogin" DATETIME,
    "avatarUrl" TEXT
);
INSERT INTO "new_User" ("avatarUrl", "birthday", "createdAt", "email", "id", "lastLogin", "password", "points", "role", "utorid", "verified") SELECT "avatarUrl", "birthday", "createdAt", "email", "id", "lastLogin", "password", "points", "role", "utorid", "verified" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_utorid_key" ON "User"("utorid");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "UserPromotion_userId_promotionId_key" ON "UserPromotion"("userId", "promotionId");
