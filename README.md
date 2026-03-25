# 🍁 TimApp — Attendance Tracker

A challenge project developed for **Professor Timothy Wong**'s class. TimApp is a full-stack **Progressive Web App (PWA)** for tracking attendance at corporate events — users scan in via QR code, hosts manage events and pull reports. For the best experience testing the full flow, open the user view on your computer to display your QR code and the host view on your phone, so you can use the camera to scan it.

**Live:** [andrejoaoborges.com](https://andrejoaoborges.com)

> **Note:** The app is pre-loaded with sample data — a set of realistic events spread across the current week, plus 25 mock users with attendance history — so you can explore all features right away without setting anything up.

---

## How to Use

### As a User (attendee)

1. Go to [andrejoaoborges.com](https://andrejoaoborges.com) and sign in with Google or a magic link sent to your email.
2. After login you land directly on your **QR Code** page — a personal 7-character code unique to your account.
3. Show the QR code to the host to register your attendance at an event.
4. Use the bottom navigation to explore:
   - **Profile** — your QR code
   - **Calendar** — weekly view of events, color-coded by type, with your attendance marked
   - **Attendance** — your full attendance history
   - **Dashboard** — summary stats

---

### As a Host

> **Demo credentials**
> **Email:** `host@example.com`
> **Password:** `password123`

1. Go to [andrejoaoborges.com/host/login](https://andrejoaoborges.com/host/login) and sign in with the credentials above.
2. You land on the **Scan** page — select the active event and point the camera at a user's QR code to register their attendance.
3. If the camera isn't convenient, switch to the **Manual** tab and type in the 7-character code directly.

**Host portal sections:**

| Section | What it does |
|---|---|
| **Scan** | QR camera scanner + manual code entry. Auto-selects the currently active event. |
| **Events** | Browse events by day, filter by type, create new events. |
| **Reports** | Export an Excel workbook with 6 sheets of attendance analytics for any date range. |
| **Dashboard** | Overview stats — total events, total check-ins, active users. |

---

### Excel Report Sheets

When you export from the Reports page, the `.xlsx` file includes:

1. **All Events** — every event in the date range with attendance count
2. **By Event Type** — totals per type (Meeting, Interview, Workshop, Training, Conference, Other)
3. **By Day of Week** — attendance distribution Mon–Sat
4. **By Hour of Day** — hourly distribution 8am–9pm to identify peak times
5. **Top 10 Events** — the 10 most attended events in the period
6. **Daily Trend** — total attendances per calendar day

---

## Project Structure

```
timapp/
├── prisma/
│   ├── schema.prisma        # Database schema (User, Host, Event, Attendance)
│   ├── seed.ts              # Seeds hosts, 25 sample users, and a week of events
│   └── prod.db              # SQLite production database (on server)
│
├── src/
│   ├── app/
│   │   ├── (auth)/          # Public auth pages: /login, /host/login
│   │   ├── (user)/          # Protected user pages: profile, calendar, attendance, dashboard
│   │   ├── (host)/          # Protected host pages: scan, events, reports, dashboard
│   │   └── api/             # REST API routes: attendance, events, reports, host auth
│   │
│   ├── components/
│   │   ├── auth/            # Login forms (user + host)
│   │   ├── events/          # Event cards, badges, weekly calendar
│   │   ├── scan/            # QR scanner (ZXing), manual code input, result display
│   │   ├── profile/         # QR code display (react-qr-code)
│   │   ├── layout/          # Bottom nav (user), sidebar (host)
│   │   └── ui/              # shadcn/ui components
│   │
│   └── lib/
│       ├── auth.ts          # NextAuth config (Google + Resend magic link)
│       ├── host-auth.ts     # JWT-based host session (jose)
│       ├── prisma.ts        # Prisma client singleton
│       └── utils.ts         # Toronto timezone helpers, event type constants
│
├── .github/
│   └── workflows/
│       └── deploy.yml       # CI/CD pipeline
│
└── public/
    ├── icons/               # PWA icons (SVG + PNG)
    └── manifest.json        # PWA manifest
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, React 19) |
| Auth | NextAuth v5 — Google OAuth + Resend magic link (users), JWT cookies (hosts) |
| Database | SQLite via Prisma + better-sqlite3 |
| Styling | Tailwind CSS v4 + shadcn/ui |
| QR Scanning | ZXing browser library |
| QR Generation | react-qr-code |
| Excel Export | xlsx (SheetJS) |
| Email | Resend |
| PWA | @ducanh2912/next-pwa |

---

## Deployment

The app runs on a **Hetzner VPS** (2 vCPU, 2 GB RAM) served via **nginx** with **Let's Encrypt SSL** and kept alive with **PM2**.

CI/CD is handled by **GitHub Actions** (free, unlimited for public repos). On every push to `main`:

1. Installs dependencies and generates the Prisma client
2. Builds the Next.js app on the Actions runner (which has AVX2 — the server CPU does not, so builds must happen off-server)
3. SSHes into the server, wipes the old `.next` directory, and extracts the fresh build
4. Restarts the app with PM2

The database is SQLite and lives on the server's disk. It is not touched on deploy.

---

## Running Locally

```bash
npm install
npx prisma generate
npx prisma db push
npm run seed     # creates hosts, sample users, and a week of events
npm run dev
```

Create a `.env.local` file with:

```env
AUTH_SECRET=your-random-secret
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=noreply@yourdomain.com
DATABASE_URL=file:./prisma/dev.db
NEXTAUTH_URL=http://localhost:3000
AUTH_TRUST_HOST=true
```

---

## Author

Built by **André Borges** for the **Cybersecurity Capstone Project — CSAI-5505-0NA** course.
