# Vercel account — use the correct project

Production **must** deploy to one Vercel project only:

|                    | Correct                                         | Wrong (remove)         |
| ------------------ | ----------------------------------------------- | ---------------------- |
| **Account**        | `ziontpiper@icloud.com`                         | Any other Vercel login |
| **Team**           | `zzai-zzai`                                     | Personal / other teams |
| **Project**        | `all-de-apps-in-one`                            | `svivva-main-app`      |
| **Root directory** | `Svivva`                                        | —                      |
| **Domain**         | `zzaizzai.com`                                  | —                      |
| **Dashboard**      | https://vercel.com/zzai-zzai/all-de-apps-in-one | —                      |

Canonical config is committed at **`Svivva/vercel-canonical.json`**.

## Why GitHub shows two Vercel checks

This repo is (or was) connected to **two** Vercel projects:

- **`Vercel – all-de-apps-in-one`** — correct (team `zzai-zzai`, `ziontpiper@icloud.com`)
- **`Vercel – svivva-main-app`** — wrong / old account (almost always **Account is blocked**)

Only the first one matters for production. The second pollutes CI until you disconnect it.

**Your main Vercel account (`ziontpiper@icloud.com` / `zzai-zzai`) is not blocked.** GitHub’s `Vercel – svivva-main-app` check comes from a **different, old Vercel login** — always ignore it. Only trust **`Vercel – all-de-apps-in-one`**.

If **`all-de-apps-in-one`** briefly shows “Account is blocked” but the dashboard looks normal, Vercel usually means **deployments are paused** (spend cap / billing), not a banned account. The label is misleading. `zzaizzai.com` may keep serving an **older deployment** until you **Resume** the project and redeploy.

## Fix: disconnect the wrong project (one-time)

Do **both** if possible:

### A — Wrong Vercel account (where `svivva-main-app` lives)

1. Sign in to Vercel with the account that owns **`svivva-main-app`** (not `ziontpiper@icloud.com` if that’s a different login).
2. Open project **`svivva-main-app`** → **Settings** → **Git**.
3. **Disconnect** repository `pipertzion2-dev/all-de-apps-in-one`.
4. Optional: delete or pause the project so it cannot be re-linked by mistake.

### B — GitHub side

1. GitHub → **Settings** → **Integrations** → **Applications** → **Vercel** → **Configure**.
2. Ensure only the **`zzai-zzai` / `all-de-apps-in-one`** connection remains for this repo.
3. Remove access for the old team/project if listed.

### C — Correct account (keep this one)

1. Sign in as **`ziontpiper@icloud.com`** → team **`zzai-zzai`** → **`all-de-apps-in-one`**.
2. **Settings → Git** — repo `pipertzion2-dev/all-de-apps-in-one` connected, **Root Directory = `Svivva`**.
3. **Settings → Domains** — `zzaizzai.com` + `www.zzaizzai.com`.
4. If the account was paused: **Resume** production (see [deployment paused](https://vercel.com/knowledge/why-is-my-account-deployment-blocked)).

## CLI / local deploy (always pin project)

From **`Svivva/`**:

```bash
npm run vercel:link      # links .vercel/project.json to zzai-zzai/all-de-apps-in-one
npm run deploy:prod      # deploy --scope zzai-zzai --project all-de-apps-in-one
```

Do **not** run bare `vercel deploy --prod` without scope/project — the CLI may pick the wrong team.

## GitHub Actions (optional Path B)

If you use **Deploy Svivva (Vercel production)**:

1. Token from **`ziontpiper@icloud.com`** (team **`zzai-zzai`**).
2. Secrets **`VERCEL_ORG_ID`** + **`VERCEL_PROJECT_ID`** from **all-de-apps-in-one** → Settings → General.
3. Variable **`VERCEL_CI_DEPLOY=true`**.

Do **not** use Path A (Vercel Git hook) **and** Path B (Actions) at the same time.

## Agents / docs in this repo

- **Use:** `all-de-apps-in-one` on team `zzai-zzai`
- **Never use:** `svivva-main-app` (deprecated in `vercel-canonical.json`)
- See also: root **`README.md`**, **`.cursor/CONNECT.md`**
