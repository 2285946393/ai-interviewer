let cachedVoices: SpeechSynthesisVoice[] = [];

function loadVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !window.speechSynthesis) return [];
  const voices = window.speechSynthesis.getVoices();
  if (voices.length) cachedVoices = voices;
  return cachedVoices;
}

if (typeof window !== "undefined" && window.speechSynthesis) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = () => loadVoices();
}

export function isSpeechSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function pickChineseVoice() {
  const voices = loadVoices();
  return (
    voices.find((v) => v.lang === "zh-CN" && /Xiaoxiao|Yunxi|Huihui|Kangkang/i.test(v.name)) ||
    voices.find((v) => v.lang === "zh-CN") ||
    voices.find((v) => v.lang?.toLowerCase().startsWith("zh")) ||
    null
  );
}

export function speak(text: string, opts: { rate?: number; pitch?: number } = {}) {
  if (!isSpeechSupported()) return;
  window.speechSynthesis.cancel();

  const clean = text.replace(/[*#`>_]/g, "").trim();
  if (!clean) return;

  const utter = new SpeechSynthesisUtterance(clean);
  utter.lang = "zh-CN";
  utter.rate = opts.rate ?? 1.02;
  utter.pitch = opts.pitch ?? 1.05;

  const voice = pickChineseVoice();
  if (voice) utter.voice = voice;

  window.speechSynthesis.speak(utter);
}

export function stopSpeaking() {
  if (!isSpeechSupported()) return;
  window.speechSynthesis.cancel();
}
