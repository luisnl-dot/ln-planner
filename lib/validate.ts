import type { Client } from "./types";

export type Violation = { rule: string; detail: string };

// Mechanical rule checks that catch what the model most reliably gets wrong.
// The model is also given every hard_rule in the prompt; this is the safety net.
export function validateCaption(caption: string, client: Pick<Client, "hashtags_fix">): Violation[] {
  const v: Violation[] = [];

  if (caption.includes("—") || caption.includes("–")) {
    v.push({ rule: "Kein Gedankenstrich", detail: "Enthält – oder — (nur normalen Bindestrich verwenden)." });
  }

  const fixed = (client.hashtags_fix ?? []).filter(Boolean);
  const missing = fixed.filter((h) => !caption.toLowerCase().includes(h.toLowerCase()));
  if (fixed.length && missing.length) {
    v.push({ rule: "Feste Hashtags fehlen", detail: missing.join(" ") });
  }

  return v;
}
