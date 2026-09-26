import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/session";
import {
  readOptionalText,
  readOptionalUrl,
  readRequiredText,
} from "../../../lib/validation";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Perfil não encontrado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  const query = searchParams.get("q")?.trim() ?? "";
  const wishlist = searchParams.get("wishlist") === "true";
  const visited = searchParams.get("visited") === "true";
  const favorite = searchParams.get("favorite") === "true";

  const filters = [];

  if (query) {
    filters.push({
      OR: [
        { name: { contains: query } },
        { city: { contains: query } },
        { description: { contains: query } },
      ],
    });
  }

  if (wishlist) {
    filters.push(
      { wishlists: { some: { userId: user.id } } },
      { visits: { none: { userId: user.id } } },
    );
  }

  if (visited) {
    filters.push({ visits: { some: { userId: user.id } } });
  }

  if (favorite) {
    filters.push({
      visits: {
        some: {
          userId: user.id,
          review: { rating: { gte: 4.5 } },
        },
      },
    });
  }

  const restaurants = await prisma.restaurant.findMany({
    where: filters.length > 0 ? { AND: filters } : undefined,

    orderBy: {
      createdAt: "desc",
    },

    include: {
      visits: {
        include: {
          review: true,
        },
        orderBy: { visitedAt: "desc" },
        take: 20,
      },
      wishlists: { where: { userId: user.id } },
    },
  });

  const normalizedRestaurants = restaurants.map((restaurant) => ({
      ...restaurant,
      visits: restaurant.visits.map((visit) => ({
        ...visit,
        review: visit.review
          ? {
              ...visit.review,
              rating: Number(visit.review.rating),
            }
          : null,
      })),
    }));

  return NextResponse.json(
    normalizedRestaurants,
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: NextRequest) {
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

    const restaurant = await prisma.restaurant.create({
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
    revalidatePath("/");

    return NextResponse.json(restaurant, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível criar o restaurante." },
      { status: 500 },
    );
  }
}