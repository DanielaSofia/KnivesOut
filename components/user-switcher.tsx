"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type UserOption = {
  id: number;
  name: string;
};

export function UserSwitcher({
  users,
  currentUserId,
}: {
  users: UserOption[];
  currentUserId: number | null;
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(currentUserId ?? users[0]?.id ?? "");
  const [isSaving, setIsSaving] = useState(false);

  async function changeUser(value: string) {
    const userId = Number(value);
    setSelectedId(userId);
    setIsSaving(true);

    try {
      const response = await fetch("/api/session", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        router.refresh();
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <label className="flex items-center gap-2 rounded-full border border-[var(--border-strong)] px-3 py-2 text-sm font-semibold">
      <span className="sr-only">Perfil ativo</span>
      <select
        value={selectedId}
        onChange={(event) => changeUser(event.target.value)}
        disabled={isSaving || users.length === 0}
        className="max-w-32 bg-transparent outline-none"
        aria-label="Escolher perfil"
      >
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name}
          </option>
        ))}
      </select>
    </label>
  );
}