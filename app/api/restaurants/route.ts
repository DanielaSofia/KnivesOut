import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const query = searchParams.get("q")?.trim() ?? "";
  const wishlist = searchParams.get("wishlist") === "true";
  const visited = searchParams.get("visited") === "true";

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
              some: {},
            },
          }
        : {}),

      ...(visited
        ? {
            visits: {
              some: {},
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
      wishlists: true,
    },
  });

  return NextResponse.json(restaurants);
}