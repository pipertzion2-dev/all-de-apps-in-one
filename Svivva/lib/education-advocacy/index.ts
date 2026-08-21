export * from "./types";
export * from "./disclaimers";
export * from "./channels";
export * from "./presets";
export * from "./privacy";
export * from "./buses/schemas";
export * from "./buses/event-bus";
export * from "./orchestration/engine";
export * from "./adapters/interfaces";
export * from "./adapters/defaults";
export * from "./legal/catalog";
export * from "./legal/engine";
export * from "./resources/registry";
export * from "./crisis/router";
export * from "./advocacy/case-file";
export * from "./advocacy/chat";
export * from "./vault/crypto";
export * from "./vault/custody";
export * from "./vault/epv";
export * from "./vault/seal";
export * from "./ledger/adapter";
export * from "./cybersecurity/bridge";

import { CHANNEL_CAPABILITIES } from "./channels";
import { createDefaultAdapters } from "./adapters/defaults";
import type { DefaultAdapterBundle } from "./adapters/defaults";

/** Wire channel capabilities into the module registry for future plugins. */
export function bootstrapEducationAdvocacyPlatform(
  adapters: DefaultAdapterBundle = createDefaultAdapters(),
): DefaultAdapterBundle {
  for (const ch of CHANNEL_CAPABILITIES) {
    adapters.modules.register({
      id: ch.platformFeatureId,
      capabilities: [ch.id],
      inputs: ch.inputs,
      outputs: ch.outputs,
      permissions: ch.permissions,
      eventSubscriptions: ch.eventSubscriptions,
      uiComponents: [`education-advocacy:${ch.id}`],
      safetyRequirements: ch.safetyCritical ? ["safety_override", "verified_directory_only"] : [],
    });
  }
  return adapters;
}
