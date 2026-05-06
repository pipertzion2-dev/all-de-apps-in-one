import { getUncachableStripeClient } from '../lib/stripe/client';

async function createProducts() {
  const stripe = await getUncachableStripeClient();
  
  console.log('Checking for existing products...');
  
  const existingProducts = await stripe.products.list({ limit: 100 });
  const proProduct = existingProducts.data.find((p: any) => p.name === "Svivva Pro" || p.name === "Vivva Pro");
  const enterpriseProduct = existingProducts.data.find((p: any) => p.name === "Svivva Enterprise" || p.name === "Vivva Enterprise");

  // Archive existing products and their prices
  if (proProduct) {
    console.log("Archiving existing Pro product...");
    const prices = await stripe.prices.list({ product: proProduct.id });
    for (const price of prices.data) {
      await stripe.prices.update(price.id, { active: false });
    }
    await stripe.products.update(proProduct.id, { active: false });
  }

  if (enterpriseProduct) {
    console.log("Archiving existing Enterprise product...");
    const prices = await stripe.prices.list({ product: enterpriseProduct.id });
    for (const price of prices.data) {
      await stripe.prices.update(price.id, { active: false });
    }
    await stripe.products.update(enterpriseProduct.id, { active: false });
  }

  // Create Vivva Pro with $49/month
  console.log("Creating Svivva Pro product...");
  const newProProduct = await stripe.products.create({
    name: "Svivva Pro",
    description: "For growing teams and projects. 10 projects, 10,000 API calls/month, full eval suite with auto-rollback.",
    metadata: {
      tier: 'pro',
      projects: '10',
      apiCalls: '10000',
    },
  });

  const proMonthlyPrice = await stripe.prices.create({
    product: newProProduct.id,
    unit_amount: 4900,
    currency: 'usd',
    recurring: { interval: 'month' },
    metadata: { plan: 'pro', billing: 'monthly' },
  });

  const proYearlyPrice = await stripe.prices.create({
    product: newProProduct.id,
    unit_amount: 49000,
    currency: 'usd',
    recurring: { interval: 'year' },
    metadata: { plan: 'pro', billing: 'yearly' },
  });

  console.log("Created Svivva Pro:", newProProduct.id);
  console.log('  Monthly price ($49):', proMonthlyPrice.id);
  console.log('  Yearly price ($490):', proYearlyPrice.id);

  // Create Vivva Enterprise with $299/month
  console.log("Creating Svivva Enterprise product...");
  const newEnterpriseProduct = await stripe.products.create({
    name: "Svivva Enterprise",
    description: "For large-scale deployments. Unlimited projects, unlimited API calls, SLA guarantee.",
    metadata: {
      tier: 'enterprise',
      projects: 'unlimited',
      apiCalls: 'unlimited',
    },
  });

  const enterpriseMonthlyPrice = await stripe.prices.create({
    product: newEnterpriseProduct.id,
    unit_amount: 29900,
    currency: 'usd',
    recurring: { interval: 'month' },
    metadata: { plan: 'enterprise', billing: 'monthly' },
  });

  console.log("Created Svivva Enterprise:", newEnterpriseProduct.id);
  console.log('  Monthly price ($299):', enterpriseMonthlyPrice.id);

  console.log('\nDone! New pricing is active:');
  console.log('  - Free: $0/month');
  console.log('  - Pro: $49/month (or $490/year)');
  console.log('  - Enterprise: $299/month');
}

createProducts().catch(console.error);
