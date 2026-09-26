"use client";

import Image from "next/image";
import { Camera, LoaderCircle, Plus, Star, X } from "lucide-react";
import { ChangeEvent, FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const maxPhotos = 5;
const maxPhotoSize = 8 * 1024 * 1024;

type VisitFormData = {
  id: number;
  visitedAt: string;
  rating: number | null;
  reviewText: string | null;
  notes: string | null;
  photos: string[];
};

export function VisitForm({
  restaurantId,
  visit,
  onCancel,
}: {
  restaurantId: number;
  visit?: VisitFormData;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(Boolean(visit));
  const [rating, setRating] = useState<number | null>(visit?.rating ?? null);
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
  const [removedPhotos, setRemovedPhotos] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const currentPhotoCount = (visit?.photos.length ?? 0) - removedPhotos.length + photos.length;

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";

    const remaining = maxPhotos - currentPhotoCount;
    if (selected.length > remaining) {
      setError(`Pode adicionar até ${maxPhotos} fotografias.`);
      return;
    }

    const invalidPhoto = selected.find(
      (photo) => !photo.type.startsWith("image/") || photo.size > maxPhotoSize,
    );
    if (invalidPhoto) {
      setError("Escolha imagens com no máximo 8 MB cada.");
      return;
    }

    setError("");
    setPhotos((current) => [
      ...current,
      ...selected.map((file) => ({ file, preview: URL.createObjectURL(file) })),
    ]);
  }

  function removePhoto(preview: string) {
    URL.revokeObjectURL(preview);
    setPhotos((current) => current.filter((photo) => photo.preview !== preview));
  }

  function closeForm() {
    photos.forEach((photo) => URL.revokeObjectURL(photo.preview));
    setPhotos([]);
    setRating(null);
    setError("");
    setOpen(false);
    onCancel?.();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    photos.forEach(({ file }) => formData.append("photos", file));
    removedPhotos.forEach((filename) => formData.append("removePhotos", filename));

    try {
      const response = await fetch(
        visit ? `/api/visits/${visit.id}` : `/api/restaurants/${restaurantId}/visits`,
        {
          method: visit ? "PUT" : "POST",
          body: formData,
        },
      );
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Não foi possível guardar a visita.");
        return;
      }

      closeForm();
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
    <form onSubmit={handleSubmit} className="w-full basis-full rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{visit ? "Editar visita" : "Registar visita"}</h3>
          <p className="mt-1 text-sm text-[var(--text-subtle)]">{visit ? "Atualize os detalhes desta experiência." : "Guarde os detalhes desta experiência."}</p>
        </div>
        <button type="button" onClick={closeForm} aria-label="Fechar formulário" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--text-subtle)] hover:bg-[var(--surface)]">
          <X size={18} />
        </button>
      </div>

      <div className="mt-5">
        <label className="block text-sm font-medium">
          Data da visita
          <input
            name="visitedAt"
            type="date"
            defaultValue={visit?.visitedAt ?? new Date().toISOString().slice(0, 10)}
            required
            className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
          />
        </label>
      </div>

      <fieldset className="mt-5">
        <legend className="text-sm font-medium">A sua avaliação <span className="font-normal text-[var(--text-subtle)]">· opcional</span></legend>
        <div className="mt-2 flex items-center gap-1" role="radiogroup" aria-label="Nota de 1 a 5 estrelas">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(rating === star ? null : star)}
                className="rounded-lg p-1.5 transition hover:bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
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
          <span className="ml-2 text-sm text-[var(--text-subtle)]">{rating ? `${rating} de 5` : "Sem avaliação"}</span>
        </div>
        <input type="hidden" name="rating" value={rating ?? ""} />
      </fieldset>

      <label className="mt-5 block text-sm font-medium">
        Review
        <textarea
          name="review"
          rows={4}
          maxLength={2000}
          defaultValue={visit?.reviewText ?? ""}
          placeholder="O que pediu? O que vale a pena repetir?"
          className="mt-2 w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm leading-6 outline-none focus:border-[var(--accent)]"
        />
      </label>

      <label className="mt-4 block text-sm font-medium">
        Notas pessoais
        <textarea
          name="notes"
          rows={3}
          maxLength={2000}
          defaultValue={visit?.notes ?? ""}
          placeholder="Com quem foi, ambiente ou algo para lembrar..."
          className="mt-2 w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm leading-6 outline-none focus:border-[var(--accent)]"
        />
      </label>

      <div className="mt-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Fotografias <span className="font-normal text-[var(--text-subtle)]">· opcional</span></p>
          <span className="text-xs text-[var(--text-subtle)]">{currentPhotoCount}/{maxPhotos}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {visit?.photos.filter((src) => !removedPhotos.includes(src.split("/").pop() ?? "")).map((src, index) => (
            <div key={src} className="relative h-20 w-20 overflow-hidden rounded-xl border border-[var(--border)]">
              <Image src={src} alt={`Fotografia existente ${index + 1}`} fill unoptimized className="object-cover" sizes="80px" />
              <button
                type="button"
                onClick={() => setRemovedPhotos((current) => [...current, src.split("/").pop() ?? ""])}
                aria-label={`Remover fotografia existente ${index + 1}`}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          {photos.map(({ preview }, index) => (
            <div key={preview} className="relative h-20 w-20 overflow-hidden rounded-xl border border-[var(--border)]">
              <Image src={preview} alt={`Pré-visualização ${index + 1}`} fill unoptimized className="object-cover" sizes="80px" />
              <button
                type="button"
                onClick={() => removePhoto(preview)}
                aria-label={`Remover fotografia ${index + 1}`}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          {currentPhotoCount < maxPhotos && (
            <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-[var(--border-strong)] text-[var(--text-subtle)] transition hover:bg-[var(--surface)]">
              <Camera size={20} />
              <span className="text-[11px] font-medium">Adicionar</span>
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={handlePhotoChange} className="sr-only" />
            </label>
          )}
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-[var(--danger)]" role="alert">{error}</p>}

      <button
        type="submit"
        disabled={isSaving}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--action)] px-4 py-3 text-sm font-semibold text-[var(--action-foreground)] disabled:opacity-60"
      >
        {isSaving && <LoaderCircle size={16} className="animate-spin" />}
        {isSaving ? "A guardar..." : visit ? "Guardar alterações" : "Guardar no diário"}
      </button>
    </form>
  );
}
