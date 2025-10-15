import { prisma } from "@/prisma";

async function createTestUsers() {
  console.log('Creating test users...');
  
  const testUsers = [];
  for (let i = 1; i <= 10; i++) {
    testUsers.push({
      id: `test-user-${i}`,
      name: `Test User ${i}`,
      email: `testuser${i}@example.com`,
      emailVerified: true,
      ptUsername: `testuser${i}`
    });
  }

  await prisma.user.createMany({
    data: testUsers,
    skipDuplicates: true
  });

  console.log(`Created ${testUsers.length} test users`);
}

if (require.main === module) {
  createTestUsers().then(() => prisma.$disconnect()).catch(console.error);
}

export { createTestUsers };