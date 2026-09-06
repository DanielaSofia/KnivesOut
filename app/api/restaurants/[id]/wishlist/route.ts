import { NextRequest, NextResponse } from "next/server";

import { prisma } from "../../../../../lib/prisma";

type WishlistRouteProps = {
  params: Promise<{ id: string }>;
};

async function getContext(id: string) {
  const restaurantId = Number(id);

  if (!Number.isInteger(restaurantId)) {
    return null;
  }

  const [restaurant, user] = await Promise.all([
    prisma.restaurant.findUnique({ where: { id: restaurantId } }),
    prisma.user.findFirst({ orderBy: { id: "asc" } }),
  ]);

  if (!restaurant || !user) {
    return null;
  }

  return { restaurantId, userId: user.id };
}

export async function POST(
  _request: NextRequest,
  { params }: WishlistRouteProps,
) {
  const context = await getContext((await params).id);

  if (!context) {
    return NextResponse.json(
      { error: "Restaurante ou utilizador não encontrado." },
      { status: 404 },
    );
  }

  await prisma.wishlist.upsert({
    where: {
      userId_restaurantId: context,
    },
    update: {},
    create: context,
  });

  return NextResponse.json({ saved: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: WishlistRouteProps,
) {
  const context = await getContext((await params).id);

  if (!context) {
    return NextResponse.json(
      { error: "Restaurante ou utilizador não encontrado." },
      { status: 404 },
    );
  }

  await prisma.wishlist.deleteMany({ where: context });

  return NextResponse.json({ saved: false });
}
