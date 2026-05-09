# ALL DE APPS IN ONE

Monorepo of multiple apps. The production-ready **Next.js** product lives in **`Svivva/`**.

## Deploy Svivva on Vercel

1. Push this repository to GitHub.
2. Open [vercel.com](https://vercel.com) → **Add New Project** → import that repo.
3. Set **Root Directory** to **`Svivva`** (this step is easy to miss).
4. Add environment variables from **`Svivva/.env.example`** (see the checklist in **`Svivva/README.md`**).
5. Deploy.

DNS (e.g. GoDaddy): after deploy, add your domain under **Vercel → Project → Domains** and copy the records into your registrar.
