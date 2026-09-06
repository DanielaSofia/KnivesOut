import Link from "next/link";
import { ArrowLeft, ChevronRight, Settings2, UserRound } from "lucide-react";

import { BottomNav } from "../../components/bottom-nav";
import { ThemeToggle } from "../../components/settings/theme-toggle";
import { UserSwitcher } from "../../components/user-switcher";
import { getAvailableUsers, getCurrentUser } from "../../lib/session";

export default async function SettingsPage() {
  const [users, currentUser] = await Promise.all([
    getAvailableUsers(),
    getCurrentUser(),
  ]);

  return (
    <main className="min-h-screen bg-[var(--background)] pb-24">
      <div className="mx-auto min-h-screen max-w-md bg-[var(--surface)] px-5">
        <header className="flex items-center gap-3 pt-6">
          <Link
            href="/"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-strong)]"
            aria-label="Voltar ao início"
          >
            <ArrowLeft size={19} />
          </Link>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-subtle)]">
              KnivesOut
            </p>
            <h1 className="mt-1 text-3xl font-bold">Definições</h1>
          </div>
        </header>

        <section className="mt-8">
          <div className="flex items-center gap-3">
            <UserRound size={19} className="text-[var(--text-subtle)]" />
            <div>
              <h2 className="font-semibold">Perfil ativo</h2>
              <p className="mt-0.5 text-sm text-[var(--text-subtle)]">
                Escolha quem está a usar o diário.
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-2xl border border-[var(--border)] p-4">
            <span className="text-sm font-medium">Utilizador</span>
            <UserSwitcher users={users} currentUserId={currentUser?.id ?? null} />
          </div>
        </section>

        <section className="mt-8">
          <div className="flex items-center gap-3">
            <Settings2 size={19} className="text-[var(--text-subtle)]" />
            <div>
              <h2 className="font-semibold">Aparência</h2>
              <p className="mt-0.5 text-sm text-[var(--text-subtle)]">
                Escolha como a app aparece no seu dispositivo.
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-2xl border border-[var(--border)] p-4">
            <span className="text-sm font-medium">Tema</span>
            <ThemeToggle />
          </div>
        </section>

        <section className="mt-8">
          <Link
            href="/profile"
            className="flex items-center gap-3 rounded-2xl border border-[var(--border)] p-4"
          >
            <UserRound size={19} className="text-[var(--text-subtle)]" />
            <span className="flex-1 text-sm font-medium">Ver perfil</span>
            <ChevronRight size={18} className="text-[var(--text-subtle)]" />
          </Link>
        </section>

        <BottomNav />
      </div>
    </main>
  );
}
