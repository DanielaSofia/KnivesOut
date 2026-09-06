import Link from "next/link";
import { ArrowLeft, Heart, MapPin, Utensils } from "lucide-react";

import { BottomNav } from "../../components/bottom-nav";
import { prisma } from "../../lib/prisma";
import { getCurrentUser } from "../../lib/session";

export default async function ProfilePage() {
  const currentUser = await getCurrentUser();
  const userId = currentUser?.id ?? -1;
  const [restaurants, visits, saved] = await Promise.all([
    prisma.restaurant.count(),
    prisma.visit.count({ where: { userId } }),
    prisma.wishlist.count({ where: { userId } }),
  ]);

  return (
    <main className="min-h-screen bg-[var(--background)] pb-24">
      <div className="mx-auto min-h-screen max-w-md bg-[var(--surface)] px-5">
        <header className="flex items-center gap-3 pt-6">
          <Link href="/" className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-strong)]" aria-label="Voltar ao início"><ArrowLeft size={19} /></Link>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-subtle)]">A sua conta</p>
            <h1 className="mt-1 text-3xl font-bold">Perfil</h1>
          </div>
        </header>
        <section className="mt-8 rounded-3xl bg-[var(--action)] p-6 text-[var(--action-foreground)]">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 text-2xl">🔪</div>
          <h2 className="mt-5 text-2xl font-bold">O seu diário</h2>
          <p className="mt-1 text-sm opacity-80">Todos os lugares que quer recordar.</p>
        </section>
        <section className="mt-5 grid grid-cols-3 gap-3">
          <Stat icon={<MapPin size={18} />} value={restaurants} label="Lugares" />
          <Stat icon={<Utensils size={18} />} value={visits} label="Visitas" />
          <Stat icon={<Heart size={18} />} value={saved} label="Guardados" />
        </section>
        <Link href="/restaurants" className="mt-6 flex items-center justify-between rounded-2xl border border-[var(--border)] p-4 font-semibold">Ver todos os restaurantes <span aria-hidden="true">→</span></Link>
        <BottomNav />
      </div>
    </main>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4"><div className="text-[var(--text-subtle)]">{icon}</div><p className="mt-3 text-2xl font-bold">{value}</p><p className="text-xs text-[var(--text-subtle)]">{label}</p></div>;
}
