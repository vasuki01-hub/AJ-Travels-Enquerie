# AJ Tours & Travel — GitHub, live hosting and future edits

## GitHub is the source repository; Firebase Hosting serves the app

The live portal is now a static, single-file browser app that connects directly to Firebase Authentication and Cloud Firestore. Keep its source in a **private GitHub repository** and host it with **Firebase Hosting**. A GitHub repository stores the code; pushing a commit to GitHub alone does not publish a website. The deployment steps below build the static files and explicitly publish them to Firebase Hosting.

Do **not** use GitHub Pages for the live AJ Tours employee portal. GitHub's official Pages policy says Pages is not intended for or allowed as free hosting for an online business, commercial transactions, or commercial SaaS, and Pages sites should not be used for sensitive transactions such as sending passwords or credit-card numbers. The login and passenger/customer workflow makes Pages the wrong place for this portal. GitHub can still hold the private source repository.

Firebase Hosting serves the static app while Authentication and Firestore provide sign-in and data. Firebase offers no-cost Spark quotas, but those quotas are limited and can change; there is no guarantee that real business usage will always remain free. Review current terms, limits, backups, privacy obligations and the project's billing settings before storing real passenger/customer data.

## Before the first live deploy

Follow [FIREBASE-SETUP.md](FIREBASE-SETUP.md) first. In short, an authorized project owner must enable Email/Password sign-in, create/confirm Firestore, review and publish `firestore.rules`, and bootstrap one administrator. The sample OTP shown on the signup page is a **test-only code generated in the browser**, not a real email/SMS verification factor. Do not treat it as staff identity proof.

The Firebase rules file governs access for the **whole Firestore database**. It is tailored to this portal's `inquiries`, `bookings`, `users` and `settings/portal` collections and intentionally does not grant access to `contactIndex` or a legacy `employees` collection. Review the project's current Firestore rules and any other Firebase applications before replacing them. The first admin's role/status must be set in Firebase Console; the page does not provide a self-promotion button.

## Put the project on GitHub

1. In Manus, connect the project through its **Connect to GitHub / Save to GitHub** flow. Use a private repository and keep the existing managed project connection; do not manually overwrite the project remote.
2. Push the complete source repository, including the single HTML app, Firebase rules/config, PWA assets and build lockfile. Do not upload only the HTML through GitHub's web editor.
3. Keep customer enquiries, passenger names, booking records, passwords and Firestore exports out of GitHub. Commit neither `.env` files nor Firebase Admin SDK service-account keys.

The public Firebase Web App configuration inside `client/index.html` (including its web API key) is designed to be visible to the browser. It is not an admin credential. Security depends on Firebase Authentication plus `firestore.rules`; do not weaken those rules to hide or expose a browser key.

## Publish manually to Firebase Hosting

From a trusted computer with the GitHub repository cloned, run these commands from the repository root:

```sh
corepack enable
corepack prepare pnpm@10.18.0 --activate
pnpm install --frozen-lockfile
pnpm build
npm install --global firebase-tools
firebase login
firebase use aj-travels-7ae50
firebase deploy --only hosting,firestore:rules
```

Check the CLI output for the deployed Firebase Hosting URL, then test the HTTPS site with an approved administrator account. Firebase Authentication must recognize the Hosting domain; add any custom domain under **Authentication → Settings → Authorized domains**. If you do **not** intend to change Firestore permissions yet, deploy only Hosting with `firebase deploy --only hosting` and review the rules separately first.

The `firebase.json` file serves **only** `dist/public`. Run `pnpm build` before deploying. This excludes the older React source and Node server from the static public directory. Build output is generated and `.gitignore` excludes `dist/`; do not commit build output just to deploy. The `firestore.rules` deployment is separate from serving the website and replaces the rules for this whole Firebase project's Firestore database.

### Optional: deploy on GitHub commits

Firebase's official GitHub integration can generate GitHub Actions for preview channels and live deploys. It requires repository administrator access and creates a Firebase service-account credential stored as an encrypted GitHub Actions secret. Never copy that credential into the repo, `client/index.html` or a public log. Review the generated workflow and its permissions before enabling it. Firebase warns that Hosting preview-channel URLs can use the project's real backend; test with a separate Firebase project if preview activity must not touch production data. A manual CLI deploy is simpler for the first launch.

## Which files to keep in GitHub

Push the **complete source repository**. The primary files for the current app are:

