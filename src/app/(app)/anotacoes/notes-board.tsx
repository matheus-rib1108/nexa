"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Search, Plus, Star, Pencil, Trash2, StickyNote } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/cn";

type Note = {
  id: string;
  title: string;
  content: string;
  tags: string | null;
  isFavorite: boolean;
  updatedAt: string;
};

export function NotesBoard({ initialNotes }: { initialNotes: Note[] }) {
  const [notes, setNotes] = useState(initialNotes);
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);

  async function search(q: string) {
    setQuery(q);
    const res = await fetch(`/api/notes?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setNotes(data.notes);
  }

  function openNew() {
    setEditing(null);
    setTitle("");
    setContent("");
    setTags("");
    setFormOpen(true);
  }

  function openEdit(note: Note) {
    setEditing(note);
    setTitle(note.title);
    setContent(note.content);
    setTags(note.tags ? JSON.parse(note.tags).join(", ") : "");
    setFormOpen(true);
  }

  async function refresh() {
    const res = await fetch(`/api/notes?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    setNotes(data.notes);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const tagList = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    await fetch(editing ? `/api/notes/${editing.id}` : "/api/notes", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, tags: tagList }),
    });
    setSaving(false);
    setFormOpen(false);
    refresh();
  }

  async function toggleFavorite(note: Note) {
    setNotes((prev) => prev.map((n) => (n.id === note.id ? { ...n, isFavorite: !n.isFavorite } : n)));
    await fetch(`/api/notes/${note.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFavorite: !note.isFavorite }),
    });
  }

  async function handleDelete(note: Note) {
    if (!confirm(`Excluir "${note.title}"?`)) return;
    setNotes((prev) => prev.filter((n) => n.id !== note.id));
    await fetch(`/api/notes/${note.id}`, { method: "DELETE" });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <StickyNote className="text-primary" /> Anotações
        </h1>
        <Button onClick={openNew}>
          <Plus size={16} /> Nova nota
        </Button>
      </div>

      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <Input className="pl-9" placeholder="Buscar em anotações..." value={query} onChange={(e) => search(e.target.value)} />
      </div>

      {notes.length === 0 ? (
        <Card className="text-center text-sm text-muted">Nenhuma anotação ainda.</Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {notes.map((note) => (
            <Card key={note.id} className="flex flex-col">
              <div className="mb-1 flex items-start justify-between gap-2">
                <h3 className="font-medium">{note.title}</h3>
                <button onClick={() => toggleFavorite(note)} aria-label="Favoritar">
                  <Star size={16} className={cn(note.isFavorite ? "fill-warning text-warning" : "text-muted")} />
                </button>
              </div>
              <p className="mb-2 flex-1 whitespace-pre-wrap text-sm text-muted line-clamp-4">{note.content}</p>
              {note.tags && JSON.parse(note.tags).length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1">
                  {JSON.parse(note.tags).map((t: string) => (
                    <span key={t} className="rounded-full bg-surface-muted px-2 py-0.5 text-[11px] text-muted">
                      #{t}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted">
                  {format(new Date(note.updatedAt), "d MMM, HH:mm", { locale: ptBR })}
                </span>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(note)} className="rounded-lg p-1.5 text-muted hover:bg-surface-muted">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(note)} className="rounded-lg p-1.5 text-muted hover:bg-danger-soft hover:text-danger">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? "Editar nota" : "Nova nota"}>
        <form onSubmit={handleSave} className="space-y-3">
          <Input placeholder="Título" required value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea placeholder="Escreva aqui..." rows={6} required value={content} onChange={(e) => setContent(e.target.value)} />
          <Input placeholder="Etiquetas (separadas por vírgula)" value={tags} onChange={(e) => setTags(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setFormOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
