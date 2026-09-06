import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/session";

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

  const restaurants = await prisma.restaurant.findMany({
    where: {
      ...(query
        ? {
            OR: [
              {
                name: {
                  contains: query,
                },
              },
              {
                city: {
                  contains: query,
                },
              },
              {
                description: {
                  contains: query,
                },
              },
            ],
          }
        : {}),

      ...(wishlist
        ? {
            wishlists: {
              some: { userId: user.id },
            },
            visits: {
              none: { userId: user.id },
            },
          }
        : {}),

      ...(visited
        ? {
            visits: {
              some: { userId: user.id },
            },
          }
        : {}),

    },

    orderBy: {
      createdAt: "desc",
    },

    include: {
      visits: {
        include: {
          review: true,
        },
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

  const visibleRestaurants = favorite
    ? normalizedRestaurants.filter((restaurant) =>
        restaurant.visits.some(
          (visit) => visit.review !== null && visit.review.rating >= 4.5,
        ),
      )
    : normalizedRestaurants;

  return NextResponse.json(
    visibleRestaurants,
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!name) {
      return NextResponse.json(
        { error: "O nome do restaurante é obrigatório." },
        { status: 400 },
      );
    }

    const restaurant = await prisma.restaurant.create({
      data: {
        name,
        city: typeof body.city === "string" ? body.city.trim() || null : null,
        address:
          typeof body.address === "string" ? body.address.trim() || null : null,
        description:
          typeof body.description === "string"
            ? body.description.trim() || null
            : null,
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