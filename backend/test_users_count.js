const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const c = await prisma.anonymous_users.count();
  console.log("Total users:", c);
}
run().catch(console.error).finally(() => prisma.$disconnect());
