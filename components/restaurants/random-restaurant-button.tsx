"use client";

import { Dices, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function RandomRestaurantButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function chooseRestaurant() {
    if (isLoading) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/restaurants/random", { cache: "no-store" });
      const data = (await response.json()) as { id?: number };

      if (response.ok && data.id) {
        router.push(`/restaurants/${data.id}`);
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={chooseRestaurant}
      disabled={isLoading}
      className="flex w-16 items-center justify-center rounded-2xl border border-[var(--border-strong)] transition hover:bg-[var(--surface-muted)] disabled:opacity-60"
      aria-label="Escolher um restaurante aleatoriamente"
    >
      {isLoading ? <LoaderCircle size={20} className="animate-spin" /> : <Dices size={20} />}
    </button>
  );
}
