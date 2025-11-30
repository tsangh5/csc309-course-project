/*
  Warnings:

  - Added the required column `expiresAt` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `resetToken` to the `User` table without a default value. This is not possible if the table is not empty.

*/
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
    "expiresAt" DATETIME NOT NULL,
    "resetToken" TEXT NOT NULL
);
INSERT INTO "new_User" ("email", "id", "password", "role", "utorid", "verified") SELECT "email", "id", "password", "role", "utorid", "verified" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_utorid_key" ON "User"("utorid");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
