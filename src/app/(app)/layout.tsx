import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { levelFromXp } from "@/lib/gamification";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Topbar } from "@/components/layout/topbar";
import { AlarmWatcher } from "@/components/alarm-watcher";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, xp: true, onboardingCompleted: true },
  });

  if (!user) redirect("/login");
  if (!user.onboardingCompleted) redirect("/onboarding");

  const level = levelFromXp(user.xp);

  return (
    <div className="flex min-h-screen">
      <Sidebar userName={user.name} level={level} />
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar userName={user.name} />
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
      </div>
      <BottomNav />
      <AlarmWatcher />
    </div>
  );
}
