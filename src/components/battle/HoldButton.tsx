import { useEffect, useRef, useState } from "react";

const HOLD_MS = 2000;

/**
 * Confirm-by-holding button. Two seconds of contact are hard to trigger by
 * accident, which is the whole point: the device changes hands here, and a
 * stray tap would show the wrong player someone else's team.
 *
 * Everything is wired up by hand rather than through React's props, because
 * a long press is exactly the gesture mobile browsers like to take away:
 *
 * - React registers its own `touchstart` listener as passive, so calling
 *   preventDefault from an `onTouchStart` prop silently does nothing. WebKit
 *   then stays free to reinterpret the press as a scroll, a text selection
 *   or a callout part-way through, which aborts the hold.
 * - The press ends on window, not on the button, so a finger that drifts a
 *   few pixels off the edge doesn't lose the release.
 * - Touch and pointer are two views of the same press: whichever fires first
 *   wins, and only the matching end events count. Mixing them would let
 *   WebKit's eager `pointercancel` kill a hold that touch is still tracking.
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
  const button = useRef<HTMLButtonElement>(null);

  // Read through a ref so the listeners below can be attached exactly once.
  const confirm = useRef(onConfirm);
  confirm.current = onConfirm;

  useEffect(() => {
    const node = button.current;
    if (!node) return;

    let frame = 0;
    let timer = 0;
    let via: "touch" | "pointer" | null = null;
    let done = false;

    const stop = () => {
      if (!via) return;
      via = null;
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      setProgress(0);
    };

    const start = (source: "touch" | "pointer") => (event: Event) => {
      event.preventDefault();
      if (done || via) return;
      via = source;

      // The timer decides, the animation only draws: requestAnimationFrame
      // is paused while the tab is in the background or the device is saving
      // power, and the hold must not stall along with it.
      timer = window.setTimeout(() => {
        done = true;
        via = null;
        cancelAnimationFrame(frame);
        setProgress(1);
        navigator.vibrate?.(40);
        confirm.current();
      }, HOLD_MS);

      const began = performance.now();
      const draw = (now: number) => {
        setProgress(Math.min(1, (now - began) / HOLD_MS));
        frame = requestAnimationFrame(draw);
      };
      frame = requestAnimationFrame(draw);
    };

    const onTouch = start("touch");
    const onPointer = start("pointer");
    const endTouch = () => via === "touch" && stop();
    const endPointer = () => via === "pointer" && stop();

    node.addEventListener("touchstart", onTouch, { passive: false });
    node.addEventListener("pointerdown", onPointer);
    window.addEventListener("touchend", endTouch);
    window.addEventListener("touchcancel", endTouch);
    window.addEventListener("pointerup", endPointer);
    window.addEventListener("pointercancel", endPointer);
    // Switching apps mid-hold shouldn't finish it behind the user's back.
    window.addEventListener("blur", stop);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      node.removeEventListener("touchstart", onTouch);
      node.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("touchend", endTouch);
      window.removeEventListener("touchcancel", endTouch);
      window.removeEventListener("pointerup", endPointer);
      window.removeEventListener("pointercancel", endPointer);
      window.removeEventListener("blur", stop);
    };
  }, []);

  return (
    <button
      ref={button}
      type="button"
      className={`hold-btn${progress > 0 ? " holding" : ""}`}
      onContextMenu={(event) => event.preventDefault()}
    >
      <i className="hold-fill" style={{ transform: `scaleX(${progress})` }} />
      <span className="hold-label">{label}</span>
      <span className="hold-hint">{hint}</span>
    </button>
  );
}
