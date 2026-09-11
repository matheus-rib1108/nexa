import { requireUserId } from "@/lib/session";
import { db } from "@/lib/db";
import { xpProgress } from "@/lib/gamification";
import { getWeeklyStats, getOverallStats } from "@/server/stats";
import { ACHIEVEMENT_DEFS } from "@/server/achievements";
import { Card, Badge } from "@/components/ui/card";
import { MissionsCard } from "./missions-card";
import { Trophy, ListChecks, Clock3, AlertTriangle, CalendarCheck, Lock } from "lucide-react";

export default async function ProgressoPage() {
  const userId = await requireUserId();
  const user = await db.user.findUnique({ where: { id: userId }, select: { xp: true } });
  const xp = user?.xp ?? 0;
  const progress = xpProgress(xp);

  const [weekly, overall, unlockedAchievements] = await Promise.all([
    getWeeklyStats(userId),
    getOverallStats(userId),
    db.userAchievement.findMany({ where: { userId }, include: { achievement: true } }),
  ]);

  const unlockedKeys = new Set(unlockedAchievements.map((u) => u.achievement.key));
  const maxCount = Math.max(1, ...weekly.map((w) => w.count));

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 md:p-8">
      <h1 className="text-2xl font-semibold">🏆 Progresso</h1>

      <Card>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold">Nível {progress.level}</p>
          <p className="text-xs text-muted">
            {progress.currentLevelXp} / {progress.neededForNextLevel} XP
          </p>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress.percent}%` }} />
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success-soft text-success">
            <ListChecks size={18} />
          </div>
          <div>
            <p className="text-lg font-semibold">{overall.completedTotal}</p>
            <p className="text-xs text-muted">tarefas concluídas</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-accent">
            <Clock3 size={18} />
          </div>
          <div>
            <p className="text-lg font-semibold">{overall.totalFocusMinutes} min</p>
            <p className="text-xs text-muted">de foco acumulado</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning-soft text-warning">
            <AlertTriangle size={18} />
          </div>
          <div>
            <p className="text-lg font-semibold">{overall.overdueTotal}</p>
            <p className="text-xs text-muted">tarefas atrasadas</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-primary">
            <CalendarCheck size={18} />
          </div>
          <div>
            <p className="text-lg font-semibold">{overall.activeDays}</p>
            <p className="text-xs text-muted">dias ativos</p>
          </div>
        </Card>
      </div>

      <Card>
        <p className="mb-3 text-sm font-semibold">Produtividade da semana</p>
        <div className="flex items-end gap-2" style={{ height: 100 }}>
          {weekly.map((day, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t-md bg-primary-soft"
                style={{ height: `${Math.max(6, (day.count / maxCount) * 80)}px` }}
              />
              <span className="text-[11px] text-muted capitalize">{day.label}</span>
            </div>
          ))}
        </div>
      </Card>

      <MissionsCard />

      <Card>
        <p className="mb-3 text-sm font-semibold">Conquistas</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {ACHIEVEMENT_DEFS.map((def) => {
            const unlocked = unlockedKeys.has(def.key);
            return (
              <div
                key={def.key}
                className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center ${
                  unlocked ? "border-primary/30 bg-primary-soft/40" : "border-border opacity-50"
                }`}
              >
                {unlocked ? <Trophy size={20} className="text-primary" /> : <Lock size={20} className="text-muted" />}
                <p className="text-xs font-medium">{def.name}</p>
                <Badge tone={unlocked ? "primary" : "default"}>{def.xpReward} XP</Badge>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
