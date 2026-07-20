const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const latestUsers = await prisma.anonymous_users.findMany({
    orderBy: { created_at: 'desc' },
    take: 5
  });
  console.log("Latest users:", latestUsers);
}
run().catch(console.error).finally(() => prisma.$disconnect());
