import React, { Suspense } from 'react';
import { useSelector } from 'react-redux';
import { getGame } from '../features/games/registry';
import { Loader2 } from 'lucide-react';

export default function RaceRoomPage() {
  const gameId = useSelector((state) => state.race.gameId) || 'classic-race';
  const game = getGame(gameId);
  const ScreenComponent = game.Component;

  return (
    <Suspense
      fallback={
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-fg/60">
          <Loader2 className="w-8 h-8 animate-spin text-accent mb-3" />
          <p className="text-sm font-medium">Loading {game.name}...</p>
        </div>
      }
    >
      <ScreenComponent />
    </Suspense>
  );
}
