"use client";

import Image from "next/image";
import { CalendarDays, LoaderCircle, Pencil, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { VisitForm } from "./visit-form";

export function VisitEntry({
  id,
  restaurantId,
  canEdit,
  userName,
  visitedAt,
  visitedAtValue,
  rating,
  reviewText,
  notes,
  photos,
}: {
  id: number;
  restaurantId: number;
  canEdit: boolean;
  userName: string;
  visitedAt: string;
  visitedAtValue: string;
  rating: number | null;
  reviewText: string | null;
  notes: string | null;
  photos: string[];
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState(false);

  if (isEditing) {
    return (
      <VisitForm
        restaurantId={restaurantId}
        visit={{ id, visitedAt: visitedAtValue, rating, reviewText, notes, photos }}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  async function handleDelete() {
    if (!window.confirm("Apagar esta visita do diário?")) {
      return;
    }

    setIsDeleting(true);
    setError(false);

    try {
      const response = await fetch(`/api/visits/${id}`, { method: "DELETE" });

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      router.refresh();
    } catch {
      setError(true);
      setIsDeleting(false);
    }
  }

  return (
    <article className="rounded-2xl border border-[var(--border)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{userName}</p>
          <div className="mt-1 flex items-center gap-1.5 text-sm text-[var(--text-subtle)]">
            <CalendarDays size={14} />
            <span>{visitedAt}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {rating !== null && (
            <div className="flex items-center gap-1">
              <Star size={14} className="fill-current" />
              <span className="font-semibold">{rating.toFixed(1)}</span>
            </div>
          )}
          {canEdit && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-subtle)] hover:bg-[var(--surface-muted)]"
              aria-label="Editar visita"
              title="Editar visita"
            >
              <Pencil size={15} />
            </button>
          )}
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-subtle)] hover:bg-[var(--danger-soft)] hover:text-[var(--danger)] disabled:opacity-50"
            aria-label="Apagar visita"
          >
            {isDeleting ? <LoaderCircle size={15} className="animate-spin" /> : <Trash2 size={15} />}
          </button>
        </div>
      </div>

      {reviewText && <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">“{reviewText}”</p>}
      {notes && <p className="mt-3 rounded-xl bg-[var(--background)] p-3 text-sm text-[var(--text-muted)]">{notes}</p>}
      {photos.length > 0 && (
        <div className="mt-3 grid grid-cols-4 gap-2">
          {photos.map((src, index) => (
            <a key={src} href={src} target="_blank" rel="noreferrer" className="relative aspect-square overflow-hidden rounded-lg bg-[var(--surface-muted)]">
              <Image src={src} alt={`Fotografia da visita ${index + 1}`} fill unoptimized sizes="(max-width: 448px) 20vw, 80px" className="object-cover transition hover:scale-105" />
            </a>
          ))}
        </div>
      )}
      {error && <p className="mt-3 text-xs text-[var(--danger)]" role="alert">Não foi possível apagar a visita.</p>}
    </article>
  );
}
