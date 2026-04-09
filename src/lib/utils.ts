import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const RANK_LABELS: Record<string, string> = {
  constable: "Constable",
  lance_corporal: "Lance Corporal",
  corporal: "Corporal",
  sergeant: "Sergeant",
  inspector: "Inspector",
  chief_inspector: "Chief Inspector",
  assistant_superintendent: "Assistant Superintendent",
  deputy_superintendent: "Deputy Superintendent",
  superintendent: "Superintendent",
  chief_superintendent: "Chief Superintendent",
  assistant_commissioner: "Assistant Commissioner",
  deputy_commissioner: "Deputy Commissioner",
  commissioner: "Commissioner",
};

export function formatRank(rank: string): string {
  return RANK_LABELS[rank] ?? rank.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
