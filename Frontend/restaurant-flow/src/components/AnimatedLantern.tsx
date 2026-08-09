"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import frame85 from "@/assets/place/framesfarola/85.png";
import frame86 from "@/assets/place/framesfarola/86.png";
import frame87 from "@/assets/place/framesfarola/87.png";
import frame88 from "@/assets/place/framesfarola/88.png";
import frame89 from "@/assets/place/framesfarola/89.png";
import frame90 from "@/assets/place/framesfarola/90.png";
import frame91 from "@/assets/place/framesfarola/91.png";
import frame92 from "@/assets/place/framesfarola/92.png";
import frame93 from "@/assets/place/framesfarola/93.png";
import frame94 from "@/assets/place/framesfarola/94.png";
import frame95 from "@/assets/place/framesfarola/95.png";
import frame96 from "@/assets/place/framesfarola/96.png";

const FRAMES = [
  frame85,
  frame86,
  frame87,
  frame88,
  frame89,
  frame90,
  frame91,
  frame92,
  frame93,
  frame94,
  frame95,
  frame96,
];
const REST_INDEX = FRAMES.indexOf(frame91);
const FLICKER_FRAME_DURATION_MS = 100;
const REST_DURATION_MS = 10000;

interface AnimatedLanternProps {
  x: string;
  y: string;
}

export default function AnimatedLantern({ x, y }: AnimatedLanternProps) {
  const [frameIndex, setFrameIndex] = useState(REST_INDEX);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    let cancelled = false;

    function playFlicker(step: number) {
      if (cancelled) return;
      if (step >= FRAMES.length) {
        setFrameIndex(REST_INDEX);
        timeoutId = setTimeout(() => playFlicker(0), REST_DURATION_MS);
        return;
      }
      setFrameIndex(step);
      timeoutId = setTimeout(() => playFlicker(step + 1), FLICKER_FRAME_DURATION_MS);
    }

    timeoutId = setTimeout(() => playFlicker(0), REST_DURATION_MS);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div
      className="pointer-events-none absolute z-10 aspect-square w-[13%] -translate-x-1/2 -translate-y-full select-none"
      style={{ top: y, left: x }}
    >
      {FRAMES.map((frame, index) => (
        <Image
          key={index}
          src={frame}
          alt="Farola"
          fill
          priority
          className="select-none object-contain transition-opacity duration-75 ease-in-out"
          style={{ opacity: index === frameIndex ? 1 : 0 }}
        />
      ))}
    </div>
  );
}
