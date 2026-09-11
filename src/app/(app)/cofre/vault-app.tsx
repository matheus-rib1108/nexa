"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { generatePassword } from "@/lib/password-generator";
import { Lock, Eye, EyeOff, Copy, Plus, Trash2, Pencil, ShieldCheck, Wand2 } from "lucide-react";

type VaultItem = {
  id: string;
  categoryLabel: string;
  name: string;
  username: string | null;
  urlLink: string | null;
  note: string | null;
};

const CATEGORIES = ["Senhas", "Contas", "Códigos", "Informações privadas"] as const;
const CATEGORY_EMOJI: Record<string, string> = {
  Senhas: "🔑",
  Contas: "📧",
  Códigos: "🔐",
  "Informações privadas": "📄",
};

function clearClipboardLater(expected: string) {
  setTimeout(async () => {
    try {
      const current = await navigator.clipboard.readText();
      if (current === expected) await navigator.clipboard.writeText("");
    } catch {
      // Leitura da área de transferência pode ser bloqueada pelo navegador; sem problema.
    }
  }, 20000);
}

export function VaultApp() {
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [masterPassword, setMasterPassword] = useState("");
  const [unlockInput, setUnlockInput] = useState("");
  const [setupInput, setSetupInput] = useState("");
  const [setupConfirm, setSetupConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [items, setItems] = useState<VaultItem[]>([]);
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<VaultItem | null>(null);
  const [generatorOpen, setGeneratorOpen] = useState(false);

  useEffect(() => {
    fetch("/api/vault/status")
      .then((r) => r.json())
      .then((d) => {
        setConfigured(d.configured);
        setLoading(false);
      });
  }, []);

  async function loadItems() {
    const res = await fetch("/api/vault/items");
    const data = await res.json();
    setItems(data.items ?? []);
  }

  async function handleSetup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (setupInput !== setupConfirm) {
      setError("As senhas não coincidem.");
      return;
    }
    const res = await fetch("/api/vault/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ masterPassword: setupInput }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setConfigured(true);
    setMasterPassword(setupInput);
    setUnlocked(true);
    loadItems();
  }

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/vault/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ masterPassword: unlockInput }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setMasterPassword(unlockInput);
    setUnlocked(true);
    loadItems();
  }

  function lock() {
    setUnlocked(false);
    setMasterPassword("");
    setUnlockInput("");
    setRevealed({});
    setItems([]);
  }

  async function reveal(id: string) {
    if (revealed[id] !== undefined) {
      setRevealed((r) => {
        const next = { ...r };
        delete next[id];
        return next;
      });
      return;
    }
    const res = await fetch(`/api/vault/items/${id}/reveal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ masterPassword }),
    });
    const data = await res.json();
    if (res.ok) setRevealed((r) => ({ ...r, [id]: data.secret }));
  }

  async function copySecret(id: string) {
    let secret = revealed[id];
    if (secret === undefined) {
      const res = await fetch(`/api/vault/items/${id}/reveal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ masterPassword }),
      });
      const data = await res.json();
      if (!res.ok) return;
      secret = data.secret;
    }
    await navigator.clipboard.writeText(secret);
    clearClipboardLater(secret);
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este item do Cofre?")) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
    await fetch(`/api/vault/items/${id}`, { method: "DELETE" });
  }

  if (loading) return null;

  if (!configured) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center p-4">
        <Card>
          <ShieldCheck className="mx-auto mb-2 text-primary" size={28} />
          <h1 className="mb-1 text-center text-lg font-semibold">Configurar o Cofre</h1>
          <p className="mb-4 text-center text-sm text-muted">
            Crie uma senha mestra. Ela protege apenas o Cofre — é diferente da senha da sua conta. Os itens são
            cifrados com AES-256-GCM usando uma chave derivada dessa senha; nem os administradores do NEXA conseguem
            ver seu conteúdo sem ela.
          </p>
          <form onSubmit={handleSetup} className="space-y-3">
            <div>
              <Label>Senha mestra</Label>
              <Input type="password" required minLength={8} value={setupInput} onChange={(e) => setSetupInput(e.target.value)} />
            </div>
            <div>
              <Label>Confirmar senha mestra</Label>
              <Input type="password" required minLength={8} value={setupConfirm} onChange={(e) => setSetupConfirm(e.target.value)} />
            </div>
            {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
            <p className="text-xs text-muted">
              Importante: se você esquecer a senha mestra, não será possível recuperar o conteúdo do Cofre — nem para
              a equipe do NEXA. Guarde-a em um lugar seguro.
            </p>
            <Button type="submit" className="w-full">
              Criar Cofre
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center p-4">
        <Card>
          <Lock className="mx-auto mb-2 text-primary" size={28} />
          <h1 className="mb-4 text-center text-lg font-semibold">Desbloquear Cofre</h1>
          <form onSubmit={handleUnlock} className="space-y-3">
            <Input
              type="password"
              placeholder="Senha mestra"
              autoFocus
              required
              value={unlockInput}
              onChange={(e) => setUnlockInput(e.target.value)}
            />
            {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
            <Button type="submit" className="w-full">
              Desbloquear
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <Lock className="text-primary" /> Cofre
        </h1>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              setEditing(null);
              setGeneratorOpen(true);
            }}
          >
            <Wand2 size={16} /> Gerar senha
          </Button>
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus size={16} /> Novo item
          </Button>
          <Button variant="ghost" onClick={lock}>
            Bloquear
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <Card className="text-center text-sm text-muted">Nenhum item salvo ainda.</Card>
      ) : (
        CATEGORIES.map((cat) => {
          const catItems = items.filter((i) => i.categoryLabel === cat);
          if (catItems.length === 0) return null;
          return (
            <Card key={cat}>
              <p className="mb-3 text-sm font-semibold">
                {CATEGORY_EMOJI[cat]} {cat}
              </p>
              <div className="divide-y divide-border">
                {catItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.name}</p>
                      <p className="truncate text-xs text-muted">{item.username || item.urlLink || ""}</p>
                    </div>
                    <span className="w-40 truncate text-sm text-muted">
                      {revealed[item.id] !== undefined ? revealed[item.id] : "••••••••••"}
                    </span>
                    <button onClick={() => reveal(item.id)} className="text-muted hover:text-foreground" aria-label="Mostrar">
                      {revealed[item.id] !== undefined ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button onClick={() => copySecret(item.id)} className="text-muted hover:text-foreground" aria-label="Copiar">
                      <Copy size={16} />
                    </button>
                    <button
                      onClick={() => {
                        setEditing(item);
                        setFormOpen(true);
                      }}
                      className="text-muted hover:text-foreground"
                      aria-label="Editar"
                    >
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="text-muted hover:text-danger" aria-label="Excluir">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          );
        })
      )}

      {formOpen && (
        <VaultItemForm
          key={editing?.id ?? "new"}
          onClose={() => setFormOpen(false)}
          onSaved={loadItems}
          masterPassword={masterPassword}
          editing={editing}
        />
      )}
      {generatorOpen && <PasswordGeneratorModal onClose={() => setGeneratorOpen(false)} />}
    </div>
  );
}

