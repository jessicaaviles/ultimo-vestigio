import { PrismaClient } from '@prisma/client';

export async function ensureAuthSchema(prisma: PrismaClient) {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "anonymous_users"
      ADD COLUMN IF NOT EXISTS "email" TEXT,
      ADD COLUMN IF NOT EXISTS "password_hash" TEXT,
      ADD COLUMN IF NOT EXISTS "auth_token_hash" TEXT,
      ADD COLUMN IF NOT EXISTS "locale" TEXT DEFAULT 'pt-BR',
      ADD COLUMN IF NOT EXISTS "timezone" TEXT,
      ADD COLUMN IF NOT EXISTS "profile_active" BOOLEAN NOT NULL DEFAULT true,
      ADD COLUMN IF NOT EXISTS "bio" TEXT,
      ADD COLUMN IF NOT EXISTS "profile_photo_data" TEXT,
      ADD COLUMN IF NOT EXISTS "generated_profile_photo_data" TEXT,
      ADD COLUMN IF NOT EXISTS "portrait_generations" INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "profile_photo_updated_at" TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS "onboarding_completed" BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "last_active_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);
  `);

  await ensureFriendshipSchema(prisma);
}

export async function ensureFriendshipSchema(prisma: PrismaClient) {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "anonymous_user_friendships" (
      "id" TEXT NOT NULL,
      "requester_id" TEXT NOT NULL,
      "addressee_id" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'PENDING',
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "anonymous_user_friendships_pkey" PRIMARY KEY ("id")
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "anonymous_user_friendships_requester_id_addressee_id_key"
      ON "anonymous_user_friendships"("requester_id", "addressee_id");
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "anonymous_user_friendships_addressee_id_idx"
      ON "anonymous_user_friendships"("addressee_id");
  `);

  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'anonymous_user_friendships_requester_id_fkey'
      ) THEN
        ALTER TABLE "anonymous_user_friendships"
          ADD CONSTRAINT "anonymous_user_friendships_requester_id_fkey"
          FOREIGN KEY ("requester_id") REFERENCES "anonymous_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'anonymous_user_friendships_addressee_id_fkey'
      ) THEN
        ALTER TABLE "anonymous_user_friendships"
          ADD CONSTRAINT "anonymous_user_friendships_addressee_id_fkey"
          FOREIGN KEY ("addressee_id") REFERENCES "anonymous_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
      END IF;
    END $$;
  `);
}
