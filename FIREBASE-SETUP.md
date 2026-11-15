# AJ Tours & Travel — Firebase setup and safe launch

**Important:** The standalone portal and Firebase Hosting configuration are prepared in this repository, but Firebase Console settings have not been changed and the site has not been deployed. The standalone frontend uses Firestore; it does not import, mirror or read from the former managed MySQL database.

## 1. Confirm Firebase project settings

The supplied web configuration points to Firebase project **`aj-travels-7ae50`**. In Firebase Console, open that project and verify you are authorized to use it. The app configuration in `client/index.html` is the public Web App config. A browser Firebase API key is an identifier and is not a substitute for authorization; Firestore Security Rules must be deployed. Do not put a Firebase Admin SDK service-account key in website code, GitHub or browser storage.

## 2. Enable employee email/password sign-in

In Firebase Console, open **Authentication → Sign-in method** and enable **Email/Password**. Consider setting a stronger Firebase password policy and enabling email-enumeration protection under the Authentication settings. The portal supports password-reset emails through Firebase Auth.

The signup page displays a short-lived, browser-generated **test OTP** so the prototype has the requested on-page code. It is not delivered by SMS or email, does not verify ownership of an address/phone, and must not be treated as real two-factor authentication. All newly created profiles remain `pending` until an administrator approves them. For live staff verification, replace the test code with verified email links or a trusted server/SMS flow.

## 3. Create or confirm Cloud Firestore

**Required before any admin/employee profile can save.** The website talks to Cloud Firestore database ID `(default)` in project `aj-travels-7ae50`. If the console log says `Database '(default)' not found`, either the default database was never created, or you created a **named** database (for example ID `default` without parentheses).

The portal now also tries database ID `default`. If profiles still fail:

1. Firebase Console → **Firestore** → look at the ID in the top database dropdown (not only the label).
2. If it is not `(default)`, click **Create database** and create the **default** database (ID must be `(default)`), **or** keep using the named one named `default`.
3. Publish `firestore.rules` on **that same database** (Rules tab for the selected database).
4. Turn off ad blockers on the Vercel site (`ERR_BLOCKED_BY_CLIENT` blocks Firestore).

If Authentication users exist but Firestore writes fail with “database (default) does not exist”, the default database has not been created yet.

1. Open Firebase Console → project **`aj-travels-7ae50`**.
2. Go to **Build → Firestore Database → Create database**.
3. Choose **production mode** (or test mode briefly, then replace rules immediately).
4. Pick a region and create it. Location cannot be changed later.
5. Open the **Rules** tab and publish the full contents of this repository’s `firestore.rules`.
6. Confirm the Data tab shows an empty database (collections appear after the first writes).

The portal uses `users`, `inquiries`, `bookings`, `attendance`, and `settings/portal` (plus optional `settings/bootstrap`).

These rules keep operational data to active staff, prevent employees from self-promoting to admin, and allow only the owner email (and later approved admins) to manage approvals. Review rules against any other app sharing this Firebase project before replacing them.

## 4. Bootstrap the first administrator

There is no public “make me admin” button for random emails. Employees stay pending until an administrator approves them in the **Admin Portal** (`/admin`).

**Owner account already wired in this project**

- Email: `PGBOSS07@GMAIL.COM` (stored lowercase in rules / app as `pgboss07@gmail.com`)
- Firebase Auth account was created for that email (UID `R7JyREMBvSgwFPdw97SU7SSrQKz2`)
- Password is **not** stored in GitHub or website files — use the password you chose
- When this email signs in, the app + rules promote it to `role: admin` / `status: active` **after Firestore exists and rules are published**

**Finish activation (do this once)**

1. Create Firestore (section 3) and publish `firestore.rules`.
2. Open the live site (or local) staff portal **or** `/admin`.
3. Sign in with `PGBOSS07@GMAIL.COM` and your password.
4. If you see “Retry saving my profile”, click it. Firestore → `users` → that UID should show `role: admin`, `status: active`.
5. Use **Admin Portal** (`/admin`) → Approvals for other employees.

**If the Auth user exists but the profile is wrong**

