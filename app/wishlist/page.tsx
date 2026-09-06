import Link from "next/link";
import { ArrowLeft, Bookmark, MapPin } from "lucide-react";

import { BottomNav } from "../../components/bottom-nav";
import { prisma } from "../../lib/prisma";
import { getCurrentUser } from "../../lib/session";

export default async function WishlistPage() {
  const user = await getCurrentUser();
  const saved = await prisma.wishlist.findMany({
    where: {
      userId: user?.id ?? -1,
      restaurant: {
        visits: {
          none: { userId: user?.id ?? -1 },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    include: { restaurant: true },
  });

  return (
    <main className="min-h-screen bg-[var(--background)] pb-24">
      <div className="mx-auto min-h-screen max-w-md bg-[var(--surface)] px-5">
        <header className="flex items-center gap-3 pt-6">
          <Link href="/" className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-strong)]" aria-label="Voltar ao início">
            <ArrowLeft size={19} />
          </Link>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-subtle)]">A sua lista</p>
            <h1 className="mt-1 text-3xl font-bold">Quero ir</h1>
          </div>
        </header>

        <section className="mt-8 space-y-3">
          {saved.map(({ id, restaurant }) => (
            <Link key={id} href={`/restaurants/${restaurant.id}`} className="flex gap-4 rounded-2xl border border-[var(--border)] p-3 shadow-sm">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-muted)] text-3xl">🍽️</div>
              <div className="min-w-0 py-1">
                <h2 className="truncate font-semibold">{restaurant.name}</h2>
                <p className="mt-2 flex items-center gap-1 text-sm text-[var(--text-subtle)]"><MapPin size={14} />{restaurant.city ?? "Sem localização"}</p>
              </div>
            </Link>
          ))}

          {saved.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[var(--border-strong)] p-8 text-center">
              <Bookmark className="mx-auto text-[var(--text-subtle)]" />
              <p className="mt-3 font-medium">Ainda não tem lugares para visitar</p>
              <Link href="/restaurants" className="mt-4 inline-flex rounded-full bg-[var(--action)] px-4 py-2 text-sm font-semibold text-[var(--action-foreground)]">Explorar restaurantes</Link>
            </div>
          )}
        </section>
        <BottomNav />
      </div>
    </main>
  );
}
