import { Injectable } from '@nestjs/common';

const BOT_NAMES = [
  'TurboTyper',
  'SpeedyFox',
  'CyberRacer',
  'QuantumKey',
  'NeonDrifter',
  'PixelDash',
  'VelocityPrime',
  'ApexKeys',
  'NovaRider',
  'HyperStroke',
];

export interface BotPlayer {
  id: string;
  userId: null;
  username: string;
  isBot: true;
  progress: number;
  wpm: number;
  accuracy: number;
  targetWpm: number;
  charsTyped: number;
  finished: boolean;
  position?: number;
  intervalTimer?: NodeJS.Timeout;
}

@Injectable()
export class BotService {
  createBot(targetAvgWpm: number = 40, usedNames: Set<string> = new Set()): BotPlayer {
    const availableNames = BOT_NAMES.filter((name) => !usedNames.has(name));
    const username =
      availableNames.length > 0
        ? availableNames[Math.floor(Math.random() * availableNames.length)]
        : `Bot_${Math.floor(100 + Math.random() * 900)}`;

    usedNames.add(username);

    // Variation of plus or minus 15 percent
    const variation = (Math.random() * 0.3 - 0.15); // -0.15 to +0.15
    const baseWpm = targetAvgWpm > 0 ? targetAvgWpm : 40;
    const computedWpm = Math.max(25, Math.round(baseWpm * (1 + variation)));

    const botId = `bot_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    return {
      id: botId,
      userId: null,
      username,
      isBot: true,
      progress: 0,
      wpm: 0,
      accuracy: Math.round(92 + Math.random() * 7), // 92% to 99%
      targetWpm: computedWpm,
      charsTyped: 0,
      finished: false,
    };
  }
}

