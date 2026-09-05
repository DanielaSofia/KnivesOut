import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Heart,
  MapPin,
  Star,
} from "lucide-react";

import { prisma } from "../../../lib/prisma";

type RestaurantPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function RestaurantPage({
  params,
}: RestaurantPageProps) {
  const { id } = await params;
  const restaurantId = Number(id);

  if (!Number.isInteger(restaurantId)) {
    return <NotFound />;
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: {
      id: restaurantId,
    },
    include: {
      wishlists: {
        include: {
          user: true,
        },
      },
      visits: {
        include: {
          user: true,
          review: true,
        },
        orderBy: {
          visitedAt: "desc",
        },
      },
    },
  });

  if (!restaurant) {
    return <NotFound />;
  }

  const ratings = restaurant.visits
    .map((visit) => visit.review?.rating)
    .filter(
      (rating): rating is NonNullable<typeof rating> =>
        rating !== null && rating !== undefined,
    );

  const averageRating =
    ratings.length > 0
      ? ratings.reduce((sum, rating) => sum + Number(rating), 0) /
        ratings.length
      : null;

  return (
    <main className="min-h-screen bg-[var(--background)] pb-10">
      <div className="mx-auto min-h-screen max-w-md bg-[var(--surface)]">
        {/* Header */}
        <header className="flex items-center justify-between px-5 pt-6">
          <Link
            href="/restaurants"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-strong)]"
          >
            <ArrowLeft size={19} />
          </Link>

          <button
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-strong)]"
            aria-label="Add to wishlist"
          >
            <Heart size={19} />
          </button>
        </header>

        {/* Hero */}
        <section className="px-5 pt-6">
          <div className="flex h-56 items-center justify-center rounded-3xl bg-[var(--surface-muted)] text-7xl">
            🍽️
          </div>

          <div className="pt-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-subtle)]">
              Restaurant
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--text)]">
              {restaurant.name}
            </h1>

            <div className="mt-3 flex items-center gap-1.5 text-sm text-[var(--text-subtle)]">
              <MapPin size={15} />

              <span>
                {restaurant.address
                  ? `${restaurant.address}${restaurant.city ? `, ${restaurant.city}` : ""}`
                  : restaurant.city ?? "Unknown location"}
              </span>
            </div>
          </div>
        </section>

        {/* Rating */}
        <section className="px-5 pt-6">
          <div className="rounded-3xl bg-[var(--action)] p-5 text-[var(--action-foreground)]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-70">
              Our verdict
            </p>

            <div className="mt-3 flex items-end gap-3">
              <span className="text-5xl font-bold">
                {averageRating !== null
                  ? averageRating.toFixed(1)
                  : "—"}
              </span>

              <div className="pb-1">
                <div className="flex items-center gap-1">
                  <Star size={17} className="fill-current" />

                  <span className="text-sm font-medium">
                    {ratings.length === 1
                      ? "1 review"
                      : `${ratings.length} reviews`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Description */}
        {restaurant.description && (
          <section className="px-5 pt-7">
            <h2 className="text-lg font-bold">About</h2>

            <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
              {restaurant.description}
            </p>
          </section>
        )}

        {/* Visits */}
        <section className="px-5 pt-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-subtle)]">
                History
              </p>

              <h2 className="mt-1 text-xl font-bold">
                Visits
              </h2>
            </div>

            <button
              className="rounded-full bg-[var(--action)] px-4 py-2 text-sm font-semibold text-[var(--action-foreground)]"
            >
              + Add visit
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {restaurant.visits.map((visit) => (
              <div
                key={visit.id}
                className="rounded-2xl border border-[var(--border)] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      {visit.user.name}
                    </p>

                    <div className="mt-1 flex items-center gap-1.5 text-sm text-[var(--text-subtle)]">
                      <CalendarDays size={14} />

                      <span>
                        {new Intl.DateTimeFormat("pt-PT", {
                          dateStyle: "medium",
                        }).format(new Date(visit.visitedAt))}
                      </span>
                    </div>
                  </div>

                  {visit.review && (
                    <div className="flex items-center gap-1">
                      <Star size={14} className="fill-current" />

                      <span className="font-semibold">
                        {Number(visit.review.rating).toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>

                {visit.review?.text && (
                  <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
                    “{visit.review.text}”
                  </p>
                )}

                {visit.notes && (
                  <p className="mt-3 rounded-xl bg-[var(--background)] p-3 text-sm text-[var(--text-muted)]">
                    {visit.notes}
                  </p>
                )}
              </div>
            ))}

            {restaurant.visits.length === 0 && (
              <div className="rounded-2xl border border-dashed border-[var(--border-strong)] p-8 text-center">
                <p className="font-medium">
                  No visits yet.
                </p>

                <p className="mt-1 text-sm text-[var(--text-subtle)]">
                  This could be your first one.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] p-6">
      <div className="text-center">
        <p className="text-4xl">🔪</p>

        <h1 className="mt-4 text-2xl font-bold">
          Restaurant not found
        </h1>

        <Link
          href="/restaurants"
          className="mt-5 inline-block rounded-full bg-[var(--action)] px-5 py-3 text-sm font-semibold text-[var(--action-foreground)]"
        >
          Back to restaurants
        </Link>
      </div>
    </main>
  );
}
