-- CreateTable
CREATE TABLE "WechatIdentity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "openid" TEXT NOT NULL,
    "unionid" TEXT,
    "lastLoginAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WechatIdentity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "WechatIdentity_appId_openid_key" ON "WechatIdentity"("appId", "openid");

-- CreateIndex
CREATE UNIQUE INDEX "WechatIdentity_userId_appId_key" ON "WechatIdentity"("userId", "appId");

-- CreateIndex
CREATE INDEX "WechatIdentity_userId_idx" ON "WechatIdentity"("userId");

-- CreateIndex
CREATE INDEX "WechatIdentity_unionid_idx" ON "WechatIdentity"("unionid");
