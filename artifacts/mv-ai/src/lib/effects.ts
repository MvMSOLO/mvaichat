// MV AI — premium UX utilities

const SOUNDS_ENABLED_KEY = "mv-ai-sound";

export function isSoundEnabled() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SOUNDS_ENABLED_KEY) !== "0";
}

export function setSoundEnabled(v: boolean) {
  localStorage.setItem(SOUNDS_ENABLED_KEY, v ? "1" : "0");
}

let audioCtx: AudioContext | null = null;
function ctx() {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)(); } catch { return null; }
  }
  return audioCtx;
}

export function playPop(freq = 880, dur = 0.06, vol = 0.05) {
  if (!isSoundEnabled()) return;
  const c = ctx(); if (!c) return;
  const o = c.createOscillator(); const g = c.createGain();
  o.type = "sine"; o.frequency.value = freq;
  g.gain.value = vol;
  o.connect(g); g.connect(c.destination);
  o.start();
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
  o.stop(c.currentTime + dur + 0.02);
}

export function playSend() { playPop(720, 0.08, 0.04); setTimeout(() => playPop(960, 0.07, 0.04), 60); }
export function playReceive() { playPop(540, 0.06, 0.035); }
export function playSuccess() { playPop(660, 0.08, 0.05); setTimeout(() => playPop(880, 0.08, 0.05), 90); setTimeout(() => playPop(1100, 0.1, 0.05), 180); }

// Haptic
export function haptic(ms = 10) {
  if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(ms);
}

// Confetti — lightweight DOM particles
export function confetti(opts: { x?: number; y?: number; count?: number } = {}) {
  if (typeof window === "undefined") return;
  const x = opts.x ?? window.innerWidth / 2;
  const y = opts.y ?? window.innerHeight / 2;
  const count = opts.count ?? 28;
  const colors = ["#FF4D2E", "#FFD23F", "#22D3EE", "#A855F7", "#10B981", "#F472B6"];
  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    const size = 6 + Math.random() * 6;
    el.style.cssText = `position:fixed;left:${x}px;top:${y}px;width:${size}px;height:${size}px;background:${colors[i % colors.length]};border-radius:${Math.random() > 0.5 ? "50%" : "2px"};pointer-events:none;z-index:9999;will-change:transform,opacity;`;
    document.body.appendChild(el);
    const angle = Math.random() * Math.PI * 2;
    const velocity = 6 + Math.random() * 8;
    const dx = Math.cos(angle) * velocity * 30;
    const dy = Math.sin(angle) * velocity * 30 - 80;
    const rot = (Math.random() - 0.5) * 720;
    el.animate(
      [
        { transform: "translate(0,0) rotate(0)", opacity: 1 },
        { transform: `translate(${dx}px, ${dy + 220}px) rotate(${rot}deg)`, opacity: 0 },
      ],
      { duration: 1100 + Math.random() * 400, easing: "cubic-bezier(0.16,1,0.3,1)" },
    ).onfinish = () => el.remove();
  }
}
