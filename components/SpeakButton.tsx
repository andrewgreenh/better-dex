"use client";

import { useEffect, useState } from "react";
import { SpeakerIcon } from "./icons";

/** Reads the given text out loud in German via the Web Speech API. */
export function SpeakButton({ text }: { text: string }) {
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => window.speechSynthesis?.cancel();
  }, []);

  if (!supported) return null;

  const speak = () => {
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "de-DE";
    utterance.rate = 0.85;
    const germanVoice = synth.getVoices().find((voice) => voice.lang.startsWith("de"));
    if (germanVoice) utterance.voice = germanVoice;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    synth.speak(utterance);
  };

  return (
    <button
      type="button"
      className={`speak-btn${speaking ? " speaking" : ""}`}
      onClick={speak}
      aria-label={`${text} vorlesen`}
      title="Vorlesen"
    >
      <SpeakerIcon />
    </button>
  );
}
