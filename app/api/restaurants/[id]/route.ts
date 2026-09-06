import { NextRequest, NextResponse } from "next/server";

import { prisma } from "../../../../lib/prisma";

type RestaurantRouteProps = {
  params: Promise<{ id: string }>;
};

export async function DELETE(
  _request: NextRequest,
  { params }: RestaurantRouteProps,
) {
  const restaurantId = Number((await params).id);

  if (!Number.isInteger(restaurantId)) {
    return NextResponse.json(
      { error: "Restaurante inválido." },
      { status: 400 },
    );
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { id: true },
  });

  if (!restaurant) {
    return NextResponse.json(
      { error: "Restaurante não encontrado." },
      { status: 404 },
    );
  }

  await prisma.restaurant.delete({ where: { id: restaurantId } });

  return NextResponse.json({ deleted: true });
}
