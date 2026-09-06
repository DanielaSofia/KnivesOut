"use client";

import Link from "next/link";
import {
  Bookmark,
  Home,
  Map,
  Search,
  Settings2,
} from "lucide-react";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Início", icon: Home },
  { href: "/restaurants", label: "Explorar", icon: Search },
  { href: "/wishlist", label: "Quero ir", icon: Bookmark },
  { href: "/map", label: "Mapa", icon: Map },
  { href: "/settings", label: "Definições", icon: Settings2 },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="ios-bottom-nav fixed inset-x-0 bottom-0 z-50 border-t border-[var(--border-strong)]/80 bg-[var(--surface)]/95 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/"
            ? pathname === href
            : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={`flex min-w-16 flex-col items-center gap-1 rounded-xl px-3 py-2 text-[11px] transition ${
                active
                  ? "font-semibold text-[var(--text)]"
                  : "text-[var(--text-subtle)]"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 2} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}