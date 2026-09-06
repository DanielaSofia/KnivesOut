"use client";

import { Bookmark, LoaderCircle } from "lucide-react";
import { useState } from "react";

export function WishlistButton({
  restaurantId,
  initialSaved,
}: {
  restaurantId: number;
  initialSaved: boolean;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(false);

  async function toggleWishlist() {
    if (isSaving) {
      return;
    }

    setIsSaving(true);
    setError(false);

    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/wishlist`, {
        method: saved ? "DELETE" : "POST",
      });

      if (!response.ok) {
        throw new Error("Wishlist update failed");
      }

      const data = (await response.json()) as { saved: boolean };
      setSaved(data.saved);
    } catch {
      setError(true);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggleWishlist}
        disabled={isSaving}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-strong)] transition hover:bg-[var(--surface-muted)] disabled:opacity-60"
        aria-label={saved ? "Remover da lista Quero ir" : "Adicionar à lista Quero ir"}
        aria-pressed={saved}
      >
        {isSaving ? (
          <LoaderCircle size={18} className="animate-spin" />
        ) : (
          <Bookmark size={19} className={saved ? "fill-current text-[var(--accent)]" : ""} />
        )}
      </button>

      {error && (
        <span className="absolute right-0 top-12 z-10 w-44 rounded-xl bg-[var(--text)] px-3 py-2 text-center text-xs text-[var(--background)]" role="alert">
          Não foi possível actualizar os favoritos.
        </span>
      )}
    </div>
  );
}
