/** Zero-API-key Orbit content — built-in templates, no external AI required. */

export const ORBIT_TEMPLATE_PROVIDER_LABEL = "Built-in templates (no API key)";
export const ORBIT_TEMPLATE_MODEL = "template-v1";

export function enableOrbitTemplateMode(): void {
  process.env.ORBIT_TEMPLATE_MODE = "1";
  delete process.env.ORBIT_AI_PROVIDER;
}

export function disableOrbitTemplateMode(): void {
  delete process.env.ORBIT_TEMPLATE_MODE;
}

export function isOrbitTemplateMode(): boolean {
  return process.env.ORBIT_TEMPLATE_MODE === "1";
}
