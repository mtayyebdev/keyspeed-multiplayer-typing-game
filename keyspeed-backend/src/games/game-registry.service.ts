import { Injectable, Logger } from '@nestjs/common';
import { GameEngine } from './game-engine.interface';
import { ClassicRaceEngine } from './classic-race.engine';
import { CarRaceEngine } from './car-race/car-race.engine';

export interface GameMetadata {
  id: string;
  name: string;
  minPlayers: number;
  maxPlayers: number;
}

@Injectable()
export class GameRegistryService {
  private readonly logger = new Logger(GameRegistryService.name);
  private readonly engines = new Map<string, GameEngine>();
  private readonly metadata = new Map<string, GameMetadata>();

  constructor(
    private readonly classicRaceEngine: ClassicRaceEngine,
    private readonly carRaceEngine: CarRaceEngine,
  ) {
    this.registerEngine('classic-race', this.classicRaceEngine, {
      id: 'classic-race',
      name: 'Classic Race',
      minPlayers: 2,
      maxPlayers: 4,
    });

    this.registerEngine('car-race', this.carRaceEngine, {
      id: 'car-race',
      name: 'Car Race',
      minPlayers: 2,
      maxPlayers: 4,
    });

    this.logger.log(`Initialized GameRegistryService with ${this.engines.size} games.`);
  }

  registerEngine(id: string, engine: GameEngine, meta: GameMetadata) {
    this.engines.set(id, engine);
    this.metadata.set(id, meta);
  }

  getEngine(gameId?: string): GameEngine {
    if (!gameId) {
      return this.classicRaceEngine;
    }
    const engine = this.engines.get(gameId);
    if (!engine) {
      this.logger.warn(`Game engine '${gameId}' not found. Falling back to 'classic-race'.`);
      return this.classicRaceEngine;
    }
    return engine;
  }

  getCarRaceEngine(): CarRaceEngine {
    return this.carRaceEngine;
  }

  getClassicRaceEngine(): ClassicRaceEngine {
    return this.classicRaceEngine;
  }

  getAllGames(): GameMetadata[] {
    return Array.from(this.metadata.values());
  }

  hasGame(gameId: string): boolean {
    return this.engines.has(gameId);
  }
}
