"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Measures a container element and returns the largest {width, height} box
 * with the given aspect ratio that fits entirely inside it — the same math
 * `object-fit: contain` uses, computed explicitly so a positioning wrapper
 * can be sized to exactly match the visible (letterboxed) image bounds.
 */
export function useContainSize(ratio: number) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width <= 0 || height <= 0) return;

      const widthFromHeight = height * ratio;
      const fitted =
        widthFromHeight <= width
          ? { width: widthFromHeight, height }
          : { width, height: width / ratio };
      setSize(fitted);
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [ratio]);

  return { containerRef, size };
}
