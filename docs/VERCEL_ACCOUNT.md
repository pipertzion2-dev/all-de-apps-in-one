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

**`svivva-main-app` is not on `ziontpiper@icloud.com` / team `zzai-zzai`.** It is a leftover project on an **older, blocked Vercel login** (often Replit-era, Cursor default, or another email). That account still posts the red **`Vercel – svivva-main-app`** status on every push even though you cannot see the project in your dashboard.

1. Try signing in to [vercel.com](https://vercel.com) with **any other email** you may have used (e.g. `pipertzion2@gmail.com`, Replit-linked login, old personal email).
2. If you find **`svivva-main-app`**: **Settings → Git → Disconnect** `pipertzion2-dev/all-de-apps-in-one`, then delete or pause the project.
3. If the account is **blocked** and you cannot sign in: open [Vercel Support](https://vercel.com/help) and ask them to **unlink `svivva-main-app` from `github.com/pipertzion2-dev/all-de-apps-in-one`** (account blocked, project not visible on current login).

### B — GitHub side (when you do not own the old Vercel login)

1. GitHub (as **`pipertzion2-dev`**) → [Installed GitHub Apps → Vercel → Configure](https://github.com/settings/installations).
2. Under **Repository access**, confirm this repo is listed. You cannot remove only `svivva-main-app` from here — the ghost check comes from the **other Vercel account’s** project link.
3. **Nuclear option (only if Support cannot help):** Revoke Vercel’s GitHub access, then reconnect Git **once** from **`ziontpiper@icloud.com` → `zzai-zzai` → `all-de-apps-in-one` → Settings → Git**. Do **not** reconnect from any other Vercel login.
4. Until disconnected, **ignore** `Vercel – svivva-main-app` in CI. Only **`Vercel – all-de-apps-in-one`** is production.

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

## Permanent fix in this repo (multiple deployments)

These settings stop deploy spam and duplicate checks once merged:

| Layer                                            | What it does                                                                              |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| **`Svivva/vercel.json`**                         | `git.deploymentEnabled`: only **`main`** deploys; all other branches (`*`) off            |
| **`Svivva/scripts/vercel-should-build.mjs`**     | Ignored Build Step: skip when not `main`, no `Svivva/` diff, or `[skip vercel]` in commit |
| **`.github/workflows/vercel-deploy-latest.yml`** | Deploy latest on `main` push or manual run; hook or token; clears queue when token set    |
| **`Svivva/scripts/clear-vercel-queue.mjs`**      | Cancels queued/building deploys before manual or CI redeploy                              |

### Choose one deploy path (not both)

**Path A — Vercel Git (default, no secrets needed)**

- Push to **`main`** with changes under **`Svivva/`** → one production deploy.
- Do **not** set `VERCEL_CI_DEPLOY=true` unless you switch to Path B.

**Path B — GitHub Actions only (requires secrets)**

1. Repo secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
2. Repo variable: `VERCEL_CI_DEPLOY=true`
3. Vercel dashboard → **all-de-apps-in-one** → Git → disable auto-deploy on push  
   (or set `"main": false` in `Svivva/vercel.json` `git.deploymentEnabled`)
4. Actions workflow **Vercel production (auto)** deploys once per push with queue cleared.

### Stuck queue — latest commit not live

When Vercel shows **Account is blocked** or deployments stay **Queued**, production keeps serving an **older** build until you:

1. **Vercel dashboard** → `zzai-zzai` / `all-de-apps-in-one` → **Deployments** → cancel **Queued** / **Building** rows (or **Resume** if the project is paused).
2. **Deploy latest** via GitHub Actions (fastest once configured):
   - **Easy:** repo secret **`VERCEL_DEPLOY_HOOK`** — Vercel → project → **Settings → Git → Deploy Hooks** → create hook for branch **`main`**, paste URL into GitHub **Settings → Secrets → Actions**.
   - **Full:** secrets **`VERCEL_TOKEN`**, **`VERCEL_ORG_ID`**, **`VERCEL_PROJECT_ID`** (clears queue automatically before deploy).
   - Run **Actions → Deploy latest (Vercel production) → Run workflow** (or push to `main` with `Svivva/` changes).

Without those secrets, the agent cannot clear the queue or trigger production from here — Git integration alone will stay red until the dashboard queue is cleared.

### Stop empty “trigger redeploy” commits

Commits that only touch docs, workflows, or root files **do not** rebuild Svivva.  
To redeploy the same code without changes, run **Deploy Svivva (Vercel production)** manually or use `npm run redeploy:prod` with `VERCEL_TOKEN`.

## Agents / docs in this repo

- **Use:** `all-de-apps-in-one` on team `zzai-zzai`
- **Never use:** `svivva-main-app` (deprecated in `vercel-canonical.json`)
- See also: root **`README.md`**, **`.cursor/CONNECT.md`**
