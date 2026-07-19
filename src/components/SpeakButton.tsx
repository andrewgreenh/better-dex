import { useEffect, useState } from "react";
import { speakGerman, speechSupported } from "@/lib/speech";
import { SpeakerIcon } from "./icons";

/** Reads the given text out loud in German via the Web Speech API. */
export function SpeakButton({ text }: { text: string }) {
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    setSupported(speechSupported());
    return () => window.speechSynthesis?.cancel();
  }, []);

  if (!supported) return null;

  return (
    <button
      type="button"
      className={`speak-btn${speaking ? " speaking" : ""}`}
      onClick={() => speakGerman(text, setSpeaking)}
      aria-label={`${text} vorlesen`}
      title="Vorlesen"
    >
      <SpeakerIcon />
    </button>
  );
}
