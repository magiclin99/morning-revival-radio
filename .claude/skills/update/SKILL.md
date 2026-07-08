---
name: update
description: Update Morning Revival Radio to the latest content and publish a new version. Pulls the newest audio catalog plist, rebuilds the local db, builds the web bundle, and deploys to Firebase Hosting. Use when the user runs /update or asks to "update the site / db and publish / ship a new version".
---

# /update — refresh content and publish

Runs the full release flow for this repo: **update db → build → deploy to Firebase**.
Do the three phases in order. Stop and report if any phase fails.

## Phase 1 — Update the db

Run the bundled script (handles download, rebuild, and validation):

```bash
bash .claude/skills/update/update-db.sh
```

What it does:
1. Ensures `db/` deps (`xml2js`) are installed.
2. Downloads the upstream catalog plist
   `http://ezoecloud.twgbr.org/xmlapps/morning/plist/audiocloud_morning_tra_2024update.plist`
   over `db/data.xml` (fails loudly if the download isn't a real plist — never overwrites with an error page).
3. Runs `node main.js`, which converts the plist → `src/components/db.json`
   (strips the `NNN,` key prefixes, maps `SERVERIP2` → `ezoecloud.twgbr.org`, and `http` → `https`).
4. Validates: JSON parses, and no residual `SERVERIP2` or `http://` links remain.

The script prints the year list and a `git diff --stat`. Report to the user what changed
(e.g. new years/messages added). If the diff is empty, tell them the content was already current
— you can stop here and skip building/deploying unless they want a rebuild anyway.

## Phase 2 — Build the web bundle

```bash
corepack enable 2>/dev/null; [ -d node_modules ] || yarn install
yarn build
```

`yarn build` runs `vue-tsc --noEmit && vite build` (type-check + Vite build) and writes `dist/`.
If it fails on types or build, surface the error and stop — do not deploy a broken build.

## Phase 3 — Deploy to Firebase Hosting

Target project: **`morning-rivival-radio`** (that spelling is the real project id — see `.firebaserc`).

First check auth:

```bash
firebase projects:list
```

- If it errors with **401 / invalid credentials**, the login token is expired. Firebase login is
  interactive and cannot run inside this session. Ask the user to run **`firebase login --reauth`
  in their own terminal window** (not via the `!` prefix, which is non-interactive), then continue.
- Once auth works, deploy:

```bash
firebase deploy --only hosting --project morning-rivival-radio
```

Report the **Hosting URL** (`https://morning-rivival-radio.web.app`) on success.

## After deploy

`db/data.xml` and `src/components/db.json` will show as modified in git. Ask the user whether to
commit the content update (offer to do it on a branch, not directly on `main`). Do not commit
unless they say yes.

## Notes / gotchas
- `yarn` comes from corepack (`yarn` 1.22). If `yarn` isn't found, run `corepack enable` first,
  or fall back to `npm install` / `npm run build`.
- The plist occasionally introduces new content shapes (e.g. 2026 added `ondemand/Ministry/...`
  「信息」tracks). `main.js` handles them generically, but if validation flags residual
  `SERVERIP2`/`http://`, inspect the new entries in `db/data.xml`.
- If the upstream plist filename ever changes (currently `audiocloud_morning_tra_2024update.plist`),
  update `PLIST_URL` in `update-db.sh`.
