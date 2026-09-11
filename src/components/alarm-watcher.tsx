"use client";

import { useEffect, useRef } from "react";
import { playAlarmBeep } from "@/lib/alarm-sound";

type Alarm = { id: string; label: string; time: string; daysOfWeek: string; enabled: boolean };

// Verifica alarmes a cada 20s enquanto o NEXA está aberto no navegador e
// dispara uma notificação + som + vibração quando um horário bate.
//
// Limitação importante (item 54 da especificação): navegadores não permitem
// que uma página web dispare alarmes de forma confiável com a aba/app
// totalmente fechado. Enquanto não existir uma versão nativa (iOS/Android),
// os alarmes só funcionam com o NEXA aberto (pode ficar em segundo plano).
export function AlarmWatcher() {
  const firedThisMinute = useRef<Set<string>>(new Set());

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const interval = setInterval(async () => {
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const minuteKey = `${now.toDateString()}-${hhmm}`;

      const res = await fetch("/api/alarms");
      if (!res.ok) return;
      const data = await res.json();
      const alarms: Alarm[] = data.alarms ?? [];

      for (const alarm of alarms) {
        if (!alarm.enabled || alarm.time !== hhmm) continue;
        const days: number[] = JSON.parse(alarm.daysOfWeek || "[]");
        if (days.length > 0 && !days.includes(now.getDay())) continue;

        const fireKey = `${alarm.id}-${minuteKey}`;
        if (firedThisMinute.current.has(fireKey)) continue;
        firedThisMinute.current.add(fireKey);

        playAlarmBeep();
        if (navigator.vibrate) navigator.vibrate([300, 100, 300]);
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(`⏰ ${alarm.label}`, { body: "Toque para voltar ao NEXA" });
        }
      }
    }, 20000);

    return () => clearInterval(interval);
  }, []);

  return null;
}