function VaultItemForm({
  onClose,
  onSaved,
  masterPassword,
  editing,
}: {
  onClose: () => void;
  onSaved: () => void;
  masterPassword: string;
  editing: VaultItem | null;
}) {
  // Montado apenas enquanto o formulário está aberto (ver `{formOpen && ...}`
  // em VaultApp, com `key` pelo id do item), então o estado inicial pode vir
  // direto de `editing` sem precisar de um efeito de sincronização.
  const [categoryLabel, setCategoryLabel] = useState<(typeof CATEGORIES)[number]>(
    () => (editing?.categoryLabel as (typeof CATEGORIES)[number]) ?? "Senhas",
  );
  const [name, setName] = useState(() => editing?.name ?? "");
  const [username, setUsername] = useState(() => editing?.username ?? "");
  const [urlLink, setUrlLink] = useState(() => editing?.urlLink ?? "");
  const [note, setNote] = useState(() => editing?.note ?? "");
  const [secret, setSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = { categoryLabel, name, username, urlLink, note, secret, masterPassword };
    const res = await fetch(editing ? `/api/vault/items/${editing.id}` : "/api/vault/items", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing && !secret ? { ...payload, secret: undefined } : payload),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Erro ao salvar");
      return;
    }
    onSaved();
    onClose();
  }

  return (
    <Modal open onClose={onClose} title={editing ? "Editar item" : "Novo item do Cofre"}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <Label>Categoria</Label>
          <Select value={categoryLabel} onChange={(e) => setCategoryLabel(e.target.value as (typeof CATEGORIES)[number])}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Nome</Label>
          <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Instagram" />
        </div>
        <div>
          <Label>Usuário / e-mail</Label>
          <Input value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div>
          <Label>URL</Label>
          <Input value={urlLink} onChange={(e) => setUrlLink(e.target.value)} />
        </div>
        <div>
          <Label>{editing ? "Nova senha/segredo (deixe em branco para manter)" : "Senha / segredo"}</Label>
          <div className="flex gap-2">
            <Input
              type={showSecret ? "text" : "password"}
              required={!editing}
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
            />
            <Button type="button" variant="secondary" onClick={() => setShowSecret((v) => !v)}>
              {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
            </Button>
          </div>
        </div>
        <div>
          <Label>Observação</Label>
          <Input value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function PasswordGeneratorModal({ onClose }: { onClose: () => void }) {
  const [length, setLength] = useState(20);
  const [upper, setUpper] = useState(true);
  const [lower, setLower] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [result, setResult] = useState(() => generatePassword({ length: 20, upper: true, lower: true, numbers: true, symbols: true }));

  function generate() {
    setResult(generatePassword({ length, upper, lower, numbers, symbols }));
  }

  return (
    <Modal open onClose={onClose} title="🔐 Gerador de senhas">
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-surface-muted px-3 py-3 text-center font-mono text-sm">{result}</div>
        <div>
          <Label>Tamanho: {length}</Label>
          <input
            type="range"
            min={8}
            max={64}
            value={length}
            onChange={(e) => setLength(parseInt(e.target.value, 10))}
            className="w-full"
          />
        </div>
        <div className="space-y-2 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={upper} onChange={(e) => setUpper(e.target.checked)} /> Letras maiúsculas
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={lower} onChange={(e) => setLower(e.target.checked)} /> Letras minúsculas
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={numbers} onChange={(e) => setNumbers(e.target.checked)} /> Números
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={symbols} onChange={(e) => setSymbols(e.target.checked)} /> Símbolos
          </label>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={generate}>
            Gerar nova
          </Button>
          <Button
            className="flex-1"
            onClick={() => {
              navigator.clipboard.writeText(result);
              clearClipboardLater(result);
            }}
          >
            <Copy size={16} /> Copiar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
