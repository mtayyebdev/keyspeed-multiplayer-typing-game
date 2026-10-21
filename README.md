# KeySpeed v1

A modern, full-stack, real-time multiplayer competitive typing game and solo practice platform. Racers compete on identical paragraphs with server-synchronized start times, sub-150ms progress tracking, bot backfill, and strict anti-cheat verification.

---

## 🚀 Tech Stack

### Frontend (`typearena-frontend`)
- **React 18** + **Vite** (Plain JavaScript, `.jsx` / `.js`)
- **Tailwind CSS** (Dark default, neon cyan & violet accents, glassmorphism)
- **Redux Toolkit** with **RTK Query**
- **React Router v6**
- **socket.io-client**
- **Framer Motion** (Page transitions, animated 3-2-1-GO countdown, smooth lane cars)
- **canvas-confetti** (1st place celebratory effect)
- **ESLint** & **Prettier**

### Backend (`typearena-backend`)
- **NestJS 10** (TypeScript)
- **MongoDB** with **Mongoose**
- **Socket.io** (`@nestjs/websockets`, `@nestjs/platform-socket.io`)
- **JWT Authentication** (`@nestjs/jwt`, `Passport-jwt`)
- **bcrypt** password hashing
- **class-validator** & **class-transformer** for DTO validation
- **Swagger Documentation** at `/api/docs`
- **Jest** unit tests for WPM calculation and anti-cheat

---

## 📦 Directory Structure

```
typing-arena/
├── docker-compose.yml           # Local MongoDB service
├── NOTES.md                     # Architecture assumptions & notes
├── README.md                    # Setup & documentation
├── typearena-backend/           # NestJS TypeScript backend
│   ├── src/
│   │   ├── auth/                # JWT auth, register, login, Passport strategy
│   │   ├── common/              # Filters, guards, decorators
│   │   ├── games/               # Pure WPM, accuracy, anti-cheat functions & tests
│   │   ├── leaderboard/         # Top 20 alltime & daily aggregation
│   │   ├── races/               # Race & RaceResult schemas and persistence
│   │   ├── realtime/            # Socket gateway (/race), rooms, matchmaking, bots
│   │   ├── solo/                # Server-verified solo test submission
│   │   ├── texts/               # 30+ original seeded paragraphs & random selector
│   │   ├── users/               # Racer profile & statistics
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── test/
│   ├── .env.example
│   └── tsconfig.json
└── typearena-frontend/          # React 18 + Vite frontend
    ├── src/
    │   ├── app/                 # Redux store, baseApi (RTK Query), socketMiddleware
    │   ├── components/          # RaceTrack, CountdownOverlay, TypingEngine, ResultsModal
    │   ├── features/            # auth, solo, race, leaderboard, profile slices & APIs
    │   ├── pages/               # Home, Solo, Lobby, RaceRoom, Leaderboard, Profile, Login/Register
    │   ├── routes/              # React Router configuration & ProtectedRoute
    │   └── lib/
    ├── .env.example
    ├── tailwind.config.js
    └── vite.config.js
```

---

## ⚡ Quick Start

### 1. Start MongoDB
You can start MongoDB using Docker Compose:
```bash
docker compose up -d
```
Or start a local MongoDB instance listening on `mongodb://127.0.0.1:27017/keyspeed`.

---

### 2. Run Backend
```bash
cd typearena-backend
npm install
npm run dev
```
- Server starts at: `http://localhost:3001`
- REST API prefix: `http://localhost:3001/api`
- Interactive Swagger API docs: `http://localhost:3001/api/docs`

#### Run Backend Unit Tests:
```bash
npm test
```

---

### 3. Run Frontend
```bash
cd typearena-frontend
npm install
npm run dev
```
- Client runs at: `http://localhost:5173`

---

### 🚀 Production Deployment
For production deployment, you can spin up the full stack (Frontend, Backend, and MongoDB) in one command:
```bash
docker compose up -d --build
```
For complete production deployment guides (Docker, Vercel + Render + MongoDB Atlas, PM2 + Nginx, SSL setup), see [DEPLOYMENT.md](file:///media/Data/My%20Projects/typing%20arena/DEPLOYMENT.md).

---

## 🎮 Game Features & Architecture

1. **Server is Source of Truth**:
   - The server computes all WPM, accuracy, and position metrics.
   - Client sends character progress indexes and final typed strings; client WPM is never trusted.

2. **Typing Engine (Smooth Keystrokes)**:
   - Uses direct DOM element refs and a hidden input (no React state per keystroke) to guarantee zero latency at high typing speeds.
   - Real-time animated caret, emerald green matching characters, rose red incorrect characters with subtle shake.

3. **Multiplayer Matchmaking & Smart Bot Backfill**:
   - Public queue matches live racers into 2-4 player rooms.
   - If fewer than 2 players join within 8 seconds, bots with realistic usernames backfill the race.
   - Bot speed dynamically calibrates to human player's average WPM (+/- 15%) with realistic typing pauses.

4. **Synchronized Race Starts**:
   - Server provides an epoch timestamp (`startAt`) along with a synchronized 3-2-1-GO animated countdown.
   - Client estimates network clock offset via a connection ping.

5. **Private Rooms**:
   - Generate unique 6-character room codes.
   - Friends can join with the code; host controls race launch.

6. **Anti-Cheat Verification**:
   - Runs exceeding sustained 250 WPM are rejected.
   - Jumps of greater than 15 characters between consecutive progress updates are rejected.
   - Flagged runs are excluded from leaderboards.

7. **Leaderboard & Profile**:
   - All-time and daily Top 20 leaderboards.
   - Racer profile tracking Best WPM, Average WPM, Total Races, Wins, and last 10 match history.

---

## 🛡️ Admin Dashboard (`/admin`)

KeySpeed includes a comprehensive, full-featured administration dashboard accessible to users with the `admin` role.

### 1. Seed Admin User
An administrative user can be seeded or promoted at any time via:
```bash
cd typearena-backend
npm run seed:admin
```
- **Default Email**: `admin@keyspeed.com` (configurable via `ADMIN_EMAIL` in `typearena-backend/.env`)
- **Default Password**: `AdminPass123!` (configurable via `ADMIN_PASSWORD` in `typearena-backend/.env`)
- **Username**: `@admin`

### 2. Accessing the Dashboard
- **Login**: There is no separate login portal. Log in via standard `/login`.
- **Navigation**: Users with `role: 'admin'` will automatically see an **Admin** link with a shield icon in the top navbar.
- **Direct Route**: Navigate directly to `http://localhost:5173/admin`.
- **Security**: All `/api/admin/*` endpoints are protected by `JwtAuthGuard` and `RolesGuard`. Unauthorized attempts return `403 Forbidden`, and unauthenticated users are redirected to `/login`.

### 3. Dashboard Modules
1. **Overview (`/admin`)**: Real-time KPI stat cards (Total Users, Total Races, Avg WPM, Active Bans), Recharts line and bar graphs (user signups, race volume, WPM distribution, mode split) with 7d/30d/90d filters, and quick widgets for newest users, flagged runs, and recent audit activity.
2. **Users Management (`/admin/users` & `/admin/users/:id`)**: Server-paginated table with search by username/email, role and status filtering, CSV export, role modification, ban/unban with required reason, statistics reset, force logout (token revocation), account deletion, and detailed user drawer with recent race results and audit history.
3. **Races Management (`/admin/races`)**: Paginated race records with filters by mode (solo/multiplayer/private), bot presence, and flagged status. Detailed drawer shows all racer lanes, speed, accuracy, and text snippet. Includes safe race deletion with automatic participant statistics recalculation.
4. **Flagged Results Review (`/admin/flagged`)**: Dedicated queue for runs triggered by the anti-cheat engine (>250 WPM, >15 char jumps). Side-by-side comparison with racer's historical average. One-click actions: Approve Result, Reject Result, or Reject & Ban User.
5. **Texts Library (`/admin/texts`)**: Complete CRUD for practice texts. Automatic word and character calculation, difficulty tag assignment, live typing arena preview, active toggle, and bulk import with CSV/JSON validation preview.
6. **Leaderboard Management (`/admin/leaderboard`)**: Tabbed views for all-time and daily leaderboards. Remove suspicious entries directly (automatically flags the underlying result), reset daily rankings, or trigger an asynchronous recalculation of all player stats.
7. **Live Monitoring (`/admin/live`)**: Real-time Socket.io monitoring on dedicated `/admin` namespace. Displays active rooms, connected racers, bot ratio, and matchmaking queue status. Administrators can inspect live room lanes, force-close abandoned rooms, or disconnect disruptive racers.
8. **Game Settings (`/admin/settings`)**: Runtime cached configuration stored in MongoDB with validation ranges. Adjust countdown duration, max allowed WPM threshold, bot backfill delay, bot difficulty variance, enable maintenance mode, or toggle new user registration without server restarts.
9. **Announcements (`/admin/announcements`)**: Broadcast announcements across the application. Configure info/warning/success types, start/end scheduling, and dismissibility. Active announcements render immediately on public pages.
10. **Audit Log (`/admin/audit`)**: Append-only, tamper-proof audit trail tracking every administrative mutation (user bans, role changes, settings updates, text modifications). Includes admin identity, IP address, timestamp, action type, and drawer to inspect previous and updated state JSON payloads.

### 4. Design & Theme Compliance
- Strict adherence to the 3-color theme system (`midnight`, `light`, `terminal`, `sand`).
- Zero hardcoded colors, gradients, or glows.
- Recharts visualizations dynamically bind to runtime theme CSS variables (`--bg`, `--fg`, `--accent`, `--border`, `--surface`) using `getComputedStyle`.


