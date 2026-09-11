"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { organizeBrainDump, type BrainDumpCategory } from "@/lib/brain-dump";
import { Trash2, Brain, CheckCircle2 } from "lucide-react";

const CATEGORY_EMOJI: Record<BrainDumpCategory, string> = {
  Escola: "🏫",
  Compras: "🛒",
  Pessoas: "👥",
  Casa: "🏠",
  Outros: "📌",
};

type Item = { id: string; title: string; category: BrainDumpCategory };

export default function BrainDumpPage() {
  const router = useRouter();
  const [rawText, setRawText] = useState("");
  const [items, setItems] = useState<Item[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  function handleOrganize() {
    if (!rawText.trim()) return;
    const organized = organizeBrainDump(rawText);
    const flat: Item[] = [];
    let i = 0;
    for (const [category, titles] of Object.entries(organized)) {
      for (const title of titles) {
        flat.push({ id: `${i++}`, title, category: category as BrainDumpCategory });
      }
    }
    setItems(flat);
    setDone(false);
  }

  function removeItem(id: string) {
    setItems((prev) => prev?.filter((i) => i.id !== id) ?? null);
  }

  function updateItem(id: string, title: string) {
    setItems((prev) => prev?.map((i) => (i.id === id ? { ...i, title } : i)) ?? null);
  }

  async function handleSave() {
    if (!items || items.length === 0) return;
    setSaving(true);

    await fetch("/api/brain-dump", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rawText }),
    });

    await fetch("/api/brain-dump/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: items.map(({ title, category }) => ({ title, category })) }),
    });

    setSaving(false);
    setDone(true);
    setTimeout(() => router.push("/tarefas"), 1200);
  }

  const grouped = items
    ? (Object.keys(CATEGORY_EMOJI) as BrainDumpCategory[]).map((cat) => ({
        category: cat,
        items: items.filter((i) => i.category === cat),
      }))
    : [];

  return (
    <div className="mx-auto max-w-2xl space-y-5 p-4 md:p-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <Brain className="text-primary" /> Brain Dump
        </h1>
        <p className="text-sm text-muted">
          Coloque tudo o que está na sua cabeça aqui. O NEXA organiza automaticamente — você revisa antes de salvar.
        </p>
      </div>

      <Card>
        <Textarea
          rows={6}
          placeholder="Ex: Tenho que estudar matemática, fazer trabalho de história, comprar cartolina, responder João e lembrar do uniforme amanhã."
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
        />
        <Button className="mt-3" onClick={handleOrganize} disabled={!rawText.trim()}>
          Organizar
        </Button>
      </Card>

      {items && (
        <Card>
          {done ? (
            <p className="flex items-center gap-2 rounded-lg bg-success-soft px-3 py-3 text-sm font-medium text-success">
              <CheckCircle2 size={18} /> Tudo salvo como tarefas!
            </p>
          ) : (
            <>
              <p className="mb-3 text-sm font-medium">Revise antes de salvar:</p>
              <div className="space-y-4">
                {grouped
                  .filter((g) => g.items.length > 0)
                  .map((g) => (
                    <div key={g.category}>
                      <p className="mb-1.5 text-sm font-semibold">
                        {CATEGORY_EMOJI[g.category]} {g.category}
                      </p>
                      <div className="space-y-1.5">
                        {g.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-2">
                            <input
                              value={item.title}
                              onChange={(e) => updateItem(item.id, e.target.value)}
                              className="h-9 flex-1 rounded-lg border border-border bg-surface px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                            />
                            <button
                              onClick={() => removeItem(item.id)}
                              className="text-muted hover:text-danger"
                              aria-label="Remover"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
              <Button className="mt-5" onClick={handleSave} disabled={saving || items.length === 0}>
                {saving ? "Salvando..." : `Salvar ${items.length} tarefa(s)`}
              </Button>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
