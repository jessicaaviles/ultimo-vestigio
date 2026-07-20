const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const users = await prisma.anonymous_users.findMany({ take: 5 });
  console.log("Users:", users.map(u => u.id));
  
  if (users.length > 0) {
    const userId = users[0].id;
    console.log("Fetching for user:", userId);
    const res = await fetch(`http://localhost:3001/api/cases?userId=${userId}`);
    const data = await res.json();
    console.log("API Response solvedSlugs:", data.solvedSlugs);
  }
}
run().catch(console.error).finally(() => prisma.$disconnect());
