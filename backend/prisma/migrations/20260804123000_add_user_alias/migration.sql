ALTER TABLE "anonymous_users"
  ADD COLUMN IF NOT EXISTS "alias" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "anonymous_users_alias_key"
  ON "anonymous_users"("alias")
  WHERE "alias" IS NOT NULL;
