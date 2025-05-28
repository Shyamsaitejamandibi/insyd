import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const dummyUsers = [
  {
    name: "Alice Johnson",
    email: "alice@example.com",
    avatar:
      "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
  },
  {
    name: "Bob Smith",
    email: "bob@example.com",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
  },
  {
    name: "Carol Davis",
    email: "carol@example.com",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
  },
  {
    name: "David Wilson",
    email: "david@example.com",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
  },
  {
    name: "Eva Brown",
    email: "eva@example.com",
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
  },
  {
    name: "Frank Miller",
    email: "frank@example.com",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
  },
  {
    name: "Grace Lee",
    email: "grace@example.com",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
  },
  {
    name: "Henry Taylor",
    email: "henry@example.com",
    avatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face",
  },
];

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing data
  await prisma.notification.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const users = await Promise.all(
    dummyUsers.map((userData) =>
      prisma.user.create({
        data: userData,
      })
    )
  );

  console.log(`✅ Created ${users.length} users`);

  // Create some initial follow relationships
  const followRelationships = [
    { follower: users[0].id, following: users[1].id },
    { follower: users[0].id, following: users[2].id },
    { follower: users[1].id, following: users[0].id },
    { follower: users[2].id, following: users[3].id },
    { follower: users[3].id, following: users[0].id },
  ];

  await Promise.all(
    followRelationships.map((rel) =>
      prisma.follow.create({
        data: {
          followerId: rel.follower,
          followingId: rel.following,
        },
      })
    )
  );

  console.log(`✅ Created ${followRelationships.length} follow relationships`);

  // Create some initial notifications
  const notifications = [
    {
      userId: users[1].id,
      type: "FOLLOW" as const,
      title: "New Follower",
      message: `${users[0].name} started following you`,
    },
    {
      userId: users[2].id,
      type: "FOLLOW" as const,
      title: "New Follower",
      message: `${users[0].name} started following you`,
    },
    {
      userId: users[0].id,
      type: "FOLLOW" as const,
      title: "New Follower",
      message: `${users[1].name} started following you`,
    },
  ];

  await Promise.all(
    notifications.map((notif) =>
      prisma.notification.create({
        data: notif,
      })
    )
  );

  console.log(`✅ Created ${notifications.length} notifications`);
  console.log("🎉 Seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
