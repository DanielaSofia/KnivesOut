import { NextResponse } from "next/server";

import { prisma } from "../../../../lib/prisma";

export async function GET() {
  const count = await prisma.restaurant.count();

  if (count === 0) {
    return NextResponse.json(
      { error: "Ainda não existem restaurantes." },
      { status: 404 },
    );
  }

  const restaurant = await prisma.restaurant.findFirst({
    orderBy: { id: "asc" },
    skip: Math.floor(Math.random() * count),
    select: { id: true },
  });

  return NextResponse.json(restaurant);
}
