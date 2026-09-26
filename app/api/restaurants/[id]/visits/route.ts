import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { prisma } from "../../../../../lib/prisma";
import { getCurrentUser } from "../../../../../lib/session";
import { readOptionalText } from "../../../../../lib/validation";

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
      getCurrentUser(),
    ]);

    if (!restaurant || !user) {
      return NextResponse.json(
        { error: "Restaurante ou utilizador não encontrado." },
        { status: 404 },
      );
    }

    const rating = Number(body.rating);
    const hasRating = body.rating !== undefined && body.rating !== "";
    if (hasRating && (!Number.isFinite(rating) || rating < 0.5 || rating > 5)) {
      return NextResponse.json(
        { error: "A avaliação deve estar entre 0,5 e 5 estrelas." },
        { status: 400 },
      );
    }

    const visitedAt = body.visitedAt ? new Date(body.visitedAt) : new Date();

    const notesResult = readOptionalText(body.notes, "As notas", 2000);
    const reviewResult = readOptionalText(body.review, "O comentário", 2000);

    if ("error" in notesResult || "error" in reviewResult) {
      return NextResponse.json(
        {
          error:
            ("error" in notesResult && notesResult.error) ||
            ("error" in reviewResult && reviewResult.error),
        },
        { status: 400 },
      );
    }

    if (Number.isNaN(visitedAt.getTime())) {
      return NextResponse.json(
        { error: "A data da visita é inválida." },
        { status: 400 },
      );
    }

    if (visitedAt > new Date()) {
      return NextResponse.json(
        { error: "A data da visita não pode estar no futuro." },
        { status: 400 },
      );
    }

    const visit = await prisma.visit.create({
      data: {
        userId: user.id,
        restaurantId,
        visitedAt,
        notes: notesResult.value,
        review: hasRating
          ? {
              create: {
                userId: user.id,
                rating,
                text: reviewResult.value,
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
