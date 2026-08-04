import type { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const MAX_ALIAS_LENGTH = 24;
const MIN_ALIAS_LENGTH = 3;

export function normalizeAliasSource(value: unknown): string {
  const normalized = String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/@/g, '')
    .replace(/[^a-z0-9._-]+/g, '_')
    .replace(/[.-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, MAX_ALIAS_LENGTH);

  if (normalized.length >= MIN_ALIAS_LENGTH) return normalized;
  return `investigador${normalized ? `_${normalized}` : ''}`.slice(0, MAX_ALIAS_LENGTH);
}

export async function generateUniqueAlias(
  prisma: PrismaClient,
  source: unknown,
  excludeUserId?: string
): Promise<string> {
  const base = normalizeAliasSource(source);

  for (let attempt = 0; attempt < 100; attempt += 1) {
    const suffix = attempt === 0 ? '' : String(attempt + 1);
    const candidate = `${base.slice(0, MAX_ALIAS_LENGTH - suffix.length)}${suffix}`;
    const existing = await prisma.anonymous_users.findFirst({
      where: {
        alias: candidate,
        deleted_at: null,
        ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
      },
      select: { id: true },
    });
    if (!existing) return candidate;
  }

  return `agente_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
}

export async function ensureUserAlias<T extends { id: string; alias?: string | null; email?: string | null; default_display_name?: string | null }>(
  prisma: PrismaClient,
  user: T
): Promise<T & { alias: string }> {
  if (user.alias) return user as T & { alias: string };

  const alias = await generateUniqueAlias(prisma, user.default_display_name || user.email || user.id, user.id);
  const updated = await prisma.anonymous_users.update({
    where: { id: user.id },
    data: { alias },
  });

  return { ...user, alias: updated.alias || alias };
}
