import { readdir, unlink } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { prisma } from "../../../../lib/prisma";
import { readOptionalText, readRequiredText } from "../../../../lib/validation";

type RestaurantRouteProps = {
  params: Promise<{ id: string }>;
};

export async function PUT(
  request: NextRequest,
  { params }: RestaurantRouteProps,
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
    const nameResult = readRequiredText(body.name, "O nome", 200);
    const cityResult = readOptionalText(body.city, "A cidade", 120);
    const addressResult = readOptionalText(body.address, "A morada", 240);
    const descriptionResult = readOptionalText(
      body.description,
      "A descrição",
      2000,
    );

    if (
      "error" in nameResult ||
      "error" in cityResult ||
      "error" in addressResult ||
      "error" in descriptionResult
    ) {
      return NextResponse.json(
        {
          error:
            ("error" in nameResult && nameResult.error) ||
            ("error" in cityResult && cityResult.error) ||
            ("error" in addressResult && addressResult.error) ||
            ("error" in descriptionResult && descriptionResult.error),
        },
        { status: 400 },
      );
    }

    const restaurant = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        name: nameResult.value,
        city: cityResult.value,
        address: addressResult.value,
        description: descriptionResult.value,
      },
    });

    revalidatePath("/restaurants");
    revalidatePath(`/restaurants/${restaurantId}`);
    revalidatePath("/");

    return NextResponse.json(restaurant);
  } catch {
    return NextResponse.json(
      { error: "Não foi possível atualizar o restaurante." },
      { status: 500 },
    );
  }
}

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

  const photoDirectory = path.join(
    process.cwd(),
    "public",
    "uploads",
    "restaurants",
  );
  const photoFiles = await readdir(photoDirectory).catch(() => []);

  await Promise.all(
    photoFiles
      .filter((file) => new RegExp(`^${restaurantId}\\.(gif|jpg|png|webp)$`).test(file))
      .map((file) => unlink(path.join(photoDirectory, file))),
  );

  return NextResponse.json({ deleted: true });
}
