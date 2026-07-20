const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const players = await prisma.room_players.findMany({
    where: { room_id: 'e53e1c79-beb9-41e7-b095-e47f926e68fb' }
  });
  console.log("Players in room:", players.map(p => p.anonymous_user_id));
}
run().catch(console.error).finally(() => prisma.$disconnect());
