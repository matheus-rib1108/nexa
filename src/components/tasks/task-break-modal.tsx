"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { generateBreakdownSteps } from "@/lib/task-break";
import { Trash2, Plus } from "lucide-react";

export function TaskBreakModal({
  open,
  onClose,
  onSaved,
  taskId,
  title,
  description,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  taskId: string;
  title: string;
  description?: string | null;
}) {
  // O componente é montado apenas quando há uma tarefa sendo quebrada (ver
  // uso em tasks-board.tsx, com `key` pelo id da tarefa), então o estado
  // inicial pode vir direto das props, sem precisar de um efeito.
  const [steps, setSteps] = useState<string[]>(() => generateBreakdownSteps(title, description ?? ""));
  const [saving, setSaving] = useState(false);

  function updateStep(i: number, value: string) {
    setSteps((s) => s.map((step, idx) => (idx === i ? value : step)));
  }
  function removeStep(i: number) {
    setSteps((s) => s.filter((_, idx) => idx !== i));
  }
  function addStep() {
    setSteps((s) => [...s, ""]);
  }

  async function handleSave() {
    const finalSteps = steps.map((s) => s.trim()).filter(Boolean);
    if (finalSteps.length === 0) return;
    setSaving(true);
    await fetch(`/api/tasks/${taskId}/subtasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ steps: finalSteps }),
    });
    setSaving(false);
    onSaved();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="🧱 Quebrar tarefa" wide>
      <p className="mb-4 text-sm text-muted">
        Sugerimos estas etapas pequenas para <strong>{title}</strong>. Edite, remova ou adicione o que quiser antes
        de salvar.
      </p>
      <div className="space-y-2">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-5 shrink-0 text-sm text-muted">{i + 1}.</span>
            <Input value={step} onChange={(e) => updateStep(i, e.target.value)} />
            <button
              onClick={() => removeStep(i)}
              className="shrink-0 text-muted hover:text-danger"
              aria-label="Remover etapa"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={addStep}
        className="mt-3 flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        <Plus size={16} /> Adicionar etapa
      </button>

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Salvando..." : "Salvar etapas"}
        </Button>
      </div>
    </Modal>
  );
}
