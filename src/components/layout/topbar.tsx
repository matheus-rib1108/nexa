"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { Search, Timer, LogOut, Settings } from "lucide-react";
import Link from "next/link";

export function Topbar({ userName }: { userName: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) router.push(`/buscar?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-surface/90 px-4 backdrop-blur md:px-6">
      <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar tarefas, notas, matérias..."
          className="h-10 w-full rounded-xl border border-border bg-surface-muted pl-9 pr-3 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </form>

      <Link
        href="/tempo-livre?minutes=5"
        className="hidden items-center gap-1.5 rounded-xl bg-accent-soft px-3 py-2 text-sm font-medium text-accent sm:flex"
      >
        <Timer size={16} />
        Tenho 5 minutos
      </Link>

      <div className="relative">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary"
        >
          {userName.charAt(0).toUpperCase()}
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 z-20 mt-2 w-48 rounded-xl border border-border bg-surface p-1.5 shadow-lg">
              <Link
                href="/configuracoes"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-surface-muted"
                onClick={() => setMenuOpen(false)}
              >
                <Settings size={16} /> Configurações
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-danger hover:bg-danger-soft"
              >
                <LogOut size={16} /> Sair
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
