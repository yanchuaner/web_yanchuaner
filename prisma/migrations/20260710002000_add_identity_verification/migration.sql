-- AddColumn
ALTER TABLE "User" ADD COLUMN "verificationStatus" TEXT NOT NULL DEFAULT 'NOT_SUBMITTED';
ALTER TABLE "User" ADD COLUMN "identityType" TEXT;
ALTER TABLE "User" ADD COLUMN "teacherPosition" TEXT;
ALTER TABLE "User" ADD COLUMN "contactVisibility" TEXT NOT NULL DEFAULT 'PRIVATE';

-- Existing accounts used User.status for alumni verification. Preserve that state
-- while keeping new accounts explicitly NOT_SUBMITTED by default.
UPDATE "User"
SET
  "verificationStatus" = CASE UPPER("status")
    WHEN 'VERIFIED' THEN 'VERIFIED'
    WHEN 'REJECTED' THEN 'REJECTED'
    WHEN 'PENDING' THEN 'PENDING'
    ELSE 'NOT_SUBMITTED'
  END,
  "identityType" = CASE
    WHEN UPPER("status") IN ('VERIFIED', 'REJECTED', 'PENDING')
      OR UPPER("role") = 'ALUMNI'
    THEN 'ALUMNI'
    ELSE NULL
  END;

-- CreateTable
CREATE TABLE "IdentityVerificationRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "identityType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "graduationClass" TEXT,
    "className" TEXT,
    "teacherPosition" TEXT,
    "matchResult" TEXT NOT NULL,
    "matchedRosterId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "IdentityVerificationRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "IdentityVerificationRequest_matchedRosterId_fkey" FOREIGN KEY ("matchedRosterId") REFERENCES "WhitelistRoster" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "IdentityVerificationRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "User_verificationStatus_idx" ON "User"("verificationStatus");
CREATE INDEX "User_identityType_idx" ON "User"("identityType");
CREATE INDEX "IdentityVerificationRequest_userId_status_idx" ON "IdentityVerificationRequest"("userId", "status");
CREATE INDEX "IdentityVerificationRequest_status_createdAt_idx" ON "IdentityVerificationRequest"("status", "createdAt");
CREATE INDEX "IdentityVerificationRequest_matchedRosterId_idx" ON "IdentityVerificationRequest"("matchedRosterId");
CREATE INDEX "IdentityVerificationRequest_reviewedById_idx" ON "IdentityVerificationRequest"("reviewedById");

-- SQLite partial unique index: one active request per user while retaining history.
CREATE UNIQUE INDEX "IdentityVerificationRequest_one_pending_per_user"
ON "IdentityVerificationRequest"("userId")
WHERE "status" = 'PENDING';
