"use client";

import Link from "next/link";
import { ArrowLeft, LoaderCircle } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function NewRestaurantPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/restaurants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(formData.entries())),
      });

      const data = (await response.json()) as { id?: number; error?: string };

      if (!response.ok || !data.id) {
        setError(data.error ?? "Não foi possível guardar o restaurante.");
        return;
      }

      router.push(`/restaurants/${data.id}`);
    } catch {
      setError("Não foi possível ligar ao servidor. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--background)] pb-10">
      <div className="mx-auto min-h-screen max-w-md bg-[var(--surface)] px-5">
        <header className="flex items-center gap-3 pt-6">
          <Link
            href="/restaurants"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-strong)]"
            aria-label="Voltar aos restaurantes"
          >
            <ArrowLeft size={19} />
          </Link>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-subtle)]">
              Novo lugar
            </p>
            <h1 className="mt-1 text-2xl font-bold">Adicionar restaurante</h1>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <Field label="Nome" name="name" required placeholder="Ex.: Casa do Norte" />
          <Field label="Cidade" name="city" placeholder="Ex.: Braga" />
          <Field label="Morada" name="address" placeholder="Rua e número" />
          <label className="block text-sm font-medium">
            Descrição
            <textarea
              name="description"
              rows={4}
              placeholder="O que vale a pena saber?"
              className="mt-2 w-full resize-none rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
            />
          </label>

          {error && (
            <p className="rounded-xl bg-[var(--danger-soft)] p-3 text-sm text-[var(--danger)]" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--action)] px-4 py-4 font-semibold text-[var(--action-foreground)] disabled:opacity-60"
          >
            {isSaving && <LoaderCircle size={18} className="animate-spin" />}
            {isSaving ? "A guardar..." : "Guardar restaurante"}
          </button>
        </form>
      </div>
    </main>
  );
}

function Field({
  label,
  name,
  placeholder,
  required,
}: {
  label: string;
  name: string;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <input
        name={name}
        type="text"
        required={required}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
      />
    </label>
  );
}
