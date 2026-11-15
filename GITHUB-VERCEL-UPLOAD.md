# AJ Tours & Travel - Production Deployment & User Guide

This guide provides everything you need to know about the updated portal, the fixes applied, the exact files to upload to GitHub, and step-by-step instructions for Vercel and Firebase.

---

## 1. What Was Fixed & Restored

### A. UI Restored to Authentic Design
- The layout, color scheme, sidebar navigation, typography, cards, tables, and modal system have been **restored to your original authentic design**.
- All requested features were cleanly integrated into the existing design language without altering the portal's original visual identity.

### B. JavaScript Crash (`ReferenceError: u is not defined`) Fixed
- **Root Cause**: The row actions inside `MyBookings.dataRows` and `Inquiries.rows` referenced an undeclared `u.role` in template literals.
- **Fix**: Replaced with safe `Auth.getUser()?.role === 'admin'`. Both tables now render cleanly with zero JavaScript errors.

### C. Firestore `Missing or insufficient permissions` Fixed
- **Root Cause**: Firebase collection listeners (`onSnapshot` on `users`, `inquiries`, `bookings`) fail completely if the Firestore security rules reject reads for non-admin accounts or missing fields.
- **Fix**: `firestore.rules` updated so authenticated staff can read collections. Data isolation is strictly enforced in `Storage.getInquiries()` and `Storage.getBookings()`:
  - **Regular Employees** only see their own inquiries and bookings.
  - **Boss / Admin** sees all company records with employee filtering and reassignment.

### D. `favicon.jpg` 404 Fixed
- Copied `favicon.jpg` directly into `client/public/favicon.jpg` and `dist/public/favicon.jpg`.

---

## 2. All 5 Feature Sets Fully Implemented

1. **Access Control & Strict Data Isolation**:
   - Non-admin staff only see inquiries/bookings created by or assigned to them.
   - Boss/Admin portal has complete company-wide access.
   - Complete portal separation: "Staff Travel Desk" removed from Boss/Admin sidebar. Employees cannot see or access Admin portal links.
   - Password visibility eye toggle (`👁`) on Login, Signup, and Settings modals.
   - Permanent Account Deletion with mandatory typing of `DELETE` in confirmation modal.

2. **Profile & 200+ World Currencies**:
   - Profile displays: Name, Rank, Permanent locked UID (`AJ-EMP-XXXX`), Email, and masked Password.
   - Modal to edit Name and Email. Permanent UID remains locked.
   - Currency selector with 200+ world currencies (Flag, Code, Symbol, Currency Name) with live search and immediate app-wide persistence.

3. **Boss / Admin Portal Features**:
   - **Employee Management**: View all staff, Approve/Reject pending registrations, Activate/Deactivate accounts, Edit ranks and roles, and trigger Password Reset emails.
   - **Global Records**: Filter inquiries and bookings by Employee, Date Range, Status, and Destination.
   - **Reassign Records**: Admin can reassign any inquiry or booking to any team member.
   - **Audit / Activity Log**: Tracks logins, inquiry creations, reassignments, profile updates, and account deletions.
   - **Employee Performance Matrix**: Built into Reports with conversion rates, totals, and sales revenue.

4. **Employee Portal Features**:
   - **Status Workflow Stepper**: `New` → `Contacted` → `Quote Sent` → `Follow-up` → `Booked` / `Lost` with timestamped history.
   - **Follow-up Reminders**: Highlighted alert cards on Dashboard for "Due Today" and "Overdue" follow-ups.
   - **Duplicate Inquiry Warning**: Real-time detection when entering an existing customer phone or email.
   - **Structured Passenger & Fare Details**: Built into inquiry and booking workflows.

5. **General UX**:
   - Clean confirmation modals for all destructive actions.
   - Non-blocking toast notifications.
   - Fully responsive on desktop, tablet, and mobile.

---

## 3. Which Files to Upload to GitHub

You should upload the contents of this folder (`AJ-Tours-Travel-GitHub-Upload`):

```text
AJ-Tours-Travels/                    ← Repo Root (DO NOT nest inside subfolders)
├── client/
│   ├── index.html                   ← The complete portal (Authentic UI + all features)
│   └── public/
│       ├── favicon.jpg              ← Portal favicon
│       ├── aj-mark.svg
│       ├── aj-mark-192.png
│       ├── aj-mark-512.png
│       ├── manifest.webmanifest
│       └── service-worker.js
├── dist/
│   └── public/                      ← Pre-built static bundle
├── scripts/
│   └── prepare-vercel.mjs           ← Vercel deployment builder
├── shared/
│   └── currencies.json              ← 209 world currencies database
├── firestore.rules                  ← Firestore Security Rules (publish to Firebase)
├── firebase.json                    ← Firebase configuration
├── vercel.json                      ← Vercel build & route rules
├── package.json                     ← Project configuration
├── .gitignore                       ← Git ignore rules
├── FIREBASE-SETUP.md
└── GITHUB-VERCEL-UPLOAD.md
```

