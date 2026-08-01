import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const email = String(process.argv[2] || process.env.PROFILE_EMAIL || '').trim().toLowerCase();

if (!email || !email.includes('@')) {
  console.error('Uso: npm run profile:reset-portraits -- email@exemplo.com');
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.anonymous_users.findMany({
    where: { email },
    select: {
      id: true,
      email: true,
      default_display_name: true,
      portrait_generations: true,
    },
  });

  if (users.length === 0) {
    console.log(`Nenhum usuário encontrado para ${email}.`);
    process.exitCode = 2;
    return;
  }

  const result = await prisma.anonymous_users.updateMany({
    where: { email },
    data: { portrait_generations: 0 },
  });

  console.log(`Resetados ${result.count} usuário(s) para ${email}.`);
  for (const user of users) {
    console.log(
      `- ${user.id} | ${user.default_display_name || 'sem nome'} | geracoes: ${user.portrait_generations ?? 0} -> 0`,
    );
  }
}

main()
  .catch((error) => {
    console.error('Erro ao resetar geracoes de retrato:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
