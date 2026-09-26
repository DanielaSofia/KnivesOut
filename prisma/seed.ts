import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../app/generated/prisma/client";
import { databaseUrl } from "../prisma.config";

const adapter = new PrismaMariaDb(databaseUrl);

const prisma = new PrismaClient({ adapter });

async function findOrCreateRestaurant(data: {
  name: string;
  description?: string;
  address?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
}) {
  const existing = await prisma.restaurant.findFirst({
    where: {
      name: data.name,
      address: data.address,
      city: data.city,
    },
  });

  return existing ?? prisma.restaurant.create({ data });
}

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

  const ramen = await findOrCreateRestaurant({
    name: "Ramen House",
    description: "Ramen japonês",
    address: "Rua Exemplo 123",
    city: "Braga",
    latitude: 41.5454,
    longitude: -8.4265,
  });

  await findOrCreateRestaurant({
    name: "Pizza Corner",
    description: "Pizza italiana",
    address: "Avenida Exemplo 45",
    city: "Braga",
  });

  const sushi = await findOrCreateRestaurant({
    name: "Sushi Garden",
    description: "Sushi e cozinha japonesa",
    address: "Rua dos Restaurantes 10",
    city: "Porto",
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

  const visit =
    (await prisma.visit.findFirst({
      where: {
        userId: danny.id,
        restaurantId: ramen.id,
        visitedAt: new Date("2026-08-20"),
      },
    })) ??
    (await prisma.visit.create({
      data: {
        userId: danny.id,
        restaurantId: ramen.id,
        visitedAt: new Date("2026-08-20"),
        notes: "Fomos experimentar o ramen.",
      },
    }));

  await prisma.review.upsert({
    where: { visitId: visit.id },
    update: {
      rating: 4.5,
      text: "Muito bom! O caldo estava excelente.",
    },
    create: {
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