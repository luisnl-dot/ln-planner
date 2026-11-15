import type { ImageMetadata } from 'astro';

const alle = import.meta.glob<{ default: ImageMetadata }>('../assets/**/*.{jpg,jpeg,png}', { eager: true });

const index = new Map<string, ImageMetadata>();
for (const [pfad, mod] of Object.entries(alle)) {
  index.set(pfad.replace('../assets/', '').replace(/\.(jpg|jpeg|png)$/, ''), mod.default);
}

/** Bild aus src/assets per Kurzname, z. B. bild('editionen/r-18-bobber-1'). */
export function bild(name: string): ImageMetadata {
  const b = index.get(name);
  if (!b) throw new Error(`Bild nicht gefunden: ${name}`);
  return b;
}

export const hatBild = (name: string) => index.has(name);
