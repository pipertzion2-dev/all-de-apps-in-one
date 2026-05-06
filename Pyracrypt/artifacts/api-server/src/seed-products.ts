import { getUncachableStripeClient } from './stripeClient.js';

const PLANS = [
  {
    name: 'Pyracrypt Pro',
    description: 'Unlimited scans, all 5 scan modes, full AI dashboard, auto-patch generation, compliance reports (NIST, SOC 2, OWASP), priority support.',
    price_monthly: 1900,
  },
  {
    name: 'Pyracrypt Team',
    description: 'Everything in Pro plus up to 5 team seats, shared scan history, API access, custom integrations, and Slack alerts.',
    price_monthly: 4900,
  },
  {
    name: 'Pyracrypt Enterprise',
    description: 'Everything in Team plus unlimited seats, dedicated AI model, on-prem deployment option, SLA guarantee, and white-label reports.',
    price_monthly: 14900,
  },
]

async function seedProducts() {
  const stripe = await getUncachableStripeClient()
  console.log('Seeding Pyracrypt products in Stripe...')

  for (const plan of PLANS) {
    const existing = await stripe.products.search({ query: `name:'${plan.name}' AND active:'true'` })
    if (existing.data.length > 0) {
      console.log(`✓ ${plan.name} already exists (${existing.data[0].id})`)
      continue
    }

    const product = await stripe.products.create({
      name: plan.name,
      description: plan.description,
      metadata: { app: 'pyracrypt' },
    })

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.price_monthly,
      currency: 'usd',
      recurring: { interval: 'month' },
    })

    console.log(`✓ Created ${plan.name}: $${plan.price_monthly / 100}/mo (${price.id})`)
  }

  console.log('Done!')
}

seedProducts().catch(e => { console.error(e.message); process.exit(1) })
