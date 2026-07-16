ALTER TABLE "User" ADD COLUMN "verificationMethod" TEXT;

CREATE TABLE "RegistrationPolicy" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "accessCodeHash" TEXT,
    "accessCodeHint" TEXT NOT NULL DEFAULT '',
    "accessCodeEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
