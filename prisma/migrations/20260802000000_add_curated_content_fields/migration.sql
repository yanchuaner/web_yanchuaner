ALTER TABLE "News" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'ALUMNI_UPDATE';
ALTER TABLE "News" ADD COLUMN "sourceName" TEXT;
ALTER TABLE "News" ADD COLUMN "sourceUrl" TEXT;
ALTER TABLE "News" ADD COLUMN "contentFormat" TEXT NOT NULL DEFAULT 'PLAIN';

ALTER TABLE "MemoryItem" ADD COLUMN "href" TEXT;

CREATE INDEX "News_status_category_idx" ON "News"("status", "category");
