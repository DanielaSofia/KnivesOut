"use client";

import { LoaderCircle, Plus, Star, X } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function VisitForm({ restaurantId }: { restaurantId: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError("");

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/visits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(formData.entries())),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Não foi possível registar a visita.");
        return;
      }

      setOpen(false);
      router.refresh();
    } catch {
      setError("Não foi possível ligar ao servidor. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-full bg-[var(--action)] px-4 py-2 text-sm font-semibold text-[var(--action-foreground)]"
      >
        <Plus size={16} />
        Registar visita
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Como foi?</h3>
        <button type="button" onClick={() => setOpen(false)} aria-label="Fechar formulário">
          <X size={18} />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <label className="text-sm font-medium">
          Data
          <input
            name="visitedAt"
            type="date"
            defaultValue={new Date().toISOString().slice(0, 10)}
            required
            className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          />
        </label>
        <label className="text-sm font-medium">
          Nota
          <span className="mt-2 flex gap-1" role="radiogroup" aria-label="Nota de 1 a 5 estrelas">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="rounded-lg p-1 transition hover:bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
                aria-label={`${star} ${star === 1 ? "estrela" : "estrelas"}`}
                aria-checked={rating === star}
                role="radio"
              >
                <Star
                  size={24}
                  className={rating !== null && star <= rating ? "fill-[var(--accent)] text-[var(--accent)]" : "text-[var(--text-subtle)]"}
                />
              </button>
            ))}
          </span>
          <input type="hidden" name="rating" value={rating ?? ""} />
        </label>
      </div>

      <label className="mt-3 block text-sm font-medium">
        Comentário
        <textarea
          name="review"
          rows={3}
          placeholder="O que achou?"
          className="mt-2 w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
        />
      </label>

      <label className="mt-3 block text-sm font-medium">
        Notas pessoais
        <textarea
          name="notes"
          rows={2}
          placeholder="Com quem foi, o que pedir da próxima vez..."
          className="mt-2 w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
        />
      </label>

      {error && <p className="mt-3 text-sm text-[var(--danger)]" role="alert">{error}</p>}

      <button
        type="submit"
        disabled={isSaving}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--action)] px-4 py-3 text-sm font-semibold text-[var(--action-foreground)] disabled:opacity-60"
      >
        {isSaving && <LoaderCircle size={16} className="animate-spin" />}
        {isSaving ? "A guardar..." : "Guardar no diário"}
      </button>
    </form>
  );
}
