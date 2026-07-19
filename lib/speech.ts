/** Client-side German text-to-speech via the Web Speech API. */
export function speechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function speakGerman(text: string, onSpeakingChange?: (speaking: boolean) => void): void {
  if (!speechSupported()) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "de-DE";
  utterance.rate = 0.85;
  const germanVoice = synth.getVoices().find((voice) => voice.lang.startsWith("de"));
  if (germanVoice) utterance.voice = germanVoice;
  if (onSpeakingChange) {
    utterance.onstart = () => onSpeakingChange(true);
    utterance.onend = () => onSpeakingChange(false);
    utterance.onerror = () => onSpeakingChange(false);
  }
  synth.speak(utterance);
}
