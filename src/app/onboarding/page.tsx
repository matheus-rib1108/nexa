"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const GOALS = ["Estudos", "Trabalho", "Casa", "Hábitos", "Projetos", "Tudo"];
const CHALLENGES = ["Esquecimento", "Procrastinação", "Começar tarefas", "Gerenciar tempo", "Organização"];
const TIME_OPTIONS = ["Menos de 30 min", "30 min a 1 hora", "1 a 2 horas", "Mais de 2 horas", "Varia muito"];

function MultiChoice({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {options.map((opt) => {
        const isSelected = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            className={cn(
              "rounded-xl border px-3 py-3 text-sm font-medium transition-colors",
              isSelected
                ? "border-primary bg-primary-soft text-primary"
                : "border-border bg-surface text-foreground hover:bg-surface-muted",
            )}
          >
            {isSelected ? "☑️ " : "☐ "}
            {opt}
          </button>
        );
      })}
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [goals, setGoals] = useState<string[]>([]);
  const [challenges, setChallenges] = useState<string[]>([]);
  const [timeAvailable, setTimeAvailable] = useState<string>("");
  const [saving, setSaving] = useState(false);

  function toggle(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  const steps = [
    {
      title: "O que você quer organizar?",
      body: <MultiChoice options={GOALS} selected={goals} onToggle={(v) => toggle(goals, setGoals, v)} />,
      canAdvance: goals.length > 0,
    },
    {
      title: "O que mais dificulta sua organização?",
      body: (
        <MultiChoice options={CHALLENGES} selected={challenges} onToggle={(v) => toggle(challenges, setChallenges, v)} />
      ),
      canAdvance: challenges.length > 0,
    },
    {
      title: "Quanto tempo você normalmente tem disponível por dia?",
      body: (
        <div className="space-y-2">
          {TIME_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setTimeAvailable(opt)}
              className={cn(
                "w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors",
                timeAvailable === opt
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-border bg-surface hover:bg-surface-muted",
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      ),
      canAdvance: timeAvailable.length > 0,
    },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;

  async function finish() {
    setSaving(true);
    await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goals, challenges, timeAvailable }),
    });
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={cn("h-1.5 flex-1 rounded-full", i <= step ? "bg-primary" : "bg-surface-muted")}
            />
          ))}
        </div>
        <Card>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">
            Passo {step + 1} de {steps.length}
          </p>
          <h2 className="mb-5 text-xl font-semibold">{current.title}</h2>
          {current.body}
          <div className="mt-6 flex justify-between">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
            >
              Voltar
            </Button>
            {isLast ? (
              <Button onClick={finish} disabled={!current.canAdvance || saving}>
                {saving ? "Salvando..." : "Concluir"}
              </Button>
            ) : (
              <Button onClick={() => setStep((s) => s + 1)} disabled={!current.canAdvance}>
                Continuar
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
