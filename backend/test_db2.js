const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const rooms = await prisma.rooms.findMany();
  console.log("All rooms:", rooms.map(r => ({ id: r.id, status: r.status })));
}
run().catch(console.error).finally(() => prisma.$disconnect());
