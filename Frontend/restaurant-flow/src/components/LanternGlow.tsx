import styles from "@/src/styles/lantern.module.css";

interface LanternGlowProps {
  x: string;
  y: string;
}

export default function LanternGlow({ x, y }: LanternGlowProps) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute z-10 ${styles.lanternGlow}`}
      style={{ top: y, left: x }}
    />
  );
}
