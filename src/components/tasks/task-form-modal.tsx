"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { Category, Subject, SerializedTask } from "@/types/task";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  categories: Category[];
  subjects: Subject[];
  task?: SerializedTask | null;
};

export function TaskFormModal({ open, onClose, onSaved, categories, subjects, task }: Props) {
  const isEdit = !!task;
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [categoryId, setCategoryId] = useState(task?.categoryId ?? "");
  const [subjectId, setSubjectId] = useState(task?.subjectId ?? "");
  const [priority, setPriority] = useState(task?.priority ?? "media");
  const [dueDate, setDueDate] = useState(task?.dueDate ? task.dueDate.slice(0, 10) : "");
  const [dueTime, setDueTime] = useState(task?.dueTime ?? "");
  const [estimatedMinutes, setEstimatedMinutes] = useState(task?.estimatedMinutes?.toString() ?? "");
  const [isPriorityToday, setIsPriorityToday] = useState(task?.isPriorityToday ?? false);
  const [notes, setNotes] = useState(task?.notes ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      title,
      description,
      categoryId: categoryId || null,
      subjectId: subjectId || null,
      priority,
      dueDate: dueDate || null,
      dueTime: dueTime || null,
      estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes, 10) : null,
      isPriorityToday,
      notes,
    };

    await fetch(isEdit ? `/api/tasks/${task!.id}` : "/api/tasks", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);
    onSaved();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Editar tarefa" : "Nova tarefa"} wide>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="title">Título</Label>
          <Input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="description">Descrição</Label>
          <Textarea id="description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Categoria</Label>
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Sem categoria</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Matéria</Label>
            <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              <option value="">Nenhuma</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label>Prioridade</Label>
            <Select value={priority} onChange={(e) => setPriority(e.target.value as typeof priority)}>
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="dueDate">Prazo</Label>
            <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="dueTime">Horário</Label>
            <Input id="dueTime" type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} />
          </div>
        </div>

        <div>
          <Label htmlFor="estimatedMinutes">Duração estimada (minutos)</Label>
          <Input
            id="estimatedMinutes"
            type="number"
            min={1}
            value={estimatedMinutes}
            onChange={(e) => setEstimatedMinutes(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="notes">Observações</Label>
          <Textarea id="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={isPriorityToday}
            onChange={(e) => setIsPriorityToday(e.target.checked)}
            className="h-4 w-4 rounded border-border"
          />
          Marcar como prioridade de hoje
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Salvando..." : isEdit ? "Salvar alterações" : "Criar tarefa"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
