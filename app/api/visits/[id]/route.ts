import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/session";
import {
  listVisitPhotos,
  prepareVisitPhotos,
  removeVisitPhotos,
  storeVisitPhotos,
} from "../../../../lib/visit-photos";
import { readOptionalText } from "../../../../lib/validation";

type VisitRouteProps = {
  params: Promise<{ id: string }>;
};

export async function PUT(
  request: NextRequest,
  { params }: VisitRouteProps,
) {
  const visitId = Number((await params).id);

  if (!Number.isInteger(visitId)) {
    return NextResponse.json({ error: "Visita inválida." }, { status: 400 });
  }

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Utilizador não encontrado." },
        { status: 404 },
      );
    }

    const visit = await prisma.visit.findFirst({
      where: { id: visitId, userId: user.id },
      include: { review: true },
    });
    if (!visit) {
      return NextResponse.json(
        { error: "Visita não encontrada." },
        { status: 404 },
      );
    }

    const body = await request.formData();
    const readField = (name: string) => {
      const value = body.get(name);
      return typeof value === "string" ? value : "";
    };
    const ratingValue = readField("rating");
    const hasRating = ratingValue !== "";
    const rating = Number(ratingValue);
    if (hasRating && (!Number.isFinite(rating) || rating < 0.5 || rating > 5)) {
      return NextResponse.json(
        { error: "A avaliação deve estar entre 0,5 e 5 estrelas." },
        { status: 400 },
      );
    }

    const visitedAtValue = readField("visitedAt");
    const visitedAt = visitedAtValue ? new Date(visitedAtValue) : new Date();
    const notesResult = readOptionalText(readField("notes"), "As notas", 2000);
    const reviewResult = readOptionalText(readField("review"), "O comentário", 2000);
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

    const photoFiles = body
      .getAll("photos")
      .filter((value): value is File => value instanceof File && value.size > 0);
    const preparedPhotos = await prepareVisitPhotos(photoFiles);
    if ("error" in preparedPhotos) {
      return NextResponse.json({ error: preparedPhotos.error }, { status: 400 });
    }

    const existingPhotoNames = new Set(
      (await listVisitPhotos(visitId)).map((photo) => photo.split("/").pop() ?? ""),
    );
    const removedPhotoNames = body
      .getAll("removePhotos")
      .filter(
        (value): value is string =>
          typeof value === "string" && existingPhotoNames.has(value),
      );
    if (existingPhotoNames.size - removedPhotoNames.length + photoFiles.length > 5) {
      return NextResponse.json(
        { error: "A visita pode ter até 5 fotografias." },
        { status: 400 },
      );
    }

    const addedPhotoNames = await storeVisitPhotos(visitId, preparedPhotos.photos);
    try {
      await prisma.$transaction(async (tx) => {
        await tx.visit.update({
          where: { id: visitId },
          data: { visitedAt, notes: notesResult.value },
        });

        if (hasRating) {
          await tx.review.upsert({
            where: { visitId },
            create: {
              visitId,
              userId: user.id,
              rating,
              text: reviewResult.value,
            },
            update: { rating, text: reviewResult.value },
          });
        } else {
          await tx.review.deleteMany({ where: { visitId } });
        }
      });
    } catch (error) {
      await removeVisitPhotos(visitId, addedPhotoNames);
      throw error;
    }

    await removeVisitPhotos(visitId, removedPhotoNames);
    revalidatePath("/");
    revalidatePath(`/restaurants/${visit.restaurantId}`);
    return NextResponse.json({ updated: true });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível atualizar a visita." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: VisitRouteProps,
) {
  const visitId = Number((await params).id);

  if (!Number.isInteger(visitId)) {
    return NextResponse.json({ error: "Visita inválida." }, { status: 400 });
  }

  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Utilizador não encontrado." },
      { status: 404 },
    );
  }

  const visit = await prisma.visit.findFirst({
    where: { id: visitId, userId: user.id },
  });

  if (!visit) {
    return NextResponse.json(
      { error: "Visita não encontrada." },
      { status: 404 },
    );
  }

  await Promise.all([
    prisma.visit.delete({ where: { id: visitId } }),
    removeVisitPhotos(visitId),
  ]);

  return NextResponse.json({ deleted: true });
}
