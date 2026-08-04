import { PrismaClient } from '@prisma/client';
import { ensureAuthSchema } from '../src/db/authSchema';

const prisma = new PrismaClient();

async function main() {
  await ensureAuthSchema(prisma);
  console.log('Auth schema sincronizado.');
}

main()
  .catch((error) => {
    console.error('Erro ao sincronizar schema de auth:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
