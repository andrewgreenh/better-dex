import { useEffect, useRef, useState } from "react";

const HOLD_MS = 2000;

/**
 * Confirm-by-holding button. Two seconds of contact are hard to trigger by
 * accident, which is the whole point: the device changes hands here, and a
 * stray tap would show the wrong player someone else's team.
 */
export function HoldButton({
  label,
  hint = "2 Sekunden gedrückt halten",
  onConfirm,
}: {
  label: string;
  hint?: string;
  onConfirm: () => void;
}) {
  const [progress, setProgress] = useState(0);
  const frame = useRef(0);
  const timer = useRef(0);
  const done = useRef(false);

  // The callback is read through a ref so restarting the hold never depends
  // on the parent handing down a stable function.
  const confirm = useRef(onConfirm);
  confirm.current = onConfirm;

  useEffect(
    () => () => {
      cancelAnimationFrame(frame.current);
      clearTimeout(timer.current);
    },
    [],
  );

  const start = () => {
    if (done.current) return;
    // The timer decides, the animation only draws: requestAnimationFrame is
    // paused while the tab is in the background or the device is saving
    // power, and the hold must not stall along with it.
    timer.current = window.setTimeout(() => {
      done.current = true;
      cancelAnimationFrame(frame.current);
      setProgress(1);
      navigator.vibrate?.(40);
      confirm.current();
    }, HOLD_MS);

    const began = performance.now();
    const step = (now: number) => {
      setProgress(Math.min(1, (now - began) / HOLD_MS));
      frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
  };

  const stop = () => {
    if (done.current) return;
    cancelAnimationFrame(frame.current);
    clearTimeout(timer.current);
    setProgress(0);
  };

  return (
    <button
      type="button"
      className={`hold-btn${progress > 0 ? " holding" : ""}`}
      onPointerDown={(event) => {
        // Keeps the press alive when the finger drifts off the button. Not
        // every pointer id can be captured, and a throw here would swallow
        // the press entirely — the hold works fine without the capture.
        try {
          event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
          /* ignore */
        }
        start();
      }}
      onPointerUp={stop}
      onPointerCancel={stop}
      onContextMenu={(event) => event.preventDefault()}
    >
      <i className="hold-fill" style={{ transform: `scaleX(${progress})` }} />
      <span className="hold-label">{label}</span>
      <span className="hold-hint">{hint}</span>
    </button>
  );
}
