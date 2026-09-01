/** Cash App subscription plans — $20 Starter / $50 Pro via cash.app links. */

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

export type CashAppPlanMethod = "cashapp";

export type InterimPaymentPublic = InterimPaymentConfig & {
  active: boolean;
  cashAppPlansActive: boolean;
  cashAppTag: string;
  checkoutUnavailable: boolean;
};

const DEFAULT_NOTE =
  "After you pay on Cash App, enter your access code above — or email your receipt to hello@zzaizzai.com and we'll activate your plan.";

function trimUrl(v: string | null | undefined): string | null {
  const t = v?.trim();
  if (!t) return null;
  if (!/^https?:\/\//i.test(t)) return null;
  return t;
}

function cashAppTagFromEnv(): string {
  return (process.env.INTERIM_CASHAPP_TAG?.trim() || "pipertzion").replace(/^\$/, "");
}

function trimText(v: string | null | undefined): string | null {
  const t = v?.trim();
  return t || null;
}

function fromEnv(): InterimPaymentConfig {
  const legacyVenmo = trimUrl(process.env.INTERIM_VENMO_URL);
  const cashTag = cashAppTagFromEnv();
  const defaultCashStarter = `https://cash.app/$${cashTag}/20`;
  const defaultCashPro = `https://cash.app/$${cashTag}/50`;
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
    cashAppUrlStarter: trimUrl(process.env.INTERIM_CASHAPP_URL_STARTER) ?? defaultCashStarter,
    cashAppUrlPro: trimUrl(process.env.INTERIM_CASHAPP_URL_PRO) ?? defaultCashPro,
    zelleContact: trimText(process.env.INTERIM_ZELLE_CONTACT),
    note: process.env.INTERIM_PAYMENT_NOTE?.trim() || null,
  };
}

export function getCashAppTag(config?: InterimPaymentConfig | null): string {
  const starter = config?.cashAppUrlStarter ?? fromEnv().cashAppUrlStarter;
  if (starter) {
    const m = starter.match(/cash\.app\/\$([^/]+)/i);
    if (m?.[1]) return m[1];
  }
  return cashAppTagFromEnv();
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

/** Cash App checkout URL for Starter ($20) or Pro ($50). */
export function cashAppPlanForTier(
  tier: "starter" | "pro",
  config: InterimPaymentConfig,
): { method: CashAppPlanMethod; link: string } | null {
  const link = cashAppUrlForTier(tier, config);
  if (!link) return null;
  return { method: "cashapp", link };
}

/** @deprecated use cashAppPlanForTier */
export const directPayForTier = cashAppPlanForTier;

export function hasCashAppPlanForTier(
  tier: "starter" | "pro",
  config: InterimPaymentConfig,
): boolean {
  return cashAppPlanForTier(tier, config) !== null;
}

/** @deprecated */
export const hasDirectPayForTier = hasCashAppPlanForTier;

export function isCashAppPlansActive(config: InterimPaymentConfig): boolean {
  return Boolean(config.cashAppUrlStarter || config.cashAppUrlPro);
}

export function isInterimPaymentActive(config: InterimPaymentConfig): boolean {
  return isCashAppPlansActive(config);
}

/** @deprecated use isCashAppPlansActive */
export function isDirectPayActive(config: InterimPaymentConfig): boolean {
  return isCashAppPlansActive(config);
}

export function toPublicInterimPayments(
  config: InterimPaymentConfig,
  opts?: { checkoutUnavailable?: boolean },
): InterimPaymentPublic {
  const cashAppPlansActive = isCashAppPlansActive(config);
  return {
    ...config,
    note: config.note || DEFAULT_NOTE,
    active: cashAppPlansActive,
    cashAppPlansActive,
    cashAppTag: getCashAppTag(config),
    checkoutUnavailable: opts?.checkoutUnavailable ?? !cashAppPlansActive,
  };
}
