"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sparkles, BookOpen, Boxes, Timer } from "lucide-react";
import { generateBreakdownSteps } from "@/lib/task-break";
import { generateStudyPlan } from "@/lib/study-plan";
import { differenceInCalendarDays } from "date-fns";
import Link from "next/link";

type Tab = "prova" | "tarefa" | "tempo";

export function AssistantPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("prova");

  return (
    <div className="mx-auto max-w-2xl space-y-5 p-4 md:p-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <Sparkles className="text-primary" /> Assistente NEXA
        </h1>
        <p className="text-sm text-muted">
          Um assistente de organização baseado em regras — ajuda a planejar, dividir tarefas e sugerir o que fazer
          com seu tempo. Ele não é um médico, psicólogo, nem substitui acompanhamento profissional.
        </p>
      </div>

      <div className="flex gap-2">
        <TabButton active={tab === "prova"} onClick={() => setTab("prova")} icon={<BookOpen size={14} />} label="Tenho uma prova" />
        <TabButton active={tab === "tarefa"} onClick={() => setTab("tarefa")} icon={<Boxes size={14} />} label="Tarefa grande" />
        <TabButton active={tab === "tempo"} onClick={() => setTab("tempo")} icon={<Timer size={14} />} label="Tempo livre" />
      </div>

      {tab === "prova" && <ExamPlanner onDone={() => router.push("/estudos")} />}
      {tab === "tarefa" && <TaskBreaker onDone={() => router.push("/tarefas")} />}
      {tab === "tempo" && <FreeTimeHelper />}
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium ${
        active ? "bg-primary text-primary-foreground" : "bg-surface-muted text-muted"
      }`}
    >
      {icon} {label}
    </button>
  );
}

function ExamPlanner({ onDone }: { onDone: () => void }) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [topics, setTopics] = useState("");
  const [plan, setPlan] = useState<ReturnType<typeof generateStudyPlan> | null>(null);
  const [saving, setSaving] = useState(false);

  function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!date) return;
    const days = differenceInCalendarDays(new Date(date), new Date());
    const topicList = topics.split(",").map((t) => t.trim()).filter(Boolean);
    setPlan(generateStudyPlan(topicList, days));
  }

  async function handleSave() {
    setSaving(true);
    await fetch("/api/exams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, date, topics: topics.split(",").map((t) => t.trim()).filter(Boolean) }),
    });
    setSaving(false);
    onDone();
  }

  return (
    <Card>
      <p className="mb-3 text-sm text-muted">
        Diga qual a prova, quando é, e o que vai cair — eu monto um plano de estudos até a data.
      </p>
      <form onSubmit={handleGenerate} className="space-y-3">
        <Input placeholder="Ex: Prova de química" required value={title} onChange={(e) => setTitle(e.target.value)} />
        <Input type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
        <Input placeholder="Conteúdos (separados por vírgula)" value={topics} onChange={(e) => setTopics(e.target.value)} />
        <Button type="submit">Gerar plano</Button>
      </form>

      {plan && (
        <div className="mt-4 space-y-1.5 border-t border-border pt-4">
          {plan.length === 0 ? (
            <p className="text-sm text-muted">A data já passou ou é hoje — não há dias para planejar.</p>
          ) : (
            <>
              {plan.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>Dia {item.dayOffset}: {item.activity}</span>
                  <span className="text-muted">{item.minutes} min</span>
                </div>
              ))}
              <Button className="mt-3" onClick={handleSave} disabled={saving}>
                {saving ? "Salvando..." : "Salvar como prova"}
              </Button>
            </>
          )}
        </div>
      )}
    </Card>
  );
}

function TaskBreaker({ onDone }: { onDone: () => void }) {
  const [title, setTitle] = useState("");
  const [steps, setSteps] = useState<string[] | null>(null);
  const [saving, setSaving] = useState(false);

  function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSteps(generateBreakdownSteps(title));
  }

  async function handleSave() {
    if (!steps) return;
    setSaving(true);
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    const data = await res.json();
    await fetch(`/api/tasks/${data.task.id}/subtasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ steps }),
    });
    setSaving(false);
    onDone();
  }

  return (
    <Card>
      <p className="mb-3 text-sm text-muted">Descreva a tarefa que parece grande demais. Eu divido em passos menores.</p>
      <form onSubmit={handleGenerate} className="flex gap-2">
        <Input placeholder="Ex: fazer trabalho de história" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Button type="submit">Dividir</Button>
      </form>

      {steps && (
        <div className="mt-4 space-y-1.5 border-t border-border pt-4">
          {steps.map((s, i) => (
            <p key={i} className="text-sm">
              {i + 1}. {s}
            </p>
          ))}
          <Button className="mt-3" onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar como tarefa"}
          </Button>
        </div>
      )}
    </Card>
  );
}

function FreeTimeHelper() {
  return (
    <Card>
      <p className="mb-3 text-sm text-muted">Me diga quanto tempo livre você tem e eu busco tarefas que cabem nesse período.</p>
      <Link href="/tempo-livre">
        <Button>Ver sugestões por tempo disponível</Button>
      </Link>
    </Card>
  );
}
