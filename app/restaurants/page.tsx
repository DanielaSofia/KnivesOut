import Link from "next/link";
import { Plus } from "lucide-react";

import { RestaurantList } from "../../components/restaurants/restaurant-list";
import { BottomNav } from "../../components/bottom-nav";
import { prisma } from "../../lib/prisma";
import { getCurrentUser } from "../../lib/session";

export const dynamic = "force-dynamic";

export default async function RestaurantsPage() {
  const user = await getCurrentUser();
  const userId = user?.id ?? -1;
  const restaurants = await prisma.restaurant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      visits: { where: { userId }, include: { review: true } },
      wishlists: { where: { userId } },
    },
  });

  const initialRestaurants = restaurants.map((restaurant) => ({
    id: restaurant.id,
    name: restaurant.name,
    city: restaurant.city,
    description: restaurant.description,
    visits: restaurant.visits.map((visit) => ({
      review: visit.review
        ? { rating: Number(visit.review.rating) }
        : null,
    })),
    wishlists: restaurant.wishlists.map((wishlist) => ({
      id: wishlist.id,
    })),
  }));

  return (
    <main className="min-h-screen bg-[var(--background)] pb-24">
      <div className="mx-auto min-h-screen max-w-md bg-[var(--surface)]">
        <header className="flex items-center justify-between px-5 pt-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-subtle)]">
              KnivesOut
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              Restaurantes
            </h1>
          </div>

          <Link
            href="/restaurants/new"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-foreground)]"
          >
            <Plus size={20} />
          </Link>
        </header>

        <section className="px-5 pt-6">
          <RestaurantList initialRestaurants={initialRestaurants} />
        </section>

        <BottomNav />
      </div>
    </main>
  );
}