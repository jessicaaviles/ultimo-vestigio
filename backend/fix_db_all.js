const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const users = await prisma.anonymous_users.findMany();
  
  const cases = await prisma.cases.findMany();
  const guarda = cases.find(c => c.slug === 'o-guarda-chuva-molhado');
  
  const v1 = await prisma.case_versions.findFirst({ where: { case_id: guarda.slug } });
  
  let added = 0;
  for (const user of users) {
    if (v1) {
      // Check if user already has a finished room for this case
      const existing = await prisma.room_players.findFirst({
        where: { anonymous_user_id: user.id, room: { status: { in: ['GAME_OVER', 'COMPLETED'] }, case_version_id: v1.id } }
      });
      if (!existing) {
        const room1 = await prisma.rooms.create({
          data: {
            public_code: Math.random().toString(36).substring(7),
            recovery_code_hash: 'test',
            host_user_id: user.id,
            case_version_id: v1.id,
            status: 'GAME_OVER',
            settings: '{}',
            expires_at: new Date()
          }
        });
        await prisma.room_players.create({
          data: {
            room_id: room1.id,
            anonymous_user_id: user.id,
            display_name: user.default_display_name || 'Test',
            connection_status: 'DISCONNECTED',
            ready_status: 'READY'
          }
        });
        added++;
      }
    }
  }
  console.log("Done injecting fake rooms for all users. Added:", added);
}
run().catch(console.error).finally(() => prisma.$disconnect());
