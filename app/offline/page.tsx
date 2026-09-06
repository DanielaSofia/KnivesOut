import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] p-6">
      <section className="w-full max-w-md rounded-3xl bg-[var(--surface)] p-8 text-center shadow-sm">
        <p className="text-5xl" aria-hidden="true">📡</p>
        <h1 className="mt-5 text-2xl font-bold">Está sem ligação</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
          As páginas que já visitou continuam disponíveis. Volte a ligar-se à internet para registar alterações.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-full bg-[var(--action)] px-5 py-3 text-sm font-semibold text-[var(--action-foreground)]"
        >
          Voltar ao início
        </Link>
      </section>
    </main>
  );
}
