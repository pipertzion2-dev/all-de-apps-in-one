/**
 * Bridge Education Proof Vault into the existing cybersecurity / Protect bus module.
 * Responsibilities are declared here; enforcement hooks call into zzai-security + poor-man-protection patterns.
 */

export type CybersecurityControls = {
  encryptionAtRest: boolean;
  encryptionInTransit: boolean;
  secureKeyManagement: boolean;
  deviceAuthentication: boolean;
  optionalPasskeys: boolean;
  recoveryMechanisms: boolean;
  sessionSecurity: boolean;
  malwareFileScanning: boolean;
  uploadValidation: boolean;
  rateLimiting: boolean;
  auditLogs: boolean;
  tamperDetection: boolean;
  signedEvents: boolean;
  permissionManagement: boolean;
  dataExportControls: boolean;
  deletionControls: boolean;
  securityAlerts: boolean;
  privacyPreservingAnalytics: boolean;
  highRiskPrivacyPopulation: true;
  dataMinimization: true;
};

export const DEFAULT_CYBER_CONTROLS: CybersecurityControls = {
  encryptionAtRest: true,
  encryptionInTransit: true,
  secureKeyManagement: true,
  deviceAuthentication: true,
  optionalPasskeys: true,
  recoveryMechanisms: true,
  sessionSecurity: true,
  malwareFileScanning: true,
  uploadValidation: true,
  rateLimiting: true,
  auditLogs: true,
  tamperDetection: true,
  signedEvents: true,
  permissionManagement: true,
  dataExportControls: true,
  deletionControls: true,
  securityAlerts: true,
  privacyPreservingAnalytics: true,
  highRiskPrivacyPopulation: true,
  dataMinimization: true,
};

export type UploadValidationResult = {
  ok: boolean;
  errors: string[];
};

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "text/plain",
  "application/json",
]);

export function validateVaultUpload(input: {
  mimeType?: string;
  byteLength?: number;
  fileName?: string;
}): UploadValidationResult {
  const errors: string[] = [];
  if (input.mimeType && !ALLOWED_MIME.has(input.mimeType)) {
    errors.push(`MIME type not allowed: ${input.mimeType}`);
  }
  if (input.byteLength != null && input.byteLength > 15_000_000) {
    errors.push("File exceeds 15MB upload limit");
  }
  if (input.fileName && /[\\/]|\.\./.test(input.fileName)) {
    errors.push("Unsafe file name");
  }
  return { ok: errors.length === 0, errors };
}

/** Link targets into existing Security Center surfaces without coupling modules. */
export const CYBER_SURFACE_LINKS = {
  securityCenter: "/dashboard/security",
  poorManProtection: "/dashboard/poor-man-protection",
  educationVault: "/dashboard/education-advocacy/vault",
} as const;
