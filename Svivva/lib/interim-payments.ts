/** Direct peer-to-peer payment links — no Stripe, PayPal, or card processors. */

export type InterimPaymentConfig = {
  /** @deprecated Legacy Stripe links — not used for customer checkout */
  stripePaymentLinkStarter: string | null;
  stripePaymentLinkPro: string | null;
  stripePaymentLinkEnterprise: string | null;
  /** @deprecated Legacy PayPal — ignored for checkout */
  paypalUrlStarter: string | null;
  paypalUrlPro: string | null;
  paypalUrl: string | null;
  /** Venmo link for Starter ($20/mo). Legacy `venmoUrl` is a fallback. */
  venmoUrlStarter: string | null;
  /** Venmo link for Pro ($50/mo) */
  venmoUrlPro: string | null;
  /** @deprecated Legacy single Venmo URL — treated as Starter when starter URL unset */
  venmoUrl: string | null;
  /** Cash App link for Starter ($20/mo) */
  cashAppUrlStarter: string | null;
  /** Cash App link for Pro ($50/mo) */
  cashAppUrlPro: string | null;
  /** Zelle email or phone shown on billing (no URL) */
  zelleContact: string | null;
  note: string | null;
};

export type DirectPayMethod = "venmo" | "cashapp";

export type InterimPaymentPublic = InterimPaymentConfig & {
  active: boolean;
  directPayActive: boolean;
  checkoutUnavailable: boolean;
};

const DEFAULT_NOTE =
  "After you pay, enter your access code above — or email your receipt to hello@zzaizzai.com and we'll activate your plan within a few hours.";

function trimUrl(v: string | null | undefined): string | null {
  const t = v?.trim();
  if (!t) return null;
  if (!/^https?:\/\//i.test(t)) return null;
  return t;
}

function trimText(v: string | null | undefined): string | null {
  const t = v?.trim();
  return t || null;
}

function fromEnv(): InterimPaymentConfig {
  const legacyVenmo = trimUrl(process.env.INTERIM_VENMO_URL);
  return {
    stripePaymentLinkStarter:
      trimUrl(process.env.INTERIM_STRIPE_PAYMENT_LINK_STARTER) ??
      trimUrl(process.env.INTERIM_STRIPE_PAYMENT_LINK_ENTERPRISE),
    stripePaymentLinkPro: trimUrl(process.env.INTERIM_STRIPE_PAYMENT_LINK_PRO),
    stripePaymentLinkEnterprise: trimUrl(process.env.INTERIM_STRIPE_PAYMENT_LINK_ENTERPRISE),
    paypalUrlStarter: trimUrl(process.env.INTERIM_PAYPAL_URL_STARTER),
    paypalUrlPro: trimUrl(process.env.INTERIM_PAYPAL_URL_PRO),
    paypalUrl: trimUrl(process.env.INTERIM_PAYPAL_URL),
    venmoUrlStarter: trimUrl(process.env.INTERIM_VENMO_URL_STARTER) ?? legacyVenmo,
    venmoUrlPro: trimUrl(process.env.INTERIM_VENMO_URL_PRO),
    venmoUrl: legacyVenmo,
    cashAppUrlStarter: trimUrl(process.env.INTERIM_CASHAPP_URL_STARTER),
    cashAppUrlPro: trimUrl(process.env.INTERIM_CASHAPP_URL_PRO),
    zelleContact: trimText(process.env.INTERIM_ZELLE_CONTACT),
    note: process.env.INTERIM_PAYMENT_NOTE?.trim() || null,
  };
}

export function mergeInterimPaymentConfig(
  db: Partial<InterimPaymentConfig> | null | undefined,
): InterimPaymentConfig {
  const env = fromEnv();
  const legacyStarter = trimUrl(db?.stripePaymentLinkEnterprise) ?? env.stripePaymentLinkEnterprise;
  const legacyVenmo = trimUrl(db?.venmoUrl) ?? env.venmoUrl;
  const venmoStarter = trimUrl(db?.venmoUrlStarter) ?? env.venmoUrlStarter ?? legacyVenmo;

  return {
    stripePaymentLinkStarter: legacyStarter ?? env.stripePaymentLinkStarter,
    stripePaymentLinkPro: trimUrl(db?.stripePaymentLinkPro) ?? env.stripePaymentLinkPro,
    stripePaymentLinkEnterprise: legacyStarter,
    paypalUrlStarter: trimUrl(db?.paypalUrlStarter) ?? env.paypalUrlStarter,
    paypalUrlPro: trimUrl(db?.paypalUrlPro) ?? env.paypalUrlPro,
    paypalUrl: trimUrl(db?.paypalUrl) ?? env.paypalUrl,
    venmoUrlStarter: venmoStarter,
    venmoUrlPro: trimUrl(db?.venmoUrlPro) ?? env.venmoUrlPro,
    venmoUrl: legacyVenmo,
    cashAppUrlStarter: trimUrl(db?.cashAppUrlStarter) ?? env.cashAppUrlStarter,
    cashAppUrlPro: trimUrl(db?.cashAppUrlPro) ?? env.cashAppUrlPro,
    zelleContact: trimText(db?.zelleContact) ?? env.zelleContact,
    note: db?.note?.trim() || env.note || DEFAULT_NOTE,
  };
}

function urlForTier(
  tier: "starter" | "pro",
  starter: string | null,
  pro: string | null,
): string | null {
  if (tier === "starter") return starter;
  return pro;
}

export function venmoUrlForTier(
  tier: "starter" | "pro",
  config: InterimPaymentConfig,
): string | null {
  return urlForTier(tier, config.venmoUrlStarter ?? config.venmoUrl, config.venmoUrlPro);
}

export function cashAppUrlForTier(
  tier: "starter" | "pro",
  config: InterimPaymentConfig,
): string | null {
  return urlForTier(tier, config.cashAppUrlStarter, config.cashAppUrlPro);
}

/** Best direct-pay link for a tier: Venmo first, then Cash App. */
export function directPayForTier(
  tier: "starter" | "pro",
  config: InterimPaymentConfig,
): { method: DirectPayMethod; link: string } | null {
  const venmo = venmoUrlForTier(tier, config);
  if (venmo) return { method: "venmo", link: venmo };
  const cashApp = cashAppUrlForTier(tier, config);
  if (cashApp) return { method: "cashapp", link: cashApp };
  return null;
}

export function hasDirectPayForTier(
  tier: "starter" | "pro",
  config: InterimPaymentConfig,
): boolean {
  return directPayForTier(tier, config) !== null;
}

export function isInterimPaymentActive(config: InterimPaymentConfig): boolean {
  return isDirectPayActive(config);
}

export function isDirectPayActive(config: InterimPaymentConfig): boolean {
  return Boolean(
    config.venmoUrlStarter ||
    config.venmoUrlPro ||
    config.venmoUrl ||
    config.cashAppUrlStarter ||
    config.cashAppUrlPro ||
    config.zelleContact,
  );
}

export function toPublicInterimPayments(
  config: InterimPaymentConfig,
  opts?: { checkoutUnavailable?: boolean },
): InterimPaymentPublic {
  const directPayActive = isDirectPayActive(config);
  return {
    ...config,
    note: config.note || DEFAULT_NOTE,
    active: directPayActive,
    directPayActive,
    checkoutUnavailable: opts?.checkoutUnavailable ?? !directPayActive,
  };
}
