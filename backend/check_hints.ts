import { PrismaClient } from '@prisma/client';
import { unsealSecret } from './src/security/secrets';

const prisma = new PrismaClient();

async function main() {
  const cases = await prisma.cases.findMany({
    include: { versions: { include: { case_hints: true } } }
  });
  
  for (const c of cases) {
    if (c.slug === 'o-presente-desaparecido') {
      console.log('Caso:', c.title);
      for (const v of c.versions) {
        console.log('Versão:', v.id);
        for (const hint of v.case_hints) {
           console.log(`Hint ${hint.hint_index}: ${unsealSecret(hint.content_encrypted)}`);
        }
      }
    }
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
