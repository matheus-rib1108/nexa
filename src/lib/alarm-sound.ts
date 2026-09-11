// Toca um bipe curto gerado via Web Audio API quando um alarme dispara.
export function playAlarmBeep() {
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.15, now + i * 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.4 + 0.3);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.4);
      osc.stop(now + i * 0.4 + 0.3);
    }
  } catch {
    // Web Audio pode estar indisponível/bloqueado; falha silenciosamente.
  }
}
