"use client";

import { LoaderCircle, Trash2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteRestaurantButton({ restaurantId }: { restaurantId: number }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    if (!window.confirm("Apagar este restaurante e todo o seu histórico?")) {
      return;
    }

    setIsDeleting(true);
    setError("");

    try {
      const response = await fetch(`/api/restaurants/${restaurantId}`, {
        method: "DELETE",
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Não foi possível apagar o restaurante.");
        return;
      }

      router.push("/restaurants");
      router.refresh();
    } catch {
      setError("Não foi possível ligar ao servidor. Tente novamente.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="mt-8 border-t border-[var(--border)] pt-6">
      <button
        type="button"
        onClick={handleDelete}
        disabled={isDeleting}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--danger)]/40 px-4 py-3 text-sm font-semibold text-[var(--danger)] transition hover:bg-[var(--danger-soft)] disabled:opacity-60"
      >
        {isDeleting ? <LoaderCircle size={17} className="animate-spin" /> : <Trash2 size={17} />}
        {isDeleting ? "A apagar..." : "Apagar restaurante"}
      </button>
      {error && <p className="mt-2 text-center text-xs text-[var(--danger)]" role="alert">{error}</p>}
    </div>
  );
}
