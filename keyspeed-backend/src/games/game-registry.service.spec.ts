import { GameRegistryService } from './game-registry.service';
import { ClassicRaceEngine } from './classic-race.engine';
import { CarRaceEngine } from './car-race/car-race.engine';

describe('GameRegistryService', () => {
  let registry: GameRegistryService;
  let classicEngine: ClassicRaceEngine;
  let carEngine: CarRaceEngine;

  beforeEach(() => {
    classicEngine = new ClassicRaceEngine();
    carEngine = new CarRaceEngine();
    registry = new GameRegistryService(classicEngine, carEngine);
  });

  it('registers classic-race and car-race by default', () => {
    const allGames = registry.getAllGames();
    expect(allGames.length).toBe(2);
    expect(allGames.map((g) => g.id)).toEqual(['classic-race', 'car-race']);
  });

  it('retrieves classic-race engine by default when gameId is omitted or unknown', () => {
    expect(registry.getEngine()).toBe(classicEngine);
    expect(registry.getEngine('unknown-game')).toBe(classicEngine);
  });

  it('retrieves car-race engine when car-race is requested', () => {
    expect(registry.getEngine('car-race')).toBe(carEngine);
  });

  it('verifies hasGame check', () => {
    expect(registry.hasGame('car-race')).toBe(true);
    expect(registry.hasGame('classic-race')).toBe(true);
    expect(registry.hasGame('future-race')).toBe(false);
  });
});
