import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const prisma = new PrismaClient();
const EMAIL = 'jessica.aviles16@gmail.com';

async function clean() {
  const users = await prisma.anonymous_users.findMany({
    where: { email: EMAIL },
    orderBy: { portrait_generations: 'desc' },
  });

  if (users.length === 0) {
    console.log('Nenhum usuário encontrado com esse email.');
    // Try finding by partial match
    const all = await prisma.anonymous_users.findMany({ where: { email: { contains: 'jessica' } } });
    console.log(`Usuários com 'jessica' no email: ${all.length}`);
    for (const u of all) {
      console.log(`  ${u.id} | email: ${u.email} | gens: ${u.portrait_generations} | hasPhoto: ${Boolean(u.profile_photo_data || u.generated_profile_photo_data)} | name: ${u.default_display_name}`);
    }
    await prisma.$disconnect();
    return;
  }

  console.log(`Encontrados ${users.length} usuários com email ${EMAIL}:`);
  for (const u of users) {
    console.log(`  - ID: ${u.id}`);
    console.log(`    name: ${u.default_display_name}`);
    console.log(`    bio: ${(u.bio || '').slice(0, 40)}`);
    console.log(`    portrait_generations: ${u.portrait_generations}`);
    console.log(`    hasPhoto: ${Boolean(u.profile_photo_data || u.generated_profile_photo_data)}`);
    console.log(`    hasGeneratedPortrait: ${Boolean(u.generated_profile_photo_data)}`);
    console.log();
  }

  // Delete all
  console.log('Deletando todos os registros...');
  const result = await prisma.anonymous_users.deleteMany({
    where: { email: EMAIL },
  });
  console.log(`Deletados ${result.count} registros.`);
  console.log('Pronto! Agora pode criar um novo perfil do zero.');

  await prisma.$disconnect();
}

clean().catch((err) => {
  console.error('Erro:', err.message);
  process.exit(1);
});
