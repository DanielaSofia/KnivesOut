"use client";

import Link from "next/link";
import { Bookmark, MapPin, Search, Star, X } from "lucide-react";
import { useEffect, useState } from "react";

type Restaurant = {
  id: number;
  name: string;
  city: string | null;
  description: string | null;
  visits: {
    review: {
      rating: number;
    } | null;
  }[];
  wishlists: {
    id: number;
  }[];
};

type Filter = "all" | "wishlist" | "visited" | "favorite";

export function RestaurantList({
  initialRestaurants,
}: {
  initialRestaurants: Restaurant[];
}) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>(initialRestaurants);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const isDefaultView = !query.trim() && filter === "all";
  const visibleRestaurants = isDefaultView ? initialRestaurants : restaurants;
  const isLoading = isDefaultView ? false : loading;
  const hasError = isDefaultView ? false : error;

  useEffect(() => {
    if (isDefaultView) {
      return;
    }

    const controller = new AbortController();

    const timeout = setTimeout(async () => {
      try {
        setLoading(true);
        setError(false);

        const params = new URLSearchParams();

        if (query.trim()) {
          params.set("q", query.trim());
        }

        if (filter === "wishlist") {
          params.set("wishlist", "true");
        }

        if (filter === "visited") {
          params.set("visited", "true");
        }

        if (filter === "favorite") {
          params.set("favorite", "true");
        }

        const response = await fetch(
          `/api/restaurants?${params.toString()}`,
          {
            signal: controller.signal,
            cache: "no-store",
          },
        );

        if (!response.ok) {
          throw new Error("Failed to load restaurants");
        }

        const data = await response.json();

        setRestaurants(data);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setError(true);
        }
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query, filter, retryKey, initialRestaurants, isDefaultView]);

  return (
    <>
      <div className="flex items-center gap-3 rounded-2xl bg-[var(--surface-muted)] px-4 py-3 focus-within:ring-2 focus-within:ring-[var(--accent)]/30">
        <Search size={18} className="text-[var(--text-subtle)]" />

        <label htmlFor="restaurant-search" className="sr-only">
          Pesquisar restaurantes
        </label>

        <input
          id="restaurant-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Pesquisar restaurantes..."
          className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--text-subtle)]"
        />

        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[var(--text-subtle)] hover:bg-[var(--surface)] hover:text-[var(--text)]"
            aria-label="Limpar pesquisa"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
        <FilterButton
          label="Todos"
          icon={null}
          active={filter === "all"}
          onClick={() => setFilter("all")}
        />

        <FilterButton
          label="Quero ir"
          icon={<Bookmark size={15} />}
          active={filter === "wishlist"}
          onClick={() => setFilter("wishlist")}
        />

        <FilterButton
          label="Favoritos"
          icon={<Star size={15} />}
          active={filter === "favorite"}
          onClick={() => setFilter("favorite")}
        />

        <FilterButton
          label="Visitados"
          icon={null}
          active={filter === "visited"}
          onClick={() => setFilter("visited")}
        />
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="space-y-3">
            <p className="sr-only" aria-live="polite">
              A carregar restaurantes
            </p>
            <Skeleton />
            <Skeleton />
            <Skeleton />
          </div>
        ) : hasError ? (
          <div className="rounded-2xl border border-dashed border-[var(--border-strong)] p-8 text-center">
            <p className="font-medium">Não foi possível carregar</p>

            <p className="mt-1 text-sm text-[var(--text-subtle)]">
              Verifique a sua ligação e tente novamente.
            </p>

            <button
              type="button"
              onClick={() => setRetryKey((current) => current + 1)}
              className="mt-4 rounded-full bg-[var(--action)] px-4 py-2 text-sm font-semibold text-[var(--action-foreground)]"
            >
              Tentar novamente
            </button>
          </div>
        ) : visibleRestaurants.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border-strong)] p-8 text-center">
            <p className="font-medium">
              {filter === "favorite"
                ? "Ainda não tem favoritos"
                : "Não foram encontrados resultados"}
            </p>

            <p className="mt-1 text-sm text-[var(--text-subtle)]">
              {filter === "favorite"
                ? "Registe uma visita e atribua pelo menos 4,5 estrelas."
                : "Tente outra pesquisa ou filtro."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleRestaurants.map((restaurant) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function RestaurantCard({
  restaurant,
}: {
  restaurant: Restaurant;
}) {
  const ratings = restaurant.visits
    .map((visit) => visit.review?.rating)
    .filter((rating): rating is number => rating !== null && rating !== undefined);

  const average =
    ratings.length > 0
      ? ratings.reduce((sum, rating) => sum + Number(rating), 0) /
        ratings.length
      : null;

  const inWishlist = restaurant.wishlists.length > 0;

  return (
    <Link
      href={`/restaurants/${restaurant.id}`}
      className="block rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-sm transition hover:shadow-md"
    >
      <div className="flex gap-4">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-muted)] text-3xl">
          🍽️
        </div>

        <div className="min-w-0 flex-1 py-1">
          <div className="flex items-start justify-between gap-2">
            <h2 className="truncate font-semibold text-[var(--text)]">
              {restaurant.name}
            </h2>

            {inWishlist && (
              <Bookmark
                size={17}
                aria-label="Guardado na sua lista"
                className="shrink-0 fill-current text-[var(--accent)]"
              />
            )}
          </div>

          <div className="mt-2 flex items-center gap-1 text-sm text-[var(--text-subtle)]">
            <MapPin size={14} />

            <span>
              {restaurant.city ?? "Sem localização"}
            </span>
          </div>

          <div className="mt-3 flex items-center gap-1.5">
            <Star size={14} className="fill-current" />

            <span className="text-sm font-medium">
              {average !== null
                ? average.toFixed(1)
                : "Sem avaliação"}
            </span>

            {ratings.length > 0 && (
              <span className="text-xs text-[var(--text-subtle)]">
                ({ratings.length})
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function FilterButton({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium ${
        active
          ? "bg-[var(--action)] text-[var(--action-foreground)]"
          : "bg-[var(--surface-muted)] text-[var(--text-muted)]"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function Skeleton() {
  return (
    <div className="h-28 animate-pulse rounded-2xl bg-[var(--surface-muted)]" />
  );
}