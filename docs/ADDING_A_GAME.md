# Adding a New Game to KeySpeed

KeySpeed features a modular, pluggable game architecture. Adding a future multiplayer typing game requires only **one new folder per side (frontend and backend)** and **one registry entry each**.

---

## 1. Backend Integration (2 Simple Steps)

### Step 1.1: Create the Engine Folder
Create `keyspeed-backend/src/games/<your-game-id>/`:
- Implement the `GameEngine` interface (`game-engine.interface.ts`).
- Export your engine class (e.g., `FutureRaceEngine`).
- Implement `calculateProgress()` and `calculateFinalScore()`.

```typescript
// keyspeed-backend/src/games/my-game/my-game.engine.ts
import { Injectable } from '@nestjs/common';
import { GameEngine, PlayerProgress } from '../game-engine.interface';

@Injectable()
export class MyGameEngine implements GameEngine {
  readonly id = 'my-game';
  readonly name = 'My Custom Game';

  calculateProgress(player: PlayerProgress, newIndex: number, textLength: number, elapsedMs: number): PlayerProgress {
    // Custom progress calculations
    return { ...player, progress: Math.min(100, Math.round((newIndex / textLength) * 100)) };
  }

  calculateFinalScore(player: PlayerProgress, originalText: string, typedText: string, durationMs: number) {
    // Custom scoring calculations
    return { wpm: 60, accuracy: 100, errors: 0, isFlagged: false };
  }
}
```

### Step 1.2: Register in `GameRegistryService`
Open `keyspeed-backend/src/games/game-registry.service.ts` and add your engine:
```typescript
this.registerEngine('my-game', this.myGameEngine, {
  id: 'my-game',
  name: 'My Custom Game',
  minPlayers: 2,
  maxPlayers: 4,
});
```
Add `MyGameEngine` to `RealtimeModule` providers and exports.

---

## 2. Frontend Integration (2 Simple Steps)

### Step 2.1: Create the Screen Folder
Create `keyspeed-frontend/src/features/games/<your-game-id>/`:
- Create `MyGameScreen.jsx` as your primary game interface.
- Read match state from Redux `state.race`.
- Emit progress via `dispatch({ type: 'socket/raceProgress', payload: { roomId, index } })`.
- Finish race via `dispatch({ type: 'socket/raceFinish', payload: { roomId, typedText } })`.

### Step 2.2: Register in `registry.js`
Open `keyspeed-frontend/src/features/games/registry.js` and add an entry:
```javascript
{
  id: 'my-game',
  name: 'My Custom Game',
  shortDescription: 'One-line description of the gameplay mechanics.',
  description: 'Detailed description for modal or detail view.',
  icon: Sparkles, // from lucide-react
  minPlayers: 2,
  maxPlayers: 4,
  badge: 'New',
  Component: lazy(() => import('./my-game/MyGameScreen')),
}
```

---

## 3. How the System Handles the New Game Automatically

1. **Lobby Flow (`/lobby`)**: Step 2 (Choose Game) will automatically display your new game card with its icon, badge, description, and player limits.
2. **Matchmaking Separation**: Public queues are automatically partitioned by `gameId`. Racers in your game will only match with opponents in the same game.
3. **Dynamic Screen Loading**: When the race starts, `RaceRoomPage.jsx` dynamically mounts your lazy-loaded `Component`.
4. **Data Persistence**: `Race` and `RaceResult` MongoDB documents automatically tag results with `gameId`.
5. **Leaderboard & Profile**: Filterable tabs for the new game are available on the Leaderboard and Profile pages.
