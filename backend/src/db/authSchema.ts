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
}
