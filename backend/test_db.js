const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const completedRooms = await prisma.rooms.findMany({
    where: { status: { in: ['COMPLETED', 'GAME_OVER'] } },
    include: {
      players: true,
      case_version: { include: { case_ref: true } }
    }
  });
  console.log("Completed rooms:", completedRooms.map(r => r.case_version.case_ref.slug));
}
run().catch(console.error).finally(() => prisma.$disconnect());
