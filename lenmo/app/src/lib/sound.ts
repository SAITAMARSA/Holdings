// Ambient sounds generated on-device. Zero bytes downloaded.
export type SoundKind = "silence" | "rain" | "white" | "forest";

export function startSound(kind: SoundKind): () => void {
  if (kind === "silence" || typeof AudioContext === "undefined") return () => {};
  const ctx = new AudioContext();
  const size = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, size, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < size; i++) {
    const white = Math.random() * 2 - 1;
    if (kind === "white") data[i] = white * 0.3;
    else { last = 0.98 * last + 0.02 * white; data[i] = (kind === "rain" ? last * 3 + white * 0.15 : last * 5) * 0.5; } // brown-ish noise
  }
  const src = ctx.createBufferSource(); src.buffer = buffer; src.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass"; filter.frequency.value = kind === "rain" ? 4000 : kind === "forest" ? 900 : 12000;
  const gain = ctx.createGain(); gain.gain.value = 0; gain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 2);
  src.connect(filter).connect(gain).connect(ctx.destination); src.start();
  return () => { gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5); setTimeout(() => { src.stop(); void ctx.close(); }, 600); };
}
