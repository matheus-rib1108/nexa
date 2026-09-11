import { requireUserId } from "@/lib/session";
import { db } from "@/lib/db";
import { SettingsPage } from "./settings-page";

export default async function ConfiguracoesPage() {
  const userId = await requireUserId();
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { name: true, lastName: true, birthDate: true, theme: true, focusDefaultMinutes: true, reduceMotion: true },
  });

  if (!user) return null;

  return (
    <SettingsPage
      user={{
        ...user,
        birthDate: user.birthDate ? user.birthDate.toISOString() : null,
      }}
    />
  );
}
