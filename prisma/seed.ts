import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../app/generated/prisma/client";

const adapter = new PrismaMariaDb({
  host: "localhost",
  port: 3306,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  connectionLimit: 5,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding KnivesOut...");

  const danny = await prisma.user.upsert({
    where: { email: "danny@knivesout.local" },
    update: {},
    create: {
      name: "Danny",
      email: "danny@knivesout.local",
    },
  });

  const wife = await prisma.user.upsert({
    where: { email: "wife@knivesout.local" },
    update: {},
    create: {
      name: "Wife",
      email: "wife@knivesout.local",
    },
  });

  const ramen = await prisma.restaurant.create({
    data: {
      name: "Ramen House",
      description: "Ramen japonês",
      address: "Rua Exemplo 123",
      city: "Braga",
      latitude: 41.5454,
      longitude: -8.4265,
    },
  });

  const pizza = await prisma.restaurant.create({
    data: {
      name: "Pizza Corner",
      description: "Pizza italiana",
      address: "Avenida Exemplo 45",
      city: "Braga",
    },
  });

  const sushi = await prisma.restaurant.create({
    data: {
      name: "Sushi Garden",
      description: "Sushi e cozinha japonesa",
      address: "Rua dos Restaurantes 10",
      city: "Porto",
    },
  });

  await prisma.wishlist.createMany({
    data: [
      {
        userId: danny.id,
        restaurantId: sushi.id,
      },
      {
        userId: wife.id,
        restaurantId: ramen.id,
      },
    ],
    skipDuplicates: true,
  });

  const visit = await prisma.visit.create({
    data: {
      userId: danny.id,
      restaurantId: ramen.id,
      visitedAt: new Date("2026-08-20"),
      notes: "Fomos experimentar o ramen.",
    },
  });

  await prisma.review.create({
    data: {
      userId: danny.id,
      visitId: visit.id,
      rating: 4.5,
      text: "Muito bom! O caldo estava excelente.",
    },
  });

  console.log("✅ Seed concluído");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });