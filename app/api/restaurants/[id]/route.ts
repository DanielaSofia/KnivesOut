import { readdir, unlink } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { prisma } from "../../../../lib/prisma";
import { Prisma } from "../../../generated/prisma/client";
import {
  readOptionalText,
  readOptionalUrl,
  readRequiredText,
} from "../../../../lib/validation";

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
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Dados inválidos." },
        { status: 400 },
      );
    }

    const nameResult = readRequiredText(body.name, "O nome", 200);
    const cityResult = readOptionalText(body.city, "A cidade", 120);
    const addressResult = readOptionalText(body.address, "A morada", 240);
    const descriptionResult = readOptionalText(
      body.description,
      "A descrição",
      2000,
    );
    const websiteResult = readOptionalUrl(body.websiteUrl, "O site");
    const instagramResult = readOptionalUrl(
      body.instagramUrl,
      "O Instagram",
    );
    const facebookResult = readOptionalUrl(body.facebookUrl, "O Facebook");

    if (
      "error" in nameResult ||
      "error" in cityResult ||
      "error" in addressResult ||
      "error" in descriptionResult ||
      "error" in websiteResult ||
      "error" in instagramResult ||
      "error" in facebookResult
    ) {
      return NextResponse.json(
        {
          error:
            ("error" in nameResult && nameResult.error) ||
            ("error" in cityResult && cityResult.error) ||
            ("error" in addressResult && addressResult.error) ||
            ("error" in descriptionResult && descriptionResult.error) ||
            ("error" in websiteResult && websiteResult.error) ||
            ("error" in instagramResult && instagramResult.error) ||
            ("error" in facebookResult && facebookResult.error),
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
        websiteUrl: websiteResult.value,
        instagramUrl: instagramResult.value,
        facebookUrl: facebookResult.value,
      },
    });

    revalidatePath("/restaurants");
    revalidatePath(`/restaurants/${restaurantId}`);
    revalidatePath("/");

    return NextResponse.json(restaurant);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Restaurante não encontrado." },
        { status: 404 },
      );
    }

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

  try {
    await Promise.all(
      photoFiles
        .filter((file) => new RegExp(`^${restaurantId}\.(gif|jpg|png|webp)$`).test(file))
        .map((file) => unlink(path.join(photoDirectory, file))),
    );
  } catch (error) {
    console.error("Não foi possível limpar as fotografias do restaurante.", error);
  }

  return NextResponse.json({ deleted: true });
}