1. Authentication → Users → confirm the owner email / UID.
2. Firestore → `users` → document ID = UID → set `role` = `admin`, `status` = `active`.
3. Sign out and sign in again at `/admin`.

Do not loosen the rules so that every new signup can become admin.

## 5. Publish with Firebase Hosting

The repository includes `firebase.json` pointing Hosting to `dist/public`; this is the Vite build output and excludes the older React/server source. From the repository root on a trusted computer:

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

Check the deployment output for the `https://aj-travels-7ae50.web.app` address, then open it over HTTPS and verify sign-in, an approved account, creating a synthetic enquiry, selecting it to create a booking, report filters and both downloads. If using a custom domain, add/confirm that domain in Firebase Authentication's authorized domains and verify the HTTPS certificate before sharing it with employees.

The prepared Hosting config does not itself deploy anything. No Firebase Console login or deployment is performed by this guide. Keep Firebase Console project access controlled. The rules file applies to the whole Firestore database; review other apps/collections before deploying it. If you do **not** intend to change Firestore permissions yet, deploy only Hosting with `firebase deploy --only hosting` and review the rules separately first.

## 6. Free-tier and offline boundaries

Firebase lists a no-cost Spark plan with, as checked on **5 November 2026**, Hosting allowance up to **10 GB stored** and **360 MB/day transferred**; Cloud Firestore allowance up to **1 GiB stored**, **50,000 reads/day**, **20,000 writes/day**, **20,000 deletes/day** and **10 GiB/month network egress**. Limits apply to the Firebase project, and providers can change quotas or terms; check the official pricing page before relying on a free tier. There is no promise that usage remains free if quotas or plan requirements are exceeded. This browser-authenticated employee portal is not a substitute for backups or data-retention planning.

The service worker caches the static app shell only. Authentication, Firestore data, staff details, passenger information, fares and customer records are **not** cached for offline access. Reconnect to use the portal and exports.

Excel/PDF export libraries are loaded from pinned jsDelivr URLs only when an export is requested. If that CDN is blocked, or the device is offline, record management remains available after the app has loaded but downloads will fail; for a restricted company network, host reviewed copies of those libraries with the static app and update their script URLs.

## 7. Source files and future changes

The primary file for portal layout, interface logic, Firebase Auth/Firestore access, filters and downloads is `client/index.html`. The PWA settings live in `client/public/manifest.webmanifest` and `client/public/service-worker.js`; app branding is in `client/public/aj-mark.svg` and `client/public/aj-mark-*.png`. Access permissions live in `firestore.rules`. Hosting/project connection are described by `firebase.json` and `.firebaserc`. Update `HOSTING-GUIDE.md` and this file when the setup changes.

GitHub stores the source; Firebase Hosting serves the app. Push the complete source repository (not `node_modules/`, build output, personal Firebase credentials, service-account keys or customer data). Firestore is an external service; pushing a code change to GitHub alone does not publish it or change its rules.

## Official references

- [Firebase JavaScript SDK: alternate CDN setup](https://firebase.google.com/docs/web/alt-setup) — CDN is an available setup option for special requirements; the documented modular SDK CDN is `gstatic`.
- [Firebase JavaScript SDK release notes](https://firebase.google.com/support/release-notes/js) — version 13.1.0 is listed on 21 October 2026; this version is pinned in the browser scripts.
- [Firebase Authentication: email/password](https://firebase.google.com/docs/auth/web/password-auth) — enable the provider in Console; password policy and email-enumeration protection recommendations.
- [Firestore role-based access control](https://firebase.google.com/docs/firestore/solutions/role-based-access) — authenticated role-based rule patterns and limitations.
- [Firestore transactions and batched writes](https://firebase.google.com/docs/firestore/manage-data/transactions) — atomic related writes and `getAfter()` rule checks.
- [Firebase Hosting quickstart](https://firebase.google.com/docs/hosting/quickstart) — static public root, `firebase.json` and deploy workflow.
- [Firebase pricing](https://firebase.google.com/pricing) — current product-level no-cost limits and plan details; recheck before launch.
- [MDN: ServiceWorkerContainer.register](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/register) — secure-context and same-origin requirements for PWA service workers.
