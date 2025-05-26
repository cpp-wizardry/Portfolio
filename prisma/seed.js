const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.tag.createMany({
    data: [
      { name: "JavaScript", type: "language" },
      { name: "Node.js", type: "technology" },
      { name: "Express", type: "technology" },
      { name: "2 people", type: "teamSize" },
    ],
    skipDuplicates: true,
  });
}

main().finally(() => prisma.$disconnect());
