import { requireUserId } from "@/lib/session";
import { db } from "@/lib/db";
import { NotesBoard } from "./notes-board";

export default async function AnotacoesPage() {
  const userId = await requireUserId();
  const notes = await db.note.findMany({
    where: { userId },
    orderBy: [{ isFavorite: "desc" }, { updatedAt: "desc" }],
  });

  return <NotesBoard initialNotes={JSON.parse(JSON.stringify(notes))} />;
}
