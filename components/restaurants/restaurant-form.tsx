"use client";

import Link from "next/link";
import { ArrowLeft, LoaderCircle } from "lucide-react";
import { FormEvent, ReactNode, useState } from "react";
import { useRouter } from "next/navigation";

type RestaurantFormProps = {
  title: string;
  eyebrow: string;
  submitLabel: string;
  savingLabel: string;
  endpoint: string;
  method: "POST" | "PUT";
  backHref: string;
  footer?: ReactNode;
  photoUrl?: string;
  initialValues?: {
    name: string;
    city: string;
    address: string;
    description: string;
  };
};

export function RestaurantForm({
  title,
  eyebrow,
  submitLabel,
  savingLabel,
  endpoint,
  method,
  backHref,
  footer,
  photoUrl,
  initialValues,
}: RestaurantFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const photo = formData.get("photo");
    formData.delete("photo");

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(formData.entries())),
      });

      const data = (await response.json()) as { id?: number; error?: string };

      if (!response.ok) {
        setError(data.error ?? "Não foi possível guardar o restaurante.");
        return;
      }

      if (photo instanceof File && photo.size > 0 && data.id) {
        const photoData = new FormData();
        photoData.set("photo", photo);

        const photoResponse = await fetch(`/api/restaurants/${data.id}/photo`, {
          method: "POST",
          body: photoData,
        });

        if (!photoResponse.ok) {
          const photoError = (await photoResponse.json()) as { error?: string };
          setError(photoError.error ?? "Não foi possível guardar a fotografia.");
          return;
        }
      }

      router.push(data.id ? `/restaurants/${data.id}` : backHref);
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
            href={backHref}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-strong)]"
            aria-label="Voltar"
          >
            <ArrowLeft size={19} />
          </Link>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-subtle)]">
              {eyebrow}
            </p>
            <h1 className="mt-1 text-2xl font-bold">{title}</h1>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {photoUrl && (
            <img
              src={photoUrl}
              alt="Fotografia atual do restaurante"
              className="h-48 w-full rounded-2xl object-cover"
            />
          )}

          <label className="block text-sm font-medium">
            Fotografia
            <input
              name="photo"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="mt-2 block w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm"
            />
            <span className="mt-1 block text-xs font-normal text-[var(--text-subtle)]">
              JPEG, PNG, WebP ou GIF, até 8 MB.
            </span>
          </label>

          <Field
            label="Nome"
            name="name"
            required
            placeholder="Ex.: Casa do Norte"
            defaultValue={initialValues?.name}
          />
          <Field
            label="Cidade"
            name="city"
            placeholder="Ex.: Braga"
            defaultValue={initialValues?.city}
          />
          <Field
            label="Morada"
            name="address"
            placeholder="Rua e número"
            defaultValue={initialValues?.address}
          />
          <label className="block text-sm font-medium">
            Descrição
            <textarea
              name="description"
              rows={4}
              defaultValue={initialValues?.description}
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
            {isSaving ? savingLabel : submitLabel}
          </button>
        </form>

        {footer}
      </div>
    </main>
  );
}

function Field({
  label,
  name,
  placeholder,
  required,
  defaultValue,
}: {
  label: string;
  name: string;
  placeholder: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <input
        name={name}
        type="text"
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
      />
    </label>
  );
}