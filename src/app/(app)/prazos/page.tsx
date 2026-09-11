import { requireUserId } from "@/lib/session";
import { getDeadlineRadar } from "@/server/deadlines";
import { Card, Badge } from "@/components/ui/card";
import { format, isTomorrow, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertTriangle } from "lucide-react";

const BUCKET_LABEL: Record<string, { label: string; emoji: string; tone: "danger" | "warning" | "default" }> = {
  urgente: { label: "Urgente", emoji: "🔴", tone: "danger" },
  proximo: { label: "Próximos dias", emoji: "🟠", tone: "warning" },
  atencao: { label: "Esta semana", emoji: "🟡", tone: "warning" },
  futuro: { label: "Mais adiante", emoji: "⚪", tone: "default" },
};

function dayLabel(date: Date, daysUntil: number) {
  if (isToday(date)) return "Hoje";
  if (isTomorrow(date)) return "Amanhã";
  if (daysUntil <= 6) return `Em ${daysUntil} dias`;
  return format(date, "d 'de' MMMM", { locale: ptBR });
}

export default async function DeadlineRadarPage() {
  const userId = await requireUserId();
  const { items, overloaded, weekCount, suggestion } = await getDeadlineRadar(userId);

  const groups = ["urgente", "proximo", "atencao", "futuro"] as const;

  return (
    <div className="mx-auto max-w-2xl space-y-5 p-4 md:p-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">🚨 Deadline Radar</h1>
        <p className="text-sm text-muted">Todos os seus prazos, organizados por urgência.</p>
      </div>

      {overloaded && (
        <Card className="border-warning/40 bg-warning-soft">
          <p className="flex items-center gap-2 text-sm font-semibold text-warning">
            <AlertTriangle size={16} /> Você possui {weekCount} tarefas importantes nesta semana.
          </p>
          {suggestion && (
            <p className="mt-1.5 text-sm text-foreground">
              Recomendamos começar <strong>{suggestion.title}</strong> hoje, para não acumular tudo no fim.
            </p>
          )}
        </Card>
      )}

      {items.length === 0 ? (
        <Card className="text-center text-sm text-muted">Nenhum prazo por aqui. Tudo tranquilo. ✨</Card>
      ) : (
        groups.map((bucket) => {
          const bucketItems = items.filter((i) => i.bucket === bucket);
          if (bucketItems.length === 0) return null;
          const meta = BUCKET_LABEL[bucket];
          return (
            <Card key={bucket}>
              <p className="mb-3 text-sm font-semibold">
                {meta.emoji} {meta.label}
              </p>
              <div className="space-y-2">
                {bucketItems.map((item) => (
                  <div key={`${item.type}-${item.id}`} className="flex items-center justify-between text-sm">
                    <span>{item.title}</span>
                    <Badge tone={meta.tone}>{dayLabel(item.date, item.daysUntil)}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
}
