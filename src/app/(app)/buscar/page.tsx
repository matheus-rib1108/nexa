"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Search } from "lucide-react";

type Results = {
  tasks: { id: string; title: string }[];
  notes: { id: string; title: string }[];
  subjects: { id: string; name: string }[];
  exams: { id: string; title: string }[];
};

function BuscarContent() {
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const [results, setResults] = useState<Results | null>(null);

  useEffect(() => {
    if (!q) return;
    fetch(`/api/search?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then(setResults);
  }, [q]);

  const totalResults = results
    ? results.tasks.length + results.notes.length + results.subjects.length + results.exams.length
    : 0;

  return (
    <div className="mx-auto max-w-2xl space-y-5 p-4 md:p-8">
      <h1 className="flex items-center gap-2 text-2xl font-semibold">
        <Search className="text-primary" /> Resultados para &quot;{q}&quot;
      </h1>
      <p className="text-xs text-muted">A busca não inclui o conteúdo do Cofre — ele exige a senha mestra.</p>

      {results && totalResults === 0 && <Card className="text-center text-sm text-muted">Nada encontrado.</Card>}

      {results && results.tasks.length > 0 && (
        <Card>
          <p className="mb-2 text-sm font-semibold">Tarefas</p>
          {results.tasks.map((t) => (
            <Link key={t.id} href="/tarefas" className="block py-1.5 text-sm hover:text-primary">
              {t.title}
            </Link>
          ))}
        </Card>
      )}

      {results && results.notes.length > 0 && (
        <Card>
          <p className="mb-2 text-sm font-semibold">Anotações</p>
          {results.notes.map((n) => (
            <Link key={n.id} href="/anotacoes" className="block py-1.5 text-sm hover:text-primary">
              {n.title}
            </Link>
          ))}
        </Card>
      )}

      {results && results.subjects.length > 0 && (
        <Card>
          <p className="mb-2 text-sm font-semibold">Matérias</p>
          {results.subjects.map((s) => (
            <Link key={s.id} href="/estudos" className="block py-1.5 text-sm hover:text-primary">
              {s.name}
            </Link>
          ))}
        </Card>
      )}

      {results && results.exams.length > 0 && (
        <Card>
          <p className="mb-2 text-sm font-semibold">Provas</p>
          {results.exams.map((e) => (
            <Link key={e.id} href="/estudos" className="block py-1.5 text-sm hover:text-primary">
              {e.title}
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}

export default function BuscarPage() {
  return (
    <Suspense>
      <BuscarContent />
    </Suspense>
  );
}
