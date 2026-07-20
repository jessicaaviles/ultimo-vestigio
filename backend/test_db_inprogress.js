const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const rooms = await prisma.rooms.findMany({
    where: { status: 'IN_PROGRESS' },
    include: {
      players: true,
      case_version: { include: { case_ref: true } }
    }
  });
  console.log("IN_PROGRESS rooms:");
  rooms.forEach(r => console.log(r.id, r.case_version.case_ref.slug));
}
run().catch(console.error).finally(() => prisma.$disconnect());
