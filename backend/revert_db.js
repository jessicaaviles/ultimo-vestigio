const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const fakeRooms = await prisma.rooms.findMany({
    where: { recovery_code_hash: 'test' }
  });
  
  const roomIds = fakeRooms.map(r => r.id);
  
  const delPlayers = await prisma.room_players.deleteMany({
    where: { room_id: { in: roomIds } }
  });
  
  const delRooms = await prisma.rooms.deleteMany({
    where: { id: { in: roomIds } }
  });
  
  console.log(`Reverted: deleted ${delPlayers.count} players and ${delRooms.count} rooms.`);
}
run().catch(console.error).finally(() => prisma.$disconnect());
