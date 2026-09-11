"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { AlarmClock, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";

type Alarm = { id: string; label: string; time: string; daysOfWeek: string; enabled: boolean };
const DAY_LABELS = ["D", "S", "T", "Q", "Q", "S", "S"];

export function AlarmsBoard({ initialAlarms }: { initialAlarms: Alarm[] }) {
  const [alarms, setAlarms] = useState(initialAlarms);
  const [formOpen, setFormOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [time, setTime] = useState("07:00");
  const [days, setDays] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  function toggleDay(d: number) {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/alarms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, time, daysOfWeek: days }),
    });
    const data = await res.json();
    setAlarms((prev) => [...prev, data.alarm].sort((a, b) => a.time.localeCompare(b.time)));
    setSaving(false);
    setFormOpen(false);
    setLabel("");
    setTime("07:00");
    setDays([]);
  }

  async function toggleEnabled(alarm: Alarm) {
    setAlarms((prev) => prev.map((a) => (a.id === alarm.id ? { ...a, enabled: !a.enabled } : a)));
    await fetch(`/api/alarms/${alarm.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !alarm.enabled }),
    });
  }

  async function remove(id: string) {
    setAlarms((prev) => prev.filter((a) => a.id !== id));
    await fetch(`/api/alarms/${id}`, { method: "DELETE" });
  }

  return (
    <div className="mx-auto max-w-xl space-y-5 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <AlarmClock className="text-primary" /> Alarmes
        </h1>
        <Button onClick={() => setFormOpen(true)}>
          <Plus size={16} /> Novo alarme
        </Button>
      </div>

      <p className="text-xs text-muted">
        Os alarmes tocam enquanto o NEXA estiver aberto no navegador (em segundo plano também funciona). Navegadores
        não permitem alarmes confiáveis com o app totalmente fechado — isso exigiria uma versão nativa no
        celular.
      </p>

      {alarms.length === 0 ? (
        <Card className="text-center text-sm text-muted">Nenhum alarme cadastrado.</Card>
      ) : (
        <div className="space-y-2">
          {alarms.map((alarm) => {
            const days: number[] = JSON.parse(alarm.daysOfWeek || "[]");
            return (
              <Card key={alarm.id} className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-semibold tabular-nums">{alarm.time}</p>
                  <p className="text-sm text-muted">{alarm.label}</p>
                  <div className="mt-1 flex gap-1">
                    {DAY_LABELS.map((d, i) => (
                      <span
                        key={i}
                        className={cn(
                          "flex h-5 w-5 items-center justify-center rounded-full text-[10px]",
                          days.includes(i) ? "bg-primary text-primary-foreground" : "bg-surface-muted text-muted",
                        )}
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleEnabled(alarm)}
                    className={cn(
                      "h-6 w-11 rounded-full transition-colors",
                      alarm.enabled ? "bg-primary" : "bg-surface-muted",
                    )}
                  >
                    <span
                      className={cn(
                        "block h-5 w-5 rounded-full bg-white shadow transition-transform",
                        alarm.enabled ? "translate-x-5" : "translate-x-0.5",
                      )}
                    />
                  </button>
                  <button onClick={() => remove(alarm.id)} className="text-muted hover:text-danger">
                    <Trash2 size={16} />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Novo alarme">
        <form onSubmit={handleCreate} className="space-y-3">
          <Input placeholder="Nome (ex: Acordar)" required value={label} onChange={(e) => setLabel(e.target.value)} />
          <Input type="time" required value={time} onChange={(e) => setTime(e.target.value)} />
          <div>
            <p className="mb-1.5 text-sm font-medium">Repetir</p>
            <div className="flex gap-1.5">
              {DAY_LABELS.map((d, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => toggleDay(i)}
                  className={cn(
                    "h-8 w-8 rounded-full text-xs font-medium",
                    days.includes(i) ? "bg-primary text-primary-foreground" : "bg-surface-muted text-muted",
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-muted">Nenhum dia selecionado = toca uma única vez hoje.</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setFormOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Criar alarme"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
