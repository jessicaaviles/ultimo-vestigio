import dotenv from 'dotenv';
dotenv.config({ override: true });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
try {
  const users = await prisma.anonymous_users.findMany({ take: 5, orderBy: { updated_at: 'desc' }, select: { id: true, default_display_name: true, profile_photo_data: true, generated_profile_photo_data: true, portrait_generations: true } });
  users.forEach(u => console.log(JSON.stringify({ id: u.id, name: u.default_display_name, hasPhoto: !!u.profile_photo_data, hasGenerated: !!u.generated_profile_photo_data, gens: u.portrait_generations })));
} finally {
  await prisma.$disconnect();
}
