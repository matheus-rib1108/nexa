"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HABIT_STAGE_EMOJI } from "@/lib/gamification";
import { Plus, Trash2 } from "lucide-react";
import { startOfDay, subDays, isSameDay } from "date-fns";
import { cn } from "@/lib/cn";

type HabitLog = { date: string; completed: boolean };
type Habit = {
  id: string;
  name: string;
  streak: number;
  bestStreak: number;
  stage: string;
  logs: HabitLog[];
};

function isDoneToday(habit: Habit) {
  return habit.logs.some((l) => isSameDay(new Date(l.date), new Date()) && l.completed);
}

function last14Days() {
  return Array.from({ length: 14 }, (_, i) => subDays(startOfDay(new Date()), 13 - i));
}

export function HabitGarden({ initialHabits }: { initialHabits: Habit[] }) {
  const [habits, setHabits] = useState(initialHabits);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);

  async function addHabit(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    const res = await fetch("/api/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    const data = await res.json();
    setHabits((prev) => [...prev, data.habit]);
    setNewName("");
    setAdding(false);
  }

  async function toggleCheck(habitId: string) {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habitId) return h;
        const done = isDoneToday(h);
        const todayIso = startOfDay(new Date()).toISOString();
        const logs = done
          ? h.logs.map((l) => (isSameDay(new Date(l.date), new Date()) ? { ...l, completed: false } : l))
          : [...h.logs.filter((l) => !isSameDay(new Date(l.date), new Date())), { date: todayIso, completed: true }];
        return { ...h, logs };
      }),
    );

    const res = await fetch(`/api/habits/${habitId}/check`, { method: "POST" });
    const data = await res.json();
    setHabits((prev) =>
      prev.map((h) => (h.id === habitId ? { ...h, streak: data.streak, bestStreak: data.bestStreak, stage: data.stage } : h)),
    );
  }

  async function removeHabit(habitId: string) {
    if (!confirm("Remover este hábito?")) return;
    setHabits((prev) => prev.filter((h) => h.id !== habitId));
    await fetch(`/api/habits/${habitId}`, { method: "DELETE" });
  }

  const days = last14Days();

  return (
    <div className="mx-auto max-w-2xl space-y-5 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold">🌱 Habit Garden</h1>
        <p className="text-sm text-muted">Cada hábito concluído faz seu jardim crescer. Perder um dia não apaga o progresso.</p>
      </div>

      <Card>
        <form onSubmit={addHabit} className="flex gap-2">
          <Input placeholder="Novo hábito, ex: Beber água" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <Button type="submit" disabled={adding || !newName.trim()}>
            <Plus size={16} />
          </Button>
        </form>
      </Card>

      {habits.length === 0 && <Card className="text-center text-sm text-muted">Nenhum hábito ainda. Comece com um pequeno.</Card>}

      <div className="space-y-3">
        {habits.map((habit) => {
          const doneToday = isDoneToday(habit);
          return (
            <Card key={habit.id}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{HABIT_STAGE_EMOJI[habit.stage] ?? "🌱"}</span>
                  <div>
                    <p className="font-medium">{habit.name}</p>
                    <p className="text-xs text-muted">
                      {habit.streak} dia(s) seguidos · melhor sequência: {habit.bestStreak}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant={doneToday ? "secondary" : "primary"} onClick={() => toggleCheck(habit.id)}>
                    {doneToday ? "Feito hoje ✓" : "Marcar hoje"}
                  </Button>
                  <button onClick={() => removeHabit(habit.id)} className="text-muted hover:text-danger" aria-label="Remover">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="mt-3 flex gap-1">
                {days.map((day) => {
                  const log = habit.logs.find((l) => isSameDay(new Date(l.date), day) && l.completed);
                  return (
                    <div
                      key={day.toISOString()}
                      className={cn("h-4 flex-1 rounded-sm", log ? "bg-success" : "bg-surface-muted")}
                      title={day.toLocaleDateString("pt-BR")}
                    />
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
