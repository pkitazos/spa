import { type ClassValue } from "clsx";

import { cn } from "@/lib/utils";

export function CircleXIcon({ className }: { className?: ClassValue }) {
  return (
    <svg
      className={cn(className)}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      fill="none"
      stroke="currentColor"
    >
      <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM175 175c9.4-9.4 24.6-9.4 33.9 0l47 47 47-47c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-47 47 47 47c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-47-47-47 47c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l47-47-47-47c-9.4-9.4-9.4-24.6 0-33.9z" />
    </svg>
  );
}
