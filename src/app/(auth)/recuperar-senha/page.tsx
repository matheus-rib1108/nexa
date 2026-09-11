"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [devUrl, setDevUrl] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setDevUrl(null);

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setLoading(false);
    setMessage(data.message);
    if (data.devResetUrl) setDevUrl(data.devResetUrl);
  }

  return (
    <Card>
      <h2 className="mb-2 text-lg font-semibold">Recuperar senha</h2>
      <p className="mb-5 text-sm text-muted">
        Informe seu e-mail. Se houver uma conta cadastrada, geraremos um link de redefinição.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Enviando..." : "Enviar link de redefinição"}
        </Button>
      </form>
      {message && (
        <div className="mt-4 rounded-lg bg-surface-muted px-3 py-3 text-sm">
          <p>{message}</p>
          {devUrl && (
            <p className="mt-2">
              Ambiente sem envio de e-mail configurado —{" "}
              <Link href={devUrl} className="font-medium text-primary hover:underline">
                clique aqui para redefinir
              </Link>
              .
            </p>
          )}
        </div>
      )}
      <p className="mt-6 text-center text-sm text-muted">
        <Link href="/login" className="font-medium text-primary hover:underline">
          Voltar para o login
        </Link>
      </p>
    </Card>
  );
}
