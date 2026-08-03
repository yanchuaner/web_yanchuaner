ALTER TABLE "News" ADD COLUMN "visibility" TEXT NOT NULL DEFAULT 'MEMBER';

UPDATE "News"
SET "visibility" = 'PUBLIC'
WHERE "id" LIKE 'wechat-%' AND "status" = 'PUBLISHED';

CREATE INDEX "News_status_visibility_category_idx" ON "News"("status", "visibility", "category");
