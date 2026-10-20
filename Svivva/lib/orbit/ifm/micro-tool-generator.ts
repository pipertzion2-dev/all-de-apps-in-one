import type { IfmPairing } from "./ifm-types";

export const IFM_MICRO_TOOL_MARKER = 'id="ifm-micro-tool"';

/** Interactive fusion block embedded on IFM bridge pages. */
export function buildIfmMicroToolHtml(pairing: IfmPairing): string {
  return `<section ${IFM_MICRO_TOOL_MARKER} data-pairing-id="${pairing.id}" class="ifm-fusion-widget">
  <h2>Try the fusion workflow</h2>
  <p>${pairing.microToolIdea}</p>
  <ol>
    <li>Open <a href="${pairing.toolA.url}" rel="noopener">${pairing.toolA.name}</a> and run your first check.</li>
    <li>Copy the output into the hand-off field below.</li>
    <li>Continue in <a href="${pairing.toolB.url}" rel="noopener">${pairing.toolB.name}</a> to complete the fused intent.</li>
  </ol>
  <label for="ifm-handoff-${pairing.id}">Hand-off buffer</label>
  <textarea id="ifm-handoff-${pairing.id}" rows="4" placeholder="Paste ${pairing.toolA.name} output here…" aria-label="Fusion hand-off buffer"></textarea>
  <p>
    <a class="ifm-cta-primary" href="${pairing.toolA.url}">${pairing.toolA.name} →</a>
    ·
    <a class="ifm-cta-secondary" href="${pairing.toolB.url}">${pairing.toolB.name} →</a>
    ·
    <a href="${pairing.ctaPrimary.href}">${pairing.ctaPrimary.label} →</a>
  </p>
</section>`;
}

export function bridgeContentHasMicroTool(content: string): boolean {
  return content.includes(IFM_MICRO_TOOL_MARKER);
}

export function injectMicroToolIntoBridgeContent(
  content: string,
  pairing: IfmPairing,
): string {
  if (bridgeContentHasMicroTool(content)) return content;
  const block = buildIfmMicroToolHtml(pairing);
  const anchor = "<h2>Micro-tool concept</h2>";
  if (content.includes(anchor)) {
    return content.replace(anchor, `${block}\n\n${anchor}`);
  }
  return `${content}\n\n${block}`;
}
