import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { prisma } from "../../../../../lib/prisma";

type VisitRouteProps = {
  params: Promise<{ id: string }>;
};

export async function POST(
  request: NextRequest,
  { params }: VisitRouteProps,
) {
  const restaurantId = Number((await params).id);

  if (!Number.isInteger(restaurantId)) {
    return NextResponse.json(
      { error: "Restaurante inválido." },
      { status: 400 },
    );
  }

  try {
    const body = await request.json();
    const [restaurant, user] = await Promise.all([
      prisma.restaurant.findUnique({ where: { id: restaurantId } }),
      prisma.user.findFirst({ orderBy: { id: "asc" } }),
    ]);

    if (!restaurant || !user) {
      return NextResponse.json(
        { error: "Restaurante ou utilizador não encontrado." },
        { status: 404 },
      );
    }

    const rating = Number(body.rating);
    const hasRating = Number.isFinite(rating) && rating >= 0.5 && rating <= 5;
    const visitedAt = body.visitedAt ? new Date(body.visitedAt) : new Date();

    if (Number.isNaN(visitedAt.getTime())) {
      return NextResponse.json(
        { error: "A data da visita é inválida." },
        { status: 400 },
      );
    }

    const visit = await prisma.visit.create({
      data: {
        userId: user.id,
        restaurantId,
        visitedAt,
        notes: typeof body.notes === "string" ? body.notes.trim() || null : null,
        review: hasRating
          ? {
              create: {
                userId: user.id,
                rating,
                text:
                  typeof body.review === "string"
                    ? body.review.trim() || null
                    : null,
              },
            }
          : undefined,
      },
      include: { review: true },
    });

    revalidatePath("/");
    revalidatePath(`/restaurants/${restaurantId}`);

    return NextResponse.json(visit, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível registar a visita." },
      { status: 500 },
    );
  }
}
