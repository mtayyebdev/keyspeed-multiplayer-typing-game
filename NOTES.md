# KeySpeed v1 - Project Notes & Assumptions

## Architecture & Stack Decisions
- **Stack compliance**:
  - Frontend: React 18 + Vite, plain JavaScript (ESM, `.jsx` and `.js`), Tailwind CSS, Redux Toolkit with RTK Query, React Router v6, socket.io-client, Framer Motion.
  - Backend: NestJS (TypeScript), MongoDB with Mongoose, `@nestjs/websockets` with Socket.io, JWT auth with Passport, `class-validator` / `class-transformer` for DTOs, `bcrypt` for password hashing, Swagger documentation at `/api/docs`.
  - Local dev: Root `docker-compose.yml` for MongoDB on port 27017. Both backend and frontend have `.env` and `.env.example`.

## Additional Libraries Noted (as required by section 10):
- `canvas-confetti`: Lightweight canvas confetti library to fulfill the requirement: *"Results screen: animated position badge, WPM count-up animation, confetti for first place."*
- `lucide-react`: Modern SVG icon set for game UI elements (cars, keyboard, trophies, profile, audio/visual cues) keeping the UI polished and clean.
- `recharts`: Lightweight React charting library used in the Admin Dashboard for signups, race volume, WPM distribution, and mode split charts. Follows strict CSS variable styling (`var(--accent)`, `var(--fg)`, `var(--border)` via `getComputedStyle`) to adhere to the 3-color theme system.
- **Car Race Addition (Zero New NPM Libraries)**: No new npm packages were added for the Car Race game. Visuals are powered by:
  - **Pseudo-3D Canvas 2D Engine**: OutRun / classic arcade behind-the-car perspective projection drawn entirely on HTML5 Canvas 2D with requestAnimationFrame. Zero Three.js or 3D libraries.
  - **Parallax Background**: Sunset sky gradient, clouds, distant mountain silhouettes, and rolling hills shifting horizontally with road curves and camera travel speed.
  - **Deterministic Track Seeding**: Track curvature and hills generated deterministically from `textId`/text hash (all players see the exact same road layout).
  - **Procedural Car Fallback**: High-detail vector rear-view sports car (bodywork, high-downforce spoiler, tinted rear window, diffuser, exhaust tips, taillights/brake lights) renders if PNG sprites in `public/assets/cars/` are absent.
  - **Rear-View Mirror**: Top-mounted high-contrast mirror rendering trailing competitors with distance markers (`-Xm`) and headlights.
  - **Dynamic State-Driven FX**: Dual exhaust flames scaling with speed (>100 km/h), peripheral speed lines (>170 km/h), camera shake on stall, smoke particle puffs on stall, and red flash vignette.
  - **Dual Mode**: Includes an instantaneous toggle between "3D View" and "2D Lite" (the classic side-view track) for ultra low-power devices.
  - **Motion Accessibility**: Automatically respects `prefers-reduced-motion` (disables shake, speed lines, and heavy particles).
  - **Audio**: Native browser Web Audio API oscillator synthesis for dynamic engine pitch and acoustics.

## Design Decisions & Assumptions
- **Clock Synchronization**: The server emits `startAt` (timestamp in ms). On initial connection or lobby join, the client sends a lightweight ping and receives server timestamp to estimate `clockOffset = serverTime - clientTime + rtt/2`.
- **WPM Calculation**: Standard typing formula: `WPM = (charactersTyped / 5) / (durationInMinutes)`. Accuracy = `(correctCharacters / totalCharactersTyped) * 100`. Server validates text length and time elapsed.
- **Anti-Cheat Rules**:
  - Sustained WPM > 250 rejected.
  - Progress leap > 15 characters between two consecutive events (within <= 150ms window) rejected.
  - Runs violating these are marked `flagged: true` and omitted from the leaderboard.
- **Bot Behavior**: Bots simulate typing with player's avg WPM +/- 15% with realistic keystroke delays and small random pauses. Bots have human-like names (e.g., `SpeedyFox`, `CyberTyper`, `TurboKeys`).
- **Memory Room Storage**: `RoomService` keeps active rooms in memory via JavaScript `Map`. A clear comment marks the Redis migration boundary for v2.
- **Solo Practice Filters**: Solo practice supports dynamic difficulty filtering (`easy`, `normal`, `hard`) and length selection (`short`, `medium`, `long`) via query parameters on `GET /api/texts/random`.
- **Countdown Overlay & Input Focus**: 3-2-1-GO overlay auto-dismisses after 700ms on "GO!" to transition cleanly into the race. Typing input uses an invisible overlay covering the card area so physical clicks and keystrokes register instantly.