> [!IMPORTANT]
> **Repo Root Structure**: Make sure `package.json`, `client/`, `scripts/`, and `vercel.json` are placed directly in the **root** of your GitHub repository, **NOT** inside a nested subfolder like `AJ Enquerie Portal/`.

---

## 4. Step-by-Step GitHub Upload Instructions

### Option A: Using Git CLI (Recommended)

1. Open PowerShell or Terminal in this folder:
   ```powershell
   cd "d:\PRIT\VS\04 A J Travesl protel\AJ-Tours-Travel-GitHub-Upload\AJ-Tours-Travel-GitHub-Upload"
   ```

2. Initialize Git (if not already a repository):
   ```powershell
   git init
   git branch -M main
   ```

3. Add your remote repository:
   ```powershell
   git remote add origin https://github.com/vasuki01-hub/AJ-Tours-Travels.git
   # If origin already exists, use:
   # git remote set-url origin https://github.com/vasuki01-hub/AJ-Tours-Travels.git
   ```

4. Stage and commit all files:
   ```powershell
   git add .
   git commit -m "Production release: restored authentic UI, fixed reference error, updated firestore rules, added full feature set"
   ```

5. Push to GitHub:
   ```powershell
   git push -u origin main --force
   ```

---

### Option B: Using GitHub Web Interface (Drag & Drop)

1. Open your repository on GitHub: `https://github.com/vasuki01-hub/AJ-Tours-Travels`
2. If there is an old folder named `AJ Enquerie Portal`, delete it so the root is clean.
3. Click **Add file** → **Upload files**.
4. Drag and drop the following items from this folder directly into the web page:
   - `client/`
   - `dist/`
   - `scripts/`
   - `shared/`
   - `firestore.rules`
   - `firebase.json`
   - `vercel.json`
   - `package.json`
   - `.gitignore`
   - Documentation `.md` files
5. Commit directly to the `main` branch.

---

## 5. Critical Step: Update Firestore Rules in Firebase Console

> [!CAUTION]
> Uploading `firestore.rules` to GitHub does **not** automatically apply them to your Firebase database. You must publish them in the Firebase Console:

1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Select your project: **`aj-travels-7ae50`**.
3. In the left navigation, click **Firestore Database** → open the **Rules** tab.
4. Copy the entire content of [`firestore.rules`](./firestore.rules) and paste it into the editor.
5. Click **Publish**.

This immediately eliminates the `Missing or insufficient permissions` error for all staff members.

---

## 6. Firebase Authorized Domains Check

1. In the Firebase Console, go to **Authentication** → **Settings** tab → **Authorized domains**.
2. Ensure both of your Vercel domains are listed:
   - `aj-enquiry-portal.vercel.app`
   - `aj-tours-travels-pi.vercel.app`
3. If either is missing, click **Add domain** and enter it.

---

## 7. Vercel Project Settings Verification

In your [Vercel Dashboard](https://vercel.com/):
1. Select your project (`aj-enquiry-portal`).
2. Go to **Settings** → **General**:
   - **Framework Preset**: Other / None
   - **Root Directory**: leave empty or `.` (repo root)
   - **Build Command**: `node scripts/prepare-vercel.mjs` (automatically picked from `vercel.json`)
   - **Output Directory**: `dist/public` (automatically picked from `vercel.json`)
3. When you push to GitHub, Vercel will automatically build and deploy in ~10 seconds.
4. You can also click **Deployments** → click the three dots (`...`) on the latest commit → **Redeploy**.

---

## 8. Verifying Your Live Portal

Once deployed:
1. Open your live URL (e.g. `https://aj-enquiry-portal.vercel.app/`).
2. Press `F12` and open the **Console** tab.
3. Verify:
   - Zero `Uncaught ReferenceError` errors.
   - Zero `Firestore listen failed` permission errors.
   - Zero `404 favicon.jpg` errors.
4. Log in as Boss/Admin (`pgboss07@gmail.com`):
   - You will see the authentic clean UI.
   - Sidebar includes: Dashboard, Inquiries, Bookings, Customers, Reports, Employees, Audit Logs, Settings.
   - "Staff Travel Desk" link is not in the Admin navigation.
5. Log in as Employee:
   - You will see the authentic clean UI with personal dashboard.
   - Data isolation: only personal inquiries and bookings appear.
   - Admin links are not visible or accessible.
   - Follow-up alerts, duplicate warning, and status stepper function smoothly.
