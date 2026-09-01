import { getUncachableStripeClient } from "../lib/stripe/client";

async function createProducts() {
  const stripe = await getUncachableStripeClient();

  console.log("Checking for existing products...");

  const existingProducts = await stripe.products.list({ limit: 100 });
  for (const product of existingProducts.data) {
    const tier = product.metadata?.tier;
    if (tier === "starter" || tier === "pro" || tier === "enterprise") {
      console.log(`Archiving ${product.name}…`);
      const prices = await stripe.prices.list({ product: product.id });
      for (const price of prices.data) {
        await stripe.prices.update(price.id, { active: false });
      }
      await stripe.products.update(product.id, { active: false });
    }
  }

  console.log("Creating ZZAI Starter ($20/mo)…");
  const starterProduct = await stripe.products.create({
    name: "ZZAI Starter",
    description: "Solo builders — 3 projects, 2,000 API calls/month, full eval suite.",
    metadata: { tier: "starter", projects: "3", apiCalls: "2000" },
  });
  const starterMonthly = await stripe.prices.create({
    product: starterProduct.id,
    unit_amount: 2000,
    currency: "usd",
    recurring: { interval: "month" },
    metadata: { plan: "starter", billing: "monthly" },
  });

  console.log("Creating ZZAI Pro ($50/mo)…");
  const proProduct = await stripe.products.create({
    name: "ZZAI Pro",
    description: "Teams — 10 projects, 10,000 API calls/month, priority support.",
    metadata: { tier: "pro", projects: "10", apiCalls: "10000" },
  });
  const proMonthly = await stripe.prices.create({
    product: proProduct.id,
    unit_amount: 5000,
    currency: "usd",
    recurring: { interval: "month" },
    metadata: { plan: "pro", billing: "monthly" },
  });

  console.log("\nDone! Add to Vercel env:");
  console.log(`  STRIPE_PRICE_ID_STARTER=${starterMonthly.id}`);
  console.log(`  STRIPE_PRICE_ID_PRO=${proMonthly.id}`);
  console.log("\nLive pricing:");
  console.log("  - Free: $0");
  console.log("  - Starter: $20/month");
  console.log("  - Pro: $50/month");
}

createProducts().catch(console.error);
