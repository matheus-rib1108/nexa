"use client";

import { useState } from "react";
import { Card, Badge } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { GraduationCap, Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { format, differenceInCalendarDays } from "date-fns";
import { ptBR } from "date-fns/locale";

type Subject = { id: string; name: string; color: string; _count: { tasks: number; exams: number } };
type StudyPlanItem = { dayOffset: number; minutes: number; activity: string };
type Exam = {
  id: string;
  title: string;
  date: string;
  topics: string | null;
  studyPlan: string | null;
  subject: { id: string; name: string } | null;
};

export function StudyBoard({ initialSubjects, initialExams }: { initialSubjects: Subject[]; initialExams: Exam[] }) {
  const [subjects, setSubjects] = useState(initialSubjects);
  const [exams, setExams] = useState(initialExams);
  const [subjectFormOpen, setSubjectFormOpen] = useState(false);
  const [examFormOpen, setExamFormOpen] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  async function addSubject(e: React.FormEvent) {
    e.preventDefault();
    if (!newSubject.trim()) return;
    const res = await fetch("/api/subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newSubject.trim() }),
    });
    const data = await res.json();
    setSubjects((prev) => [...prev, { ...data.subject, _count: { tasks: 0, exams: 0 } }]);
    setNewSubject("");
    setSubjectFormOpen(false);
  }

  async function removeSubject(id: string) {
    if (!confirm("Remover matéria?")) return;
    setSubjects((prev) => prev.filter((s) => s.id !== id));
    await fetch(`/api/subjects/${id}`, { method: "DELETE" });
  }

  async function removeExam(id: string) {
    if (!confirm("Remover prova?")) return;
    setExams((prev) => prev.filter((e) => e.id !== id));
    await fetch(`/api/exams/${id}`, { method: "DELETE" });
  }

  async function reloadExams() {
    const res = await fetch("/api/exams");
    const data = await res.json();
    setExams(data.exams ?? []);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 md:p-8">
      <h1 className="flex items-center gap-2 text-2xl font-semibold">
        <GraduationCap className="text-primary" /> Estudos
      </h1>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold">Matérias</p>
          <Button size="sm" variant="secondary" onClick={() => setSubjectFormOpen(true)}>
            <Plus size={14} /> Nova
          </Button>
        </div>
        {subjects.length === 0 ? (
          <p className="text-sm text-muted">Cadastre suas matérias para organizar tarefas e provas.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {subjects.map((s) => (
              <span key={s.id} className="flex items-center gap-1.5 rounded-full bg-surface-muted px-3 py-1.5 text-sm">
                {s.name}
                <Badge tone="default">{s._count.tasks} tarefas</Badge>
                <button onClick={() => removeSubject(s.id)} className="text-muted hover:text-danger">
                  <Trash2 size={13} />
                </button>
              </span>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold">Provas e planejamento de estudos</p>
          <Button size="sm" onClick={() => setExamFormOpen(true)}>
            <Plus size={14} /> Nova prova
          </Button>
        </div>
        {exams.length === 0 ? (
          <p className="text-sm text-muted">Nenhuma prova cadastrada.</p>
        ) : (
          <div className="space-y-2">
            {exams.map((exam) => {
              const plan: StudyPlanItem[] = exam.studyPlan ? JSON.parse(exam.studyPlan) : [];
              const isOpen = expanded === exam.id;
              const days = differenceInCalendarDays(new Date(exam.date), new Date());
              return (
                <div key={exam.id} className="rounded-xl border border-border">
                  <button
                    onClick={() => setExpanded(isOpen ? null : exam.id)}
                    className="flex w-full items-center gap-2 p-3 text-left"
                  >
                    {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {exam.title}
                        {exam.subject && !exam.title.toLowerCase().includes(exam.subject.name.toLowerCase())
                          ? ` — ${exam.subject.name}`
                          : ""}
                      </p>
                      <p className="text-xs text-muted">{format(new Date(exam.date), "d 'de' MMMM", { locale: ptBR })}</p>
                    </div>
                    <Badge tone={days <= 3 ? "danger" : "primary"}>{days <= 0 ? "Hoje" : `${days} dias`}</Badge>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeExam(exam.id);
                      }}
                      className="text-muted hover:text-danger"
                    >
                      <Trash2 size={14} />
                    </button>
                  </button>
                  {isOpen && plan.length > 0 && (
                    <div className="space-y-1.5 border-t border-border p-3">
                      {plan.map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span>
                            Dia {item.dayOffset}: {item.activity}
                          </span>
                          <span className="text-muted">{item.minutes} min</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Modal open={subjectFormOpen} onClose={() => setSubjectFormOpen(false)} title="Nova matéria">
        <form onSubmit={addSubject} className="flex gap-2">
          <Input placeholder="Ex: Física" value={newSubject} onChange={(e) => setNewSubject(e.target.value)} />
          <Button type="submit">Adicionar</Button>
        </form>
      </Modal>

      <ExamFormModal
        open={examFormOpen}
        onClose={() => setExamFormOpen(false)}
        onSaved={reloadExams}
        subjects={subjects}
      />
    </div>
  );
}

function ExamFormModal({
  open,
  onClose,
  onSaved,
  subjects,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  subjects: Subject[];
}) {
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [date, setDate] = useState("");
  const [topics, setTopics] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/exams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        subjectId: subjectId || null,
        date,
        topics: topics
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      }),
    });
    setSaving(false);
    setTitle("");
    setSubjectId("");
    setDate("");
    setTopics("");
    onSaved();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Nova prova">
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input placeholder="Título (ex: Prova de Química)" required value={title} onChange={(e) => setTitle(e.target.value)} />
        <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
          <option value="">Sem matéria</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
        <Input type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
        <Input
          placeholder="Conteúdos que vão cair (separados por vírgula)"
          value={topics}
          onChange={(e) => setTopics(e.target.value)}
        />
        <p className="text-xs text-muted">O NEXA vai montar um plano de estudos automático até a data da prova.</p>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Salvando..." : "Criar prova"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
