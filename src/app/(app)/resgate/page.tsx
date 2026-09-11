"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { generateBreakdownSteps } from "@/lib/task-break";
import { cn } from "@/lib/cn";
import { LifeBuoy, ArrowRight } from "lucide-react";

const TIME_OPTIONS = [2, 5, 10, 15];

export default function ResgatePage() {
  const [step, setStep] = useState<"pergunta" | "tempo" | "acao">("pergunta");
  const [taskText, setTaskText] = useState("");
  const [minutes, setMinutes] = useState<number | null>(null);
  const [microSteps, setMicroSteps] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  function handleTaskSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!taskText.trim()) return;
    setStep("tempo");
  }

  function chooseTime(m: number) {
    setMinutes(m);
    setMicroSteps(generateBreakdownSteps(taskText));
    setCurrentIndex(0);
    setStep("acao");
  }

  function nextStep() {
    setCurrentIndex((i) => Math.min(i + 1, microSteps.length - 1));
  }

  function reset() {
    setStep("pergunta");
    setTaskText("");
    setMinutes(null);
    setCurrentIndex(0);
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col items-center justify-center p-4">
      <div className="mb-6 text-center">
        <LifeBuoy className="mx-auto mb-2 text-primary" size={28} />
        <h1 className="text-xl font-semibold">Não consigo começar</h1>
        <p className="text-sm text-muted">Tudo bem. Vamos começar com uma etapa bem pequena.</p>
      </div>

      {step === "pergunta" && (
        <Card className="w-full">
          <form onSubmit={handleTaskSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">O que você precisa fazer?</label>
              <Input
                autoFocus
                placeholder="Ex: preciso estudar matemática"
                value={taskText}
                onChange={(e) => setTaskText(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={!taskText.trim()}>
              Continuar <ArrowRight size={16} />
            </Button>
          </form>
        </Card>
      )}

      {step === "tempo" && (
        <Card className="w-full">
          <p className="mb-3 text-sm font-medium">Quanto você consegue fazer agora?</p>
          <div className="grid grid-cols-4 gap-2">
            {TIME_OPTIONS.map((m) => (
              <button
                key={m}
                onClick={() => chooseTime(m)}
                className="rounded-xl border border-border py-3 text-sm font-medium hover:border-primary hover:bg-primary-soft hover:text-primary"
              >
                {m} min
              </button>
            ))}
          </div>
        </Card>
      )}

      {step === "acao" && (
        <Card className="w-full text-center">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">
            Passo {currentIndex + 1} de {microSteps.length}
          </p>
          <h2 className="mb-6 text-xl font-semibold leading-snug">{microSteps[currentIndex]}</h2>
          <div className="flex flex-col gap-2">
            {currentIndex < microSteps.length - 1 ? (
              <Button onClick={nextStep}>Feito, próximo passo</Button>
            ) : (
              <div className="rounded-xl bg-success-soft px-4 py-3 text-sm font-medium text-success">
                Você já deu o primeiro passo. Isso é o que importa. 🎉
              </div>
            )}
            <Link href={`/foco?preset=${minutes}`}>
              <Button variant="secondary" className="w-full">
                Continuar com o timer de {minutes} min
              </Button>
            </Link>
            <button onClick={reset} className={cn("text-sm text-muted hover:underline")}>
              Começar de novo
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}
