"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (!mounted) {
    return (
      <div
        className="flex items-center gap-1 rounded-2xl bg-[var(--surface-muted)] p-1"
        aria-hidden="true"
      >
        <div className="h-9 w-9" />
        <div className="h-9 w-9" />
        <div className="h-9 w-9" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 rounded-2xl bg-[var(--surface-muted)] p-1">
      <ThemeButton
        active={theme === "light"}
        onClick={() => setTheme("light")}
        label="Claro"
      >
        <Sun size={17} />
      </ThemeButton>

      <ThemeButton
        active={theme === "dark"}
        onClick={() => setTheme("dark")}
        label="Escuro"
      >
        <Moon size={17} />
      </ThemeButton>

      <ThemeButton
        active={theme === "system"}
        onClick={() => setTheme("system")}
        label="Sistema"
      >
        <Monitor size={17} />
      </ThemeButton>
    </div>
  );
}

function ThemeButton({
  children,
  active,
  onClick,
  label,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button onClick={onClick}
      aria-label={label}
      className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
        active
          ? "bg-[var(--surface-elevated)] text-[var(--text)] shadow-sm"
          : "text-[var(--text-muted)] hover:text-[var(--text)]"
      }`}
    >
      {children}
    </button>
  );
}