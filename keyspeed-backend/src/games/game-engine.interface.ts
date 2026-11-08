export interface PlayerProgress {
  id: string;
  username: string;
  progress: number;
  wpm: number;
  accuracy?: number;
  isBot?: boolean;
  finished?: boolean;
  position?: number;
  speed?: number; // km/h
  state?: 'running' | 'stalled' | 'idle' | 'finished';
  topSpeed?: number;
  avgSpeed?: number;
  stalls?: number;
  errors?: number;
  durationMs?: number;
  netWpm?: number;
}

export interface GameEngineState {
  roomId: string;
  text: string;
  startAt: number;
  players: Map<string, PlayerProgress>;
}

export interface GameEngine {
  calculateProgress(
    player: PlayerProgress,
    newIndex: number,
    textLength: number,
    elapsedMs: number,
  ): PlayerProgress;

  calculateFinalScore(
    player: PlayerProgress,
    originalText: string,
    typedText: string,
    durationMs: number,
  ): {
    wpm: number;
    accuracy: number;
    errors: number;
    isFlagged: boolean;
  };
}

