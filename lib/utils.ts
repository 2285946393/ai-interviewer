import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function scoreTone(score: number) {
  if (score >= 80) return "text-emerald-300";
  if (score >= 60) return "text-amber-300";
  return "text-rose-300";
}

export function scoreBar(score: number) {
  if (score >= 80) return "from-emerald-400 to-emerald-200";
  if (score >= 60) return "from-amber-400 to-amber-200";
  return "from-rose-400 to-rose-200";
}

export function truncate(text: string, length = 120) {
  if (text.length <= length) return text;
  return `${text.slice(0, length)}…`;
}
