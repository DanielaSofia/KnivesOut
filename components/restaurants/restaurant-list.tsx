"use client";

import Link from "next/link";
import { Heart, MapPin, Search, Star } from "lucide-react";
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

type Filter = "all" | "wishlist" | "visited";

export function RestaurantList() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    const timeout = setTimeout(async () => {
      try {
        setLoading(true);

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

        const response = await fetch(
          `/api/restaurants?${params.toString()}`,
          {
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error("Failed to load restaurants");
        }

        const data = await response.json();

        setRestaurants(data);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error(error);
        }
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query, filter]);

  return (
    <>
      <div className="flex items-center gap-3 rounded-2xl bg-[var(--surface-muted)] px-4 py-3">
        <Search size={18} className="text-[var(--text-subtle)]" />

        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search restaurants..."
          className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--text-subtle)]"
        />
      </div>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
        <FilterButton
          label="All"
          active={filter === "all"}
          onClick={() => setFilter("all")}
        />

        <FilterButton
          label="Wishlist"
          active={filter === "wishlist"}
          onClick={() => setFilter("wishlist")}
        />

        <FilterButton
          label="Visited"
          active={filter === "visited"}
          onClick={() => setFilter("visited")}
        />
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="space-y-3">
            <Skeleton />
            <Skeleton />
            <Skeleton />
          </div>
        ) : restaurants.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border-strong)] p-8 text-center">
            <p className="font-medium">Nothing found</p>

            <p className="mt-1 text-sm text-[var(--text-subtle)]">
              Try another search or filter.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {restaurants.map((restaurant) => (
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
              <Heart
                size={17}
                className="shrink-0 fill-current text-[var(--accent)]"
              />
            )}
          </div>

          <div className="mt-2 flex items-center gap-1 text-sm text-[var(--text-subtle)]">
            <MapPin size={14} />

            <span>
              {restaurant.city ?? "Unknown location"}
            </span>
          </div>

          <div className="mt-3 flex items-center gap-1.5">
            <Star size={14} className="fill-current" />

            <span className="text-sm font-medium">
              {average !== null
                ? average.toFixed(1)
                : "Not rated"}
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
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button 
      onClick={onClick}
      className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ${
        active
          ? "bg-[var(--action)] text-[var(--action-foreground)]"
          : "bg-[var(--surface-muted)] text-[var(--text-muted)]"
      }`}
    >
      {label}
    </button>
  );
}

function Skeleton() {
  return (
    <div className="h-28 animate-pulse rounded-2xl bg-[var(--surface-muted)]" />
  );
}