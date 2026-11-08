import { lazy } from 'react';
import { Flag, Car } from 'lucide-react';

export const GAMES = [
  {
    id: 'classic-race',
    name: 'Classic Race',
    shortDescription: 'The original competitive typing race. Type with precision to finish first.',
    description: 'Race against up to 3 opponents in a clean, high-intensity keyboard battle. Progress is measured by characters typed with fair Net WPM ranking.',
    icon: Flag,
    minPlayers: 2,
    maxPlayers: 4,
    badge: 'Classic',
    Component: lazy(() => import('./classic-race/ClassicRaceScreen')),
  },
  {
    id: 'car-race',
    name: 'Car Race',
    shortDescription: 'Real-time racing physics. Fast typing accelerates; typos cause engine stalls!',
    description: 'Real-time side-view motorsport racing! Your typing rate powers your racing engine up to 320+ km/h. Stop-on-error rules: mistakes trigger an engine stall penalty.',
    icon: Car,
    minPlayers: 2,
    maxPlayers: 4,
    badge: 'New',
    Component: lazy(() => import('./car-race/CarRaceScreen')),
  },
];

export const DEFAULT_GAME_ID = 'classic-race';

export function getGame(id) {
  return GAMES.find((g) => g.id === id) || GAMES[0];
}

export function getAllGames() {
  return GAMES;
}
