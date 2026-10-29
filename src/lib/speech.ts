/** Reads a short cue aloud, cancelling anything still being spoken. No-op where unsupported. */
export function speak(text: string): void {
  try {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.05;
    window.speechSynthesis.speak(u);
  } catch {
    // Speech is a nice-to-have; never let it break playback.
  }
}

export function stopSpeaking(): void {
  try {
    window.speechSynthesis.cancel();
  } catch {
    // ignore
  }
}
