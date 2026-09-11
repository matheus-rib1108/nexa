// Sons ambiente gerados localmente via Web Audio API (ruído sintetizado, sem
// dependência de arquivos de áudio externos). Não são gravações reais de
// chuva/cafeteria/floresta — são aproximações de ruído filtrado que criam uma
// textura sonora semelhante, geradas inteiramente no navegador do usuário.

export type AmbientSoundKey = "chuva" | "cafeteria" | "floresta" | "ruido_branco" | "silencio";

export const AMBIENT_SOUND_LABELS: Record<AmbientSoundKey, string> = {
  chuva: "Chuva",
  cafeteria: "Cafeteria",
  floresta: "Floresta",
  ruido_branco: "Ruído branco",
  silencio: "Silêncio",
};

let ctx: AudioContext | null = null;
let source: AudioBufferSourceNode | null = null;
let filterNode: BiquadFilterNode | null = null;
let gainNode: GainNode | null = null;

function getContext(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function createNoiseBuffer(context: AudioContext, colorize: (white: number, prev: number) => number): AudioBuffer {
  const bufferSize = context.sampleRate * 4;
  const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
  const data = buffer.getChannelData(0);
  let prev = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    prev = colorize(white, prev);
    data[i] = prev;
  }
  return buffer;
}

const PROFILES: Record<Exclude<AmbientSoundKey, "silencio">, { colorize: (w: number, p: number) => number; filterFreq: number; filterType: BiquadFilterType; gain: number }> = {
  ruido_branco: { colorize: (w) => w, filterFreq: 8000, filterType: "lowpass", gain: 0.06 },
  chuva: { colorize: (w, p) => (p + 0.04 * w) / 1.04, filterFreq: 3500, filterType: "lowpass", gain: 0.09 },
  cafeteria: { colorize: (w, p) => (p + 0.15 * w) / 1.15, filterFreq: 1200, filterType: "bandpass", gain: 0.05 },
  floresta: { colorize: (w, p) => (p + 0.25 * w) / 1.25, filterFreq: 600, filterType: "lowpass", gain: 0.07 },
};

export function playAmbientSound(key: AmbientSoundKey) {
  stopAmbientSound();
  if (key === "silencio") return;

  const context = getContext();
  if (context.state === "suspended") context.resume();

  const profile = PROFILES[key];
  const buffer = createNoiseBuffer(context, profile.colorize);

  source = context.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  filterNode = context.createBiquadFilter();
  filterNode.type = profile.filterType;
  filterNode.frequency.value = profile.filterFreq;

  gainNode = context.createGain();
  gainNode.gain.value = profile.gain;

  source.connect(filterNode).connect(gainNode).connect(context.destination);
  source.start();
}

export function stopAmbientSound() {
  source?.stop();
  source?.disconnect();
  filterNode?.disconnect();
  gainNode?.disconnect();
  source = null;
}
