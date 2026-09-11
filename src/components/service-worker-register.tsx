"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Registro pode falhar em navegadores sem suporte ou em modo privado; não é crítico.
      });
    }
  }, []);

  return null;
}
