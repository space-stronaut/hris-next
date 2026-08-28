import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function cleanupVirusUsers() {
  console.log("Starting cleanup of virus users...");

  const virusPatterns = [
    /virus/i,
    /malware/i,
    /hack/i,
    /spam/i,
    /test\d{10,}/i,
    /[a-z]{20,}\d+/i,
    /asdfghjkl/i,
    /qwerty/i,
    /zxcvbn/i,
    /123456/i,
    /admin\d{10,}/i,
  ];

  const allUsers = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      name: true,
      createdAt: true,
    },
  });

  console.log(`Total users found: ${allUsers.length}`);

  const virusUsers = allUsers.filter((user) => {
    return virusPatterns.some(
      (pattern) => pattern.test(user.username) || pattern.test(user.name)
    );
  });

  console.log(`Virus users found: ${virusUsers.length}`);

  if (virusUsers.length === 0) {
    console.log("No virus users found. Cleanup complete.");
    return;
  }

  console.log("\nVirus users to be deleted:");
  virusUsers.forEach((user) => {
    console.log(`  - ${user.username} (${user.name}) [ID: ${user.id}]`);
  });

  const confirm = process.argv.includes("--confirm");
  if (!confirm) {
    console.log("\nTo confirm deletion, run with --confirm flag:");
    console.log("  npx tsx scripts/cleanup-virus-users.ts --confirm");
    return;
  }

  const virusIds = virusUsers.map((u) => u.id);

  await prisma.$transaction(async (tx) => {
    await tx.attendance.deleteMany({
      where: { userId: { in: virusIds } },
    });
    await tx.leave.deleteMany({
      where: { userId: { in: virusIds } },
    });
    await tx.payroll.deleteMany({
      where: { userId: { in: virusIds } },
    });
    await tx.claim.deleteMany({
      where: { userId: { in: virusIds } },
    });
    await tx.overtime.deleteMany({
      where: { userId: { in: virusIds } },
    });
    await tx.attendanceCorrection.deleteMany({
      where: { userId: { in: virusIds } },
    });
    await tx.roster.deleteMany({
      where: { userId: { in: virusIds } },
    });
    await tx.notification.deleteMany({
      where: { userId: { in: virusIds } },
    });
    await tx.meetingParticipant.deleteMany({
      where: { userId: { in: virusIds } },
    });
    await tx.user.deleteMany({
      where: { id: { in: virusIds } },
    });
  });

  console.log(`\nSuccessfully deleted ${virusUsers.length} virus users.`);
}

cleanupVirusUsers()
  .catch((e) => {
    console.error("Error during cleanup:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