- `client/index.html` — the actual portal: HTML, inline CSS, vanilla JavaScript, Firebase browser setup, account screens, operational views and download logic.
- `client/public/manifest.webmanifest`, `client/public/service-worker.js`, and `client/public/aj-mark-*.png`/`aj-mark.svg` — PWA install metadata, static-shell worker and replaceable fallback app marks.
- `firestore.rules` — Firestore authorization and linked enquiry/booking integrity rules; changes to it affect the Firebase project only when explicitly deployed.
- `firebase.json` and `.firebaserc` — static Hosting build-output path, headers, SPA rewrite, rules declaration and the supplied project alias.
- `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `vite.config.ts` — the existing project build tools and pinned dependency graph used to prepare `dist/public`.
- `FIREBASE-SETUP.md`, `HOSTING-GUIDE.md`, `plan.md`, and `TODO.md` — setup, hosting, and project notes.

The old `client/src/`, `server/`, `shared/`, and `drizzle/` folders are retained as historical React/TypeScript/Express/tRPC/MySQL source, but the standalone HTML does not import or use them. The static Hosting deployment serves only `dist/public`. The earlier MySQL database is **not** copied into Firestore by a code push. Do not make and upload a customer-data export as part of this code deployment.

Keep `.gitignore` in place. It excludes `node_modules/`, `dist/`, environment files, logs and local data. Never commit `.env`, a service-account private key, OAuth tokens, or customer records. The Firebase web config is a public browser identifier; a service-account JSON key is highly sensitive and must only be stored as a restricted GitHub Actions secret if you deliberately enable automated deployment.

## Important files for future changes

| Change | Main file(s) |
| --- | --- |
| Dashboard, navigation, enquiry/booking forms, reports, filters, settings, account approval and browser-side logic | `client/index.html` |
| PWA name, launch behavior and app icons | `client/public/manifest.webmanifest`, `client/public/aj-mark*.png`, `client/public/aj-mark.svg` |
| Offline app-shell behavior | `client/public/service-worker.js` (static shell only; it does not cache customer records) |
| Who can read/write portal data or approve staff | `firestore.rules` — review carefully; this is a database-wide permission file |
| Firebase Hosting output folder/headers/rewrites | `firebase.json` |
| Default Firebase project alias | `.firebaserc` |
| First-admin bootstrap, Firebase providers and manual deploy | `FIREBASE-SETUP.md` |
| Build scripts and pinned export-library packages | `package.json`, `pnpm-lock.yaml`, `vite.config.ts` |

Use HTML/CSS/JavaScript in `client/index.html` for UI and behavior changes. Update the Firestore rules when the data model or access roles change; do not change them merely to silence a `permission-denied` message. Keep builds responsive and test at a phone viewport as well as desktop. Do not test with real customer data unless authorized.

## Technology stack used

- **App runtime:** one local `client/index.html` document containing semantic HTML, responsive CSS and plain browser JavaScript; no React or runtime Node server in the published portal.
- **Firebase browser SDK:** Firebase JavaScript SDK **13.1.0 Compat CDN** (`firebase-app`, `firebase-auth`, `firebase-firestore`) for the supplied Firebase project. Email/password Authentication stores accounts; Cloud Firestore stores approved users, enquiries, bookings and portal settings. The user-provided Web App config is public client configuration.
- **PWA:** `manifest.webmanifest` plus a same-origin Service Worker for a network-first static app shell. Passenger/customer data, tokens and Firestore API responses are not cached offline.
- **Reports/downloads:** ExcelJS, jsPDF and jsPDF AutoTable are loaded from pinned jsDelivr CDNs when an export is requested; they create styled XLSX and bordered PDF files in the browser. Exports require internet access to those CDNs unless the reviewed libraries are hosted with the static app.
- **Static Hosting:** Firebase Hosting. The existing Vite build step prepares `dist/public`; Vite/Node is build tooling, not the published app server.
- **Legacy source:** React/TypeScript, Express/tRPC, MySQL/Drizzle files remain in the repository history and folders but are not used by the standalone Firebase front end.

## Safe update routine

1. Make the requested UI change in `client/index.html`; change companion PWA/config/rules files only when needed.
2. Run `pnpm check`, `pnpm test` and `pnpm build`; inspect `git diff --check` and verify `dist/public` contains the app, manifest, service worker, icons and route manifest.
3. Use synthetic/test-project data for validation. Firebase Hosting previews can connect to the real Firebase backend, so do not run test writes against company records.
4. Commit source changes to the private GitHub repository. To make a change live, explicitly build and deploy using Firebase CLI or a reviewed GitHub Action; GitHub source pushes do not publish automatically.

## Official references checked on 6 November 2026

- [GitHub Pages: usage limits and prohibited purposes](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits) — commercial online businesses/SaaS and sensitive transactions are not allowed on Pages.
- [GitHub Pages: about](https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages) — Pages serves static files from a repository.
- [Firebase Hosting GitHub integration](https://firebase.google.com/docs/hosting/github-integration) — generated Actions, service-account secret and preview/live channels.
- [Firebase Hosting quickstart](https://firebase.google.com/docs/hosting/quickstart) — static output and CLI deploy process.
- [Firebase pricing](https://firebase.google.com/pricing) — current Spark and product quotas; confirm before live operations.
- [Firestore role-based access](https://firebase.google.com/docs/firestore/solutions/role-based-access) and [transactions](https://firebase.google.com/docs/firestore/manage-data/transactions) — rules and atomic linked-record changes.
