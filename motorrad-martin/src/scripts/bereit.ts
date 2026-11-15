/** Führt fn aus, sobald Schriften geladen und die Schlagzeilen gesetzt sind (Signal aus app.ts). */
export function bereit(fn: () => void) {
  if ((window as unknown as { __mmBereit?: boolean }).__mmBereit) fn();
  else document.addEventListener('mm:bereit', fn, { once: true });
}
