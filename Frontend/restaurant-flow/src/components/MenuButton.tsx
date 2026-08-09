"use client";

import Image from "next/image";
import menuIcon from "@/assets/menu.png";

interface MenuButtonProps {
  onClick: () => void;
}

export default function MenuButton({ onClick }: MenuButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Ver menú"
      className="absolute right-5 top-5 z-30 flex h-20 w-20 items-center justify-center rounded-full shadow-xl transition-transform hover:scale-105 active:scale-95"
    >
      <Image
        src={menuIcon}
        alt=""
        priority
        className="h-full w-full select-none object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]"
      />
    </button>
  );
}
