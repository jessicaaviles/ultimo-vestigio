import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const prisma = new PrismaClient();

async function reset() {
  const result = await prisma.anonymous_users.updateMany({
    data: {
      portrait_generations: 0,
      generated_profile_photo_data: null,
    },
  });
  console.log(`Resetados ${result.count} usuários.`);
  await prisma.$disconnect();
}

reset().catch((err) => {
  console.error('Erro:', err.message);
  process.exit(1);
});
