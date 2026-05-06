import { Router, type IRouter } from 'express';
import { storage } from '../storage.js';
import { getUncachableStripeClient, getStripePublishableKey } from '../stripeClient.js';

const router: IRouter = Router();

// Get publishable key for frontend
router.get('/stripe/config', async (_req, res) => {
  try {
    const publishableKey = await getStripePublishableKey();
    res.json({ publishableKey });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// List products with prices
router.get('/stripe/products', async (_req, res) => {
  try {
    const rows = await storage.listProductsWithPrices();
    const productsMap = new Map<string, any>();
    for (const row of rows as any[]) {
      if (!productsMap.has(row.product_id)) {
        productsMap.set(row.product_id, {
          id: row.product_id,
          name: row.product_name,
          description: row.product_description,
          metadata: row.product_metadata || {},
          prices: [],
        });
      }
      if (row.price_id) {
        productsMap.get(row.product_id).prices.push({
          id: row.price_id,
          unit_amount: row.unit_amount,
          currency: row.currency,
          recurring: row.recurring,
        });
      }
    }
    res.json({ data: Array.from(productsMap.values()) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create checkout session (no auth required — email collected by Stripe)
router.post('/stripe/checkout', async (req, res) => {
  try {
    const { priceId, email } = req.body;
    if (!priceId) return res.status(400).json({ error: 'priceId is required' });

    const stripe = await getUncachableStripeClient();

    const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      customer_email: email || undefined,
      success_url: `${baseUrl}/?checkout=success`,
      cancel_url: `${baseUrl}/pricing?checkout=cancel`,
    });

    res.json({ url: session.url });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
