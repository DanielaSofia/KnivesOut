import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Star,
} from "lucide-react";

import { prisma } from "../../../lib/prisma";
import { BottomNav } from "../../../components/bottom-nav";
import { WishlistButton } from "../../../components/restaurants/wishlist-button";
import { VisitForm } from "../../../components/restaurants/visit-form";
import { VisitEntry } from "../../../components/restaurants/visit-entry";
import { DeleteRestaurantButton } from "../../../components/restaurants/delete-restaurant-button";

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
    <main className="min-h-screen bg-[var(--background)] pb-24">
      <div className="mx-auto min-h-screen max-w-md bg-[var(--surface)]">
        {/* Header */}
        <header className="flex items-center justify-between px-5 pt-6">
          <Link
            href="/restaurants"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-strong)]"
          >
            <ArrowLeft size={19} />
          </Link>

          <WishlistButton
            restaurantId={restaurant.id}
            initialSaved={restaurant.wishlists.length > 0}
          />
        </header>

        {/* Hero */}
        <section className="px-5 pt-6">
          <div className="flex h-56 items-center justify-center rounded-3xl bg-[var(--surface-muted)] text-7xl">
            🍽️
          </div>

          <div className="pt-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-subtle)]">
              Restaurante
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
            <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-80">
              A nossa avaliação
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
                      ? "1 avaliação"
                      : `${ratings.length} avaliações`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Description */}
        {restaurant.description && (
          <section className="px-5 pt-7">
            <h2 className="text-lg font-bold">Sobre</h2>

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
                Histórico
              </p>

              <h2 className="mt-1 text-xl font-bold">
                Visitas
              </h2>
            </div>

            <VisitForm restaurantId={restaurant.id} />
          </div>

          <div className="mt-4 space-y-3">
            {restaurant.visits.map((visit) => (
              <VisitEntry
                key={visit.id}
                id={visit.id}
                userName={visit.user.name}
                visitedAt={new Intl.DateTimeFormat("pt-PT", {
                  dateStyle: "medium",
                }).format(new Date(visit.visitedAt))}
                rating={visit.review ? Number(visit.review.rating) : null}
                reviewText={visit.review?.text ?? null}
                notes={visit.notes}
              />
            ))}

            {restaurant.visits.length === 0 && (
              <div className="rounded-2xl border border-dashed border-[var(--border-strong)] p-8 text-center">
                <p className="font-medium">
                  Ainda não há visitas.
                </p>

                <p className="mt-1 text-sm text-[var(--text-subtle)]">
                  Esta pode ser a sua primeira.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="px-5">
          <DeleteRestaurantButton restaurantId={restaurant.id} />
        </section>

        <BottomNav />
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
          Restaurante não encontrado
        </h1>

        <Link
          href="/restaurants"
          className="mt-5 inline-block rounded-full bg-[var(--action)] px-5 py-3 text-sm font-semibold text-[var(--action-foreground)]"
        >
          Voltar aos restaurantes
        </Link>
      </div>
    </main>
  );
}
