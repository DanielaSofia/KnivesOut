import Link from "next/link";
import { Plus } from "lucide-react";

import { RestaurantList } from "../../components/restaurants/restaurant-list";

export default function RestaurantsPage() {
  return (
    <main className="min-h-screen bg-[var(--background)] pb-24">
      <div className="mx-auto min-h-screen max-w-md bg-[var(--surface)]">
        <header className="flex items-center justify-between px-5 pt-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-subtle)]">
              KnivesOut
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              Restaurants
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
          <RestaurantList />
        </section>
      </div>
    </main>
  );
}