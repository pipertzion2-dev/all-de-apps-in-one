/** Normalized scroll progress for a scrollable region (0 = top, 1 = bottom). */
export function pageScrollProgress(): number {
  const main = document.querySelector<HTMLElement>("main[data-feature-scroll]");
  if (main && main.scrollHeight > main.clientHeight + 24) {
    const max = main.scrollHeight - main.clientHeight;
    return max > 0 ? Math.min(1, main.scrollTop / max) : 0;
  }
  const max =
    Math.max(document.documentElement.scrollHeight, document.body.scrollHeight) -
    window.innerHeight;
  return max > 0 ? Math.min(1, window.scrollY / max) : 0;
}

/** Progress while an element travels through the viewport (0 = entering, 1 = leaving). */
export function elementScrollProgress(el: HTMLElement): number {
  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight;
  const travel = rect.height + vh * 0.85;
  return Math.max(0, Math.min(1, (vh * 0.72 - rect.top) / travel));
}
