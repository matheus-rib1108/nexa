import { requireUserId } from "@/lib/session";
import { getNextAction } from "@/server/priority";
import { AgoraFlow } from "./agora-flow";

export default async function AgoraPage() {
  const userId = await requireUserId();
  const nextAction = await getNextAction(userId);

  return (
    <div className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center p-4 py-12 md:p-8">
      <AgoraFlow initial={nextAction} />
    </div>
  );
}
