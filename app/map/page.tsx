import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";

import { BottomNav } from "../../components/bottom-nav";
import { prisma } from "../../lib/prisma";

export default async function MapPage() {
  const restaurants = await prisma.restaurant.findMany({ orderBy: { name: "asc" } });

  return (
    <main className="min-h-screen bg-[var(--background)] pb-24">
      <div className="mx-auto min-h-screen max-w-md bg-[var(--surface)] px-5">
        <header className="flex items-center gap-3 pt-6">
          <Link href="/" className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-strong)]" aria-label="Voltar ao início"><ArrowLeft size={19} /></Link>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-subtle)]">Descobrir</p>
            <h1 className="mt-1 text-3xl font-bold">Mapa</h1>
          </div>
        </header>
        <div className="mt-8 rounded-3xl bg-[var(--surface-muted)] p-5">
          <p className="text-sm font-semibold">Os seus restaurantes</p>
          <p className="mt-1 text-sm text-[var(--text-subtle)]">Escolha um lugar para ver os detalhes.</p>
        </div>
        <section className="mt-5 space-y-3">
          {restaurants.map((restaurant) => (
            <Link key={restaurant.id} href={`/restaurants/${restaurant.id}`} className="flex items-center gap-3 rounded-2xl border border-[var(--border)] p-4">
              <MapPin size={18} className="text-[var(--accent)]" />
              <span className="min-w-0 flex-1 truncate font-medium">{restaurant.name}</span>
              <span className="text-sm text-[var(--text-subtle)]">{restaurant.city ?? "Sem cidade"}</span>
            </Link>
          ))}
        </section>
        <BottomNav />
      </div>
    </main>
  );
}
