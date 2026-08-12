-- CreateTable
CREATE TABLE "IdentityEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "role" TEXT,
    "accountStatus" TEXT,
    "status" TEXT,
    "payload" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" DATETIME,
    "nextAttemptAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "IdentityEvent_eventId_key" ON "IdentityEvent"("eventId");

-- CreateIndex
CREATE INDEX "IdentityEvent_state_nextAttemptAt_idx" ON "IdentityEvent"("state", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "IdentityEvent_userId_idx" ON "IdentityEvent"("userId");

-- CreateIndex
CREATE INDEX "IdentityEvent_createdAt_idx" ON "IdentityEvent"("createdAt");
