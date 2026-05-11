import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Fix all users that have a role but missing roleName
  const users = await prisma.user.findMany({ include: { role: true } });

  for (const user of users) {
    const correctRoleName = user.role?.name || 'EMPLOYEE';
    if (user.roleName !== correctRoleName) {
      await prisma.user.update({
        where: { id: user.id },
        data: { roleName: correctRoleName }
      });
      console.log(`Fixed: ${user.email} -> roleName=${correctRoleName}`);
    } else {
      console.log(`OK: ${user.email} -> roleName=${user.roleName}`);
    }
  }

  console.log('Done.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
