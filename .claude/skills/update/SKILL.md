---
name: update
description: Update Morning Revival Radio to the latest content and publish. Publishing is automated via a daily GitHub Actions workflow that refreshes the audio catalog, rebuilds the db, builds the web bundle, and deploys to GitHub Pages. Use when the user runs /update or asks to "update the content / publish now / ship a new version" — this triggers that pipeline on demand instead of waiting for the daily run.
---

# /update — refresh content and publish

Publishing is **automated**. The workflow `.github/workflows/daily-update.yml`
runs every day at **02:00 Taiwan time (18:00 UTC)** and does the whole flow on
GitHub's runners: refresh content → build → deploy to **GitHub Pages**. No
secrets or interactive login are involved (it uses the built-in `GITHUB_TOKEN`).

Live site: **https://magiclin99.github.io/morning-revival-radio/**

Use this skill to **publish now** instead of waiting for the daily run, or to
**preview a content change locally** before it goes live.

## Publish now — trigger the automated pipeline

The same workflow can be dispatched manually. It re-runs the entire flow (update
db → build → deploy), so you never build or deploy locally.

```bash
# gh must be authenticated as an account with access to magiclin99/morning-revival-radio
gh workflow run daily-update.yml --repo magiclin99/morning-revival-radio

# then watch the run to completion
gh run watch --repo magiclin99/morning-revival-radio \
  "$(gh run list --repo magiclin99/morning-revival-radio --workflow=daily-update.yml -L1 --json databaseId -q '.[0].databaseId')"
```

Report the run result and the live URL on success. If `gh` errors with a
repository-resolution failure, the active `gh` account can't see the repo — ask
the user to `gh auth login` as `magiclin99` (interactive; use the `!` prefix in
their prompt, not this session).

## Preview a content update locally (optional)

To see what the new catalog looks like before publishing:

```bash
bash .claude/skills/update/update-db.sh   # download latest plist + rebuild db.json
corepack enable 2>/dev/null; [ -d node_modules ] || yarn install
yarn build && yarn preview                # local preview server
```

`update-db.sh` (the deterministic content step, also used by the workflow):
1. Ensures `db/` deps (`xml2js`) are installed.
2. Downloads the upstream catalog plist
   `http://ezoecloud.twgbr.org/xmlapps/morning/plist/audiocloud_morning_tra_2024update.plist`
   over `db/data.xml` (fails loudly if the download isn't a real plist — never
   overwrites with an error page).
3. Runs `node main.js`, converting the plist → `src/components/db.json`
   (strips `NNN,` key prefixes, maps `SERVERIP2` → `ezoecloud.twgbr.org`, `http` → `https`).
4. Validates: JSON parses, and no residual `SERVERIP2` or `http://` links remain.

The script prints the year list and a `git diff --stat`. If the diff is empty,
the content was already current.

## Notes / gotchas
- **Deployment target is GitHub Pages**, configured via `Settings → Pages →
  Source: GitHub Actions`. Firebase is no longer used.
- `db/data.xml` and `src/components/db.json` are **build-time artifacts**. The
  workflow rebuilds them fresh on every run and does **not** commit them — don't
  commit them from a local preview either.
- `vite.config.mts` sets `base` to `/morning-revival-radio/` for production
  builds so assets resolve under the Pages project subpath. Local dev stays at root.
- The workflow copies `dist/index.html` → `dist/404.html` so history-mode routes
  (e.g. `/play`) survive a hard refresh on Pages (no server rewrites there).
- The plist occasionally introduces new content shapes (e.g. 2026 added
  `ondemand/Ministry/...` 「信息」tracks). `main.js` handles them generically; if
  validation flags residual `SERVERIP2`/`http://`, inspect the new entries in
  `db/data.xml`.
- If the upstream plist filename ever changes (currently
  `audiocloud_morning_tra_2024update.plist`), update `PLIST_URL` in `update-db.sh`.
