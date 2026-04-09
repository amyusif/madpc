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

const SN_RANKS = ["constable", "lance_corporal", "corporal", "sergeant"];
const PN_RANKS = ["inspector", "chief_inspector"];
const PO_RANKS = ["assistant_superintendent", "deputy_superintendent", "superintendent", "chief_superintendent", "assistant_commissioner", "deputy_commissioner", "commissioner"];

export function getRankIdType(rank: string): "sn" | "pn" | "po" | null {
  if (SN_RANKS.includes(rank)) return "sn";
  if (PN_RANKS.includes(rank)) return "pn";
  if (PO_RANKS.includes(rank)) return "po";
  return null;
}
