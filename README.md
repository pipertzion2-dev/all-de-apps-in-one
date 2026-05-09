# ALL DE APPS IN ONE

Monorepo of multiple apps. The production-ready **Next.js** product lives in **`Svivva/`**.

## Deploy Svivva on Vercel (pick one path)

Do **not** wire both **Path A** and **Path B** at the same time, or every code push can trigger **two** production deploys.

### Path A — Vercel imports GitHub (simplest)

1. Push this repo to GitHub.
2. [vercel.com](https://vercel.com) → **Add New Project** → import the repo.
3. **Root Directory:** **`Svivva`** (required).
4. Add env vars from **`Svivva/.env.example`** — see **`Svivva/README.md`** for the checklist.
5. **Deploy.**

Optional: disable the GitHub Action **Deploy Svivva (Vercel production)** so only Vercel’s Git hook runs  
(GitHub → **Actions** → workflow → **⋯** → **Disable workflow**).

### Path B — GitHub Actions (`vercel deploy --prebuilt`)

Use this if you want deploys driven only by Actions (no Vercel↔Git integration).

1. Create a Vercel project (empty is fine) so you have **Organization** and **Project** IDs.
2. Create a token: [vercel.com/account/tokens](https://vercel.com/account/tokens).
3. GitHub repo → **Settings → Secrets and variables → Actions → Secrets**:
   - **`VERCEL_TOKEN`**
   - **`VERCEL_ORG_ID`** — Vercel → Project → **Settings → General**
   - **`VERCEL_PROJECT_ID`** — same  
   Or run `cd Svivva && npx vercel link` locally once and read `.vercel/project.json` (gitignored).
4. **Variables** tab: **`VERCEL_CI_DEPLOY`** = **`true`**  
   (Until this is set, pushes skip the deploy job so CI stays green while you configure secrets.)
5. Push to **`main`** (or **Actions → Deploy Svivva → Run workflow**).

Then **do not** also connect the same repo in Vercel’s **Git** tab for automatic deploys (or disable this workflow).

### Secrets helper

From **`Svivva`:**

```bash
npm run secrets:for-deploy
```

Prints random values for `NEXTAUTH_SECRET`, `CRON_SECRET`, and `ORBIT_INTERNAL_SECRET` — paste them into the Vercel env UI.

### Push blocked when adding GitHub Actions?

If `git push` says OAuth cannot update **workflow** files, use SSH or a Personal Access Token that includes the **`workflow`** scope, or push with **GitHub Desktop**. This environment cannot grant that scope for you.

### Custom domain (GoDaddy, etc.)

After the site is live on `*.vercel.app`: Vercel → **Project → Domains** → add your domain → paste the DNS records at your registrar.
