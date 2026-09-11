"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { BOTTOM_NAV_ITEMS, NAV_GROUPS } from "./nav-items";
import { cn } from "@/lib/cn";

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      {moreOpen && (
        <div className="fixed inset-0 z-40 flex items-end bg-black/40 md:hidden" onClick={() => setMoreOpen(false)}>
          <div
            className="w-full rounded-t-2xl bg-surface p-4 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold">Mais opções</p>
              <button onClick={() => setMoreOpen(false)} aria-label="Fechar">
                <X size={20} />
              </button>
            </div>
            <div className="grid max-h-[60vh] grid-cols-3 gap-3 overflow-y-auto">
              {NAV_GROUPS.flatMap((g) => g.items).map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.href}
                    onClick={() => {
                      setMoreOpen(false);
                      router.push(item.href);
                    }}
                    className="flex flex-col items-center gap-1.5 rounded-xl border border-border p-3 text-xs font-medium hover:bg-surface-muted"
                  >
                    <Icon size={20} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-center justify-around border-t border-border bg-surface/95 backdrop-blur md:hidden pb-[env(safe-area-inset-bottom)]">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1 text-[11px] font-medium",
                active ? "text-primary" : "text-muted",
              )}
            >
              <Icon size={22} />
              {item.label}
            </Link>
          );
        })}
        <button
          onClick={() => setMoreOpen(true)}
          className="flex flex-col items-center gap-0.5 px-2 py-1 text-[11px] font-medium text-muted"
        >
          <Menu size={22} />
          Mais
        </button>
      </nav>
    </>
  );
}
