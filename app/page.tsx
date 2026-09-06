import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Bookmark,
  MapPin,
  Plus,
  Star,
  Utensils,
} from "lucide-react";

import { prisma } from "../lib/prisma";
import { BottomNav } from "../components/bottom-nav";
import { RandomRestaurantButton } from "../components/restaurants/random-restaurant-button";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [recentVisits, wishlistCount, visitCount, favoriteCount] =
    await Promise.all([
      prisma.visit.findMany({
        orderBy: {
          visitedAt: "desc",
        },
        take: 6,
        include: {
          restaurant: true,
          review: true,
        },
      }),

      prisma.wishlist.count(),

      prisma.visit.count(),

      prisma.review.count({
        where: {
          rating: {
            gte: 4.5,
          },
        },
      }),
    ]);

  return (
    <main className="min-h-screen bg-[var(--background)] pb-24">
      <div className="mx-auto min-h-screen max-w-md bg-[var(--surface)]">
        {/* Header */}
        <header className="flex items-center justify-between px-5 pt-6">
          <div>
            <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--action)] text-lg text-[var(--action-foreground)]">
                🔪
              </div>

              <span className="text-lg font-bold tracking-tight">
                KnivesOut
              </span>
            </div>
          </div>

          <Link
            href="/restaurants/new"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-foreground)]"
            aria-label="Adicionar restaurante"
          >
            <Plus size={20} />
          </Link>
        </header>

        {/* Welcome */}
        <section className="px-5 pb-6 pt-8">
          <p className="text-sm font-medium text-[var(--text-subtle)]">
            Bom dia
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--text)]">
            O seu diário
            <br />
            gastronómico
          </h1>

          <div className="mt-5 flex gap-3">
            <Link
              href="/restaurants"
              className="flex flex-1 items-center justify-between rounded-2xl bg-[var(--action)] px-4 py-4 text-[var(--action-foreground)] transition-colors hover:brightness-105"
            >
              <div>
                <p className="text-xs opacity-80">Explorar</p>
                <p className="mt-1 font-semibold">Encontrar um restaurante</p>
              </div>

              <ArrowRight size={20} />
            </Link>

            <RandomRestaurantButton />
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-3 gap-3 px-5">
          <Stat
            icon={<Bookmark size={18} />}
            value={wishlistCount}
            label="Quero ir"
          />

          <Stat
            icon={<Utensils size={18} />}
            value={visitCount}
            label="Visitados"
          />

          <Stat
            icon={<Star size={18} />}
            value={favoriteCount}
            label="Favoritos"
          />
        </section>

        {/* Diary */}
        <section className="mt-8">
          <div className="flex items-end justify-between px-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-subtle)]">
                O seu diário
              </p>

              <h2 className="mt-1 text-xl font-bold">
                Últimas visitas
              </h2>
            </div>

            <Link
              href="/restaurants"
              className="text-sm font-semibold text-[var(--text-muted)]"
            >
              Ver restaurantes
            </Link>
          </div>

          <div className="mt-4 space-y-3 px-5">
            {recentVisits.map((visit) => (
              <Link
                key={visit.id}
                href={`/restaurants/${visit.restaurant.id}`}
                className="flex gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-sm transition hover:border-[var(--border-strong)] hover:shadow-md"
              >
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-muted)] text-3xl">
                  🍽️
                </div>

                <div className="min-w-0 flex-1 py-1">
                  <h3 className="truncate font-semibold text-[var(--text)]">
                    {visit.restaurant.name}
                  </h3>

                  <div className="mt-1 flex items-center gap-1 text-sm text-[var(--text-subtle)]">
                    <MapPin size={14} />
                    <span>
                      {visit.restaurant.city ?? "Sem localização"}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-3 text-xs text-[var(--text-subtle)]">
                    <span className="flex items-center gap-1">
                      <CalendarDays size={13} />
                      {new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium" }).format(new Date(visit.visitedAt))}
                    </span>

                    {visit.review && (
                      <span className="flex items-center gap-1 font-semibold text-[var(--text)]">
                        <Star size={13} className="fill-current" />
                        {Number(visit.review.rating).toFixed(1)}
                      </span>
                    )}
                  </div>

                  {visit.review?.text && (
                    <p className="mt-2 truncate text-xs text-[var(--text-muted)]">
                      “{visit.review.text}”
                    </p>
                  )}
                </div>
              </Link>
            ))}

            {recentVisits.length === 0 && (
              <div className="rounded-2xl border border-dashed border-[var(--border-strong)] p-8 text-center">
                  <p className="font-medium text-[var(--text)]">
                    Ainda não há visitas no diário
                  </p>

                  <p className="mt-1 text-sm text-[var(--text-subtle)]">
                    Registe a sua primeira experiência num restaurante.
                  </p>

                  <Link
                    href="/restaurants"
                    className="mt-4 inline-flex rounded-full bg-[var(--action)] px-4 py-2 text-sm font-semibold text-[var(--action-foreground)]"
                  >
                    Escolher restaurante
                  </Link>
              </div>
            )}
          </div>
        </section>

        {/* Bottom nav */}
        <BottomNav />
      </div>
    </main>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
      <div className="text-[var(--text-subtle)]">{icon}</div>

      <p className="mt-3 text-2xl font-bold text-[var(--text)]">
        {value}
      </p>

      <p className="mt-0.5 text-xs text-[var(--text-subtle)]">
        {label}
      </p>
    </div>
  );
}