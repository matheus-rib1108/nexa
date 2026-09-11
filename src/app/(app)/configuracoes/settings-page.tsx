"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type UserData = {
  name: string;
  lastName: string | null;
  birthDate: string | null;
  theme: string;
  focusDefaultMinutes: number;
  reduceMotion: boolean;
};

const LOG_LABELS: Record<string, string> = {
  login: "Login realizado",
  login_failed: "Tentativa de login com senha incorreta",
  password_change: "Senha alterada",
  vault_unlock: "Cofre desbloqueado",
  logout_all: "Encerrou todas as sessões",
  mission_bonus: "Bônus de missão diária resgatado",
};

export function SettingsPage({ user }: { user: UserData }) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [lastName, setLastName] = useState(user.lastName ?? "");
  const [theme, setTheme] = useState(user.theme);
  const [focusDefaultMinutes, setFocusDefaultMinutes] = useState(user.focusDefaultMinutes);
  const [reduceMotion, setReduceMotion] = useState(user.reduceMotion);
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);

  const [logs, setLogs] = useState<{ id: string; type: string; createdAt: string }[]>([]);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/user/security-logs")
      .then((r) => r.json())
      .then((d) => setLogs(d.logs ?? []));
  }, []);

  function applyTheme(value: string) {
    const isDark = value === "dark" || (value === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("nexa-theme", value);
  }

  function applyReduceMotion(value: boolean) {
    document.documentElement.classList.toggle("reduce-motion", value);
    localStorage.setItem("nexa-reduce-motion", String(value));
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, lastName }),
    });
    await fetch("/api/user/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme, focusDefaultMinutes, reduceMotion }),
    });
    applyTheme(theme);
    applyReduceMotion(reduceMotion);
    setSavingProfile(false);
    router.refresh();
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setChangingPassword(true);
    const res = await fetch("/api/user/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    setChangingPassword(false);
    if (!res.ok) {
      setPasswordError(data.error);
      return;
    }
    await signOut({ callbackUrl: "/login" });
  }

  async function handleLogoutAll() {
    if (!confirm("Isso encerrará todas as sessões, incluindo esta. Continuar?")) return;
    await fetch("/api/user/logout-all", { method: "POST" });
    await signOut({ callbackUrl: "/login" });
  }

  async function handleDeleteAccount(e: React.FormEvent) {
    e.preventDefault();
    setDeleteError(null);
    if (!confirm("Isso excluirá permanentemente sua conta e todos os seus dados. Tem certeza?")) return;
    const res = await fetch("/api/user", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: deletePassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      setDeleteError(data.error);
      return;
    }
    await signOut({ callbackUrl: "/login" });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 p-4 md:p-8">
      <h1 className="text-2xl font-semibold">⚙️ Configurações</h1>

      <Card>
        <p className="mb-3 text-sm font-semibold">Perfil</p>
        <form onSubmit={saveProfile} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>Sobrenome</Label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>

          <p className="pt-2 text-sm font-semibold">Preferências</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tema</Label>
              <Select value={theme} onChange={(e) => setTheme(e.target.value)}>
                <option value="system">Automático</option>
                <option value="light">Claro</option>
                <option value="dark">Escuro</option>
              </Select>
            </div>
            <div>
              <Label>Duração padrão do foco (min)</Label>
              <Input
                type="number"
                min={1}
                max={240}
                value={focusDefaultMinutes}
                onChange={(e) => setFocusDefaultMinutes(parseInt(e.target.value, 10) || 25)}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={reduceMotion} onChange={(e) => setReduceMotion(e.target.checked)} />
            Reduzir animações
          </label>

          <Button type="submit" disabled={savingProfile}>
            {savingProfile ? "Salvando..." : "Salvar alterações"}
          </Button>
        </form>
      </Card>

      <Card>
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold">🔒 Segurança</p>

        <form onSubmit={handleChangePassword} className="mb-4 space-y-2 border-b border-border pb-4">
          <p className="text-sm font-medium">Alterar senha</p>
          <Input type="password" placeholder="Senha atual" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          <Input type="password" placeholder="Nova senha" minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          {passwordError && <p className="text-sm text-danger">{passwordError}</p>}
          <Button type="submit" variant="secondary" disabled={changingPassword}>
            {changingPassword ? "Alterando..." : "Alterar senha"}
          </Button>
        </form>

        <div className="mb-4 border-b border-border pb-4">
          <p className="mb-2 text-sm font-medium">Sessões</p>
          <p className="mb-2 text-xs text-muted">
            Este é um sistema de sessão simplificado: não listamos dispositivos individuais, mas você pode encerrar
            todas as sessões ativas de uma vez (incluindo esta).
          </p>
          <Button variant="danger" size="sm" onClick={handleLogoutAll}>
            Sair de todos os dispositivos
          </Button>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Histórico de segurança</p>
          <div className="max-h-40 space-y-1 overflow-y-auto text-xs text-muted">
            {logs.length === 0 && <p>Nenhum evento registrado.</p>}
            {logs.map((l) => (
              <div key={l.id} className="flex justify-between">
                <span>{LOG_LABELS[l.type] ?? l.type}</span>
                <span>{format(new Date(l.createdAt), "d MMM, HH:mm", { locale: ptBR })}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <Link href="/privacidade" className="text-sm font-medium text-primary hover:underline">
          🔒 Privacidade e Segurança
        </Link>
      </Card>

      <Card className="border-danger/30">
        <p className="mb-2 text-sm font-semibold text-danger">Excluir conta</p>
        <p className="mb-3 text-xs text-muted">
          Isso apaga permanentemente sua conta e todos os dados associados (tarefas, notas, itens do Cofre, hábitos
          etc.). Essa ação não pode ser desfeita.
        </p>
        <form onSubmit={handleDeleteAccount} className="flex gap-2">
          <Input type="password" placeholder="Confirme sua senha" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} />
          <Button type="submit" variant="danger">
            Excluir conta
          </Button>
        </form>
        {deleteError && <p className="mt-2 text-sm text-danger">{deleteError}</p>}
      </Card>
    </div>
  );
}
