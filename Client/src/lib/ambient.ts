let audio: AudioContext | null = null;
let cleanup: (() => void) | null = null;
export async function startAmbient() {
  if (audio) { await audio.resume(); return; }
  const context = new AudioContext(); audio = context;
  try {
    const buffer = context.createBuffer(1, context.sampleRate * 8, context.sampleRate);
    const data = buffer.getChannelData(0); let last = 0;
    for (let i = 0; i < data.length; i++) { last = (last + Math.random() * 0.04 - 0.02) / 1.02; data[i] = last * 3; }
    const source = context.createBufferSource(); source.buffer = buffer; source.loop = true;
    const filter = context.createBiquadFilter(); filter.type = "lowpass"; filter.frequency.value = 600;
    const gain = context.createGain(); gain.gain.value = 0.4;
    source.connect(filter).connect(gain).connect(context.destination); source.start();
    const tide = context.createOscillator(); tide.frequency.value = 0.12;
    const swell = context.createGain(); swell.gain.value = 0.18;
    tide.connect(swell).connect(gain.gain); tide.start();
    const onVisibility = () => { if (document.hidden) void context.suspend(); else void context.resume(); };
    document.addEventListener("visibilitychange", onVisibility);
    cleanup = () => { source.stop(); tide.stop(); document.removeEventListener("visibilitychange", onVisibility); };
    await context.resume();
  } catch (error) { stopAmbient(); throw error; }
}
export function stopAmbient() { cleanup?.(); cleanup = null; if (audio) void audio.close(); audio = null; }
