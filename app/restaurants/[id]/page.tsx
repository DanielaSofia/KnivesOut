import Link from "next/link";
import {
  ArrowLeft,
  Globe,
  Pencil,
  MapPin,
  Star,
} from "lucide-react";
import { FaFacebookF, FaInstagram } from "react-icons/fa6";

import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/session";
import { BottomNav } from "../../../components/bottom-nav";
import { WishlistButton } from "../../../components/restaurants/wishlist-button";
import { VisitForm } from "../../../components/restaurants/visit-form";
import { VisitEntry } from "../../../components/restaurants/visit-entry";
import { RestaurantPhoto } from "../../../components/restaurants/restaurant-photo";
import { listVisitPhotos } from "../../../lib/visit-photos";

export const dynamic = "force-dynamic";

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

  const user = await getCurrentUser();
  const userId = user?.id ?? -1;
  const [restaurant, ratingSummary] = await Promise.all([
    prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        wishlists: {
          where: { userId },
          include: { user: true },
        },
        visits: {
          include: { user: true, review: true },
          orderBy: { visitedAt: "desc" },
          take: 50,
        },
      },
    }),
    prisma.review.aggregate({
      where: { visit: { restaurantId } },
      _avg: { rating: true },
      _count: { _all: true },
    }),
  ]);

  if (!restaurant) {
    return <NotFound />;
  }

  const visits = await Promise.all(
    restaurant.visits.map(async (visit) => ({
      ...visit,
      photos: await listVisitPhotos(visit.id),
    })),
  );

  const averageRating = ratingSummary._avg.rating
    ? Number(ratingSummary._avg.rating)
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

          <div className="flex items-center gap-2">
            <Link
              href={`/restaurants/${restaurant.id}/edit`}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-strong)]"
              aria-label="Editar restaurante"
            >
              <Pencil size={17} />
            </Link>

            <WishlistButton
              restaurantId={restaurant.id}
              initialSaved={restaurant.wishlists.length > 0}
            />
          </div>
        </header>

        {/* Hero */}
        <section className="px-5 pt-6">
          <RestaurantPhoto
            restaurantId={restaurant.id}
            alt={`Fotografia de ${restaurant.name}`}
            className="h-56 w-full rounded-3xl object-cover"
            fallbackClassName="flex h-56 items-center justify-center rounded-3xl bg-[var(--surface-muted)] text-7xl"
          />

          <div className="pt-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-subtle)]">
              Restaurante
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--text)]">
              {restaurant.name}
            </h1>

            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                [restaurant.address, restaurant.city, restaurant.name]
                  .filter(Boolean)
                  .join(", "),
              )}`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 flex w-fit items-center gap-1.5 text-sm text-[var(--text-subtle)] underline-offset-4 hover:underline"
            >
              <MapPin size={15} />

              <span>
                {restaurant.address
                  ? `${restaurant.address}${restaurant.city ? `, ${restaurant.city}` : ""}`
                  : restaurant.city ?? "Unknown location"}
              </span>
            </a>

            <div className="mt-4 flex items-center gap-2">
              {restaurant.websiteUrl && (
                <SocialLink href={restaurant.websiteUrl} label="Site">
                  <Globe size={17} />
                </SocialLink>
              )}
              {restaurant.instagramUrl && (
                <SocialLink href={restaurant.instagramUrl} label="Instagram">
                  <FaInstagram size={18} aria-hidden="true" />
                </SocialLink>
              )}
              {restaurant.facebookUrl && (
                <SocialLink href={restaurant.facebookUrl} label="Facebook">
                  <FaFacebookF size={17} aria-hidden="true" />
                </SocialLink>
              )}
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
                    {ratingSummary._count._all === 1
                      ? "1 avaliação"
                      : `${ratingSummary._count._all} avaliações`}
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
          <div className="flex flex-wrap items-center justify-between gap-3">
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
            {visits.map((visit) => (
              <VisitEntry
                key={visit.id}
                id={visit.id}
                restaurantId={restaurant.id}
                canEdit={user?.id === visit.userId}
                userName={visit.user.name}
                visitedAt={new Intl.DateTimeFormat("pt-PT", {
                  dateStyle: "medium",
                }).format(new Date(visit.visitedAt))}
                visitedAtValue={new Date(visit.visitedAt).toISOString().slice(0, 10)}
                rating={visit.review ? Number(visit.review.rating) : null}
                reviewText={visit.review?.text ?? null}
                notes={visit.notes}
                photos={visit.photos}
              />
            ))}

            {visits.length === 0 && (
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

        <BottomNav />
      </div>
    </main>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      title={label}
      className="group flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text-muted)] shadow-sm transition-[border-color,background-color,color,transform] hover:-translate-y-0.5 hover:border-[var(--accent)] hover:bg-[var(--surface-muted)] hover:text-[var(--accent)] focus-visible:border-[var(--accent)] active:translate-y-0"
    >
      <span className="transition-transform group-hover:scale-110">{children}</span>
    </a>
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
