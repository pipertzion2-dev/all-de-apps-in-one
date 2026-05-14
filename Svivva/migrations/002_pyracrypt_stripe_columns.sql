-- Optional columns: separate Stripe account for Pyracrypt (vault in Svivva admin; copy to Pyracrypt Vercel env).
ALTER TABLE platform_runtime_secrets
  ADD COLUMN IF NOT EXISTS pyracrypt_stripe_secret_key text,
  ADD COLUMN IF NOT EXISTS pyracrypt_stripe_publishable_key text,
  ADD COLUMN IF NOT EXISTS pyracrypt_stripe_webhook_secret text;
