# Exact GitHub → Vercel upload guide

## Why Vercel shows 404 right now

Your GitHub repo currently looks like this:

```text
AJ-Tours-Travels/                 ← repo root
  README.md
  AJ Enquerie Portal/             ← WRONG: project hidden inside this folder
    package.json
    client/
    vercel.json
    ...
```

Vercel builds from the **repo root**. It does not see `package.json` / `vercel.json` / `client/index.html`, so it publishes an empty site → **404 NOT_FOUND**.

Firestore admin data (`role: admin`, `status: active`) is already correct. That is **not** the Vercel 404 cause.

## Correct GitHub layout (must look like this)

Upload the **contents** of your local project folder to the repo root — **do not** wrap them in `AJ Enquerie Portal`.

```text
AJ-Tours-Travels/                 ← repo root
  package.json
  vercel.json
  vite.config.ts
  tsconfig.json
  pnpm-lock.yaml
  firestore.rules
  firebase.json
  scripts/
    prepare-vercel.mjs
  client/
    index.html                    ← the live portal
    public/
      manifest.webmanifest
      service-worker.js
      aj-mark.svg
      aj-mark-192.png
      aj-mark-512.png
      manus-routes.json
  FIREBASE-SETUP.md
  GITHUB-VERCEL-UPLOAD.md
  ... (other project files OK)
```

After upload, opening the GitHub repo homepage must show **`package.json` and `client`** at the top level, not only one nested folder.

## Exact files/folders to upload

### Required for Vercel live site

| Path | Why |
| --- | --- |
| `client/index.html` | The whole portal + admin UI |
| `client/public/` | Icons, PWA, service worker |
| `vercel.json` | Build + `/admin` rewrite |
| `scripts/prepare-vercel.mjs` | Builds `dist/public` on Vercel |
| `package.json` | Project identity (kept at root) |

### Strongly recommended

| Path | Why |
| --- | --- |
| `firestore.rules` | Keep in Git; still publish manually in Firebase Rules |
| `FIREBASE-SETUP.md` | Setup notes |
| `GITHUB-VERCEL-UPLOAD.md` | This guide |
| `.gitignore` | Prevents uploading `node_modules` / secrets |

### Optional (keep if you want full project history)

- `client/src/`, `server/`, `shared/`, `drizzle/` — old React/MySQL code; **not used** by the live Firebase portal
- `vite.config.ts`, `pnpm-lock.yaml`, docs

### Never upload

- `node_modules/`
- `dist/`
- `.env`, service-account JSON keys
- Customer / booking exports

## Step-by-step fix (do this now)

### 1) Clean the GitHub repo root

1. Open https://github.com/vasuki01-hub/AJ-Tours-Travels
2. Delete the folder **`AJ Enquerie Portal`** from the repo (or create a fresh empty repo).
3. Keep only a clean root for the new upload.

### 2) Upload from your PC folder

On your PC, open this folder:

`...\AJ-Tours-Travel-GitHub-Upload\AJ-Tours-Travel-GitHub-Upload`

Upload **everything inside that folder** to the GitHub repo root.

GitHub web tip:

1. Repo → **Add file** → **Upload files**
2. Drag these items into the drop zone (from inside the project folder):
   - `client`
   - `scripts`
   - `vercel.json`
   - `package.json`
   - `firestore.rules`
   - `.gitignore`
   - other files you want
3. Commit to `main`

### 3) Vercel settings

In Vercel → Project → **Settings → General**:

- **Root Directory**: leave **empty** / `.` (repo root)
- Framework Preset: Other / null
- Build Command: from `vercel.json` (`node scripts/prepare-vercel.mjs`)
- Output Directory: `dist/public`

Redeploy (Deployments → … → Redeploy), or push again.

### 4) Test live URLs

- Staff portal: `https://aj-tours-travels-pi.vercel.app/`
- Admin portal: `https://aj-tours-travels-pi.vercel.app/admin`

Sign in with `pgboss07@gmail.com`.

### 5) Firebase authorized domain

Firebase Console → Authentication → Settings → **Authorized domains**  
Add: `aj-tours-travels-pi.vercel.app`

### 6) Firestore rules

Pushing to GitHub does **not** publish rules.  
Firestore → Rules → paste `firestore.rules` → **Publish** (if not already).

## Admin login (already set in Firestore)

Your owner document looks correct:

- Document ID = Auth UID
- `email`: `pgboss07@gmail.com`
- `role`: `admin`
- `status`: `active`

After Vercel serves the real `client/index.html`, `/admin` should open the Admin Portal for that account.

## Quick check that GitHub is correct

On the GitHub repo home page you must see:

- [x] `package.json`
- [x] `vercel.json`
- [x] `client/`
- [x] `scripts/`
- [ ] NOT only `AJ Enquerie Portal/`
