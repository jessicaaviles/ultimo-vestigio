import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
try {
  const user = await prisma.anonymous_users.findFirst({
    where: { deleted_at: null },
    orderBy: { updated_at: 'desc' },
    select: { id: true, default_display_name: true, portrait_generations: true }
  });
  console.log(JSON.stringify(user));
} finally {
  await prisma.$disconnect();
}
