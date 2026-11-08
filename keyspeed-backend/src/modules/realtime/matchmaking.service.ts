import { Injectable, Logger } from '@nestjs/common';
import { TextsService } from '../texts/texts.service';
import { RoomService, HumanPlayer, RoomState } from './room.service';
import { BotService } from './bot.service';
import { SettingsService } from '../admin/settings/settings.service';

@Injectable()
export class MatchmakingService {
  private readonly logger = new Logger(MatchmakingService.name);
  private queueTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    private readonly roomService: RoomService,
    private readonly textsService: TextsService,
    private readonly botService: BotService,
    private readonly settingsService: SettingsService,
  ) {}

  async handleQueueJoin(
    player: HumanPlayer,
    onMatchReady: (room: RoomState) => void,
    onQueueWaiting: (socketId: string) => void,
    gameId: string = 'classic-race',
  ): Promise<RoomState> {
    const settings = this.settingsService.getSettings();
    const maxPlayers = settings.maxPlayersPerRace || 4;
    const botWaitTimeSec = settings.botWaitTime ?? 8;
    const botWaitMs = botWaitTimeSec * 1000;
    const targetGameId = gameId || 'classic-race';

    // Check if there is an open public room waiting for players with matching gameId
    const openRooms = this.roomService
      .getAllRooms()
      .filter(
        (r) =>
          !r.isPrivate &&
          r.status === 'lobby' &&
          (r.gameId || 'classic-race') === targetGameId &&
          r.players.size < maxPlayers,
      );

    if (openRooms.length > 0) {
      const room = openRooms[0];
      room.players.set(player.id, player);
      this.logger.log(`Player ${player.username} joined existing open [${targetGameId}] room ${room.roomId}. (Total: ${room.players.size})`);

      // If room is now full, start immediately; otherwise notify player they are in queue
      if (room.players.size >= maxPlayers) {
        this.clearQueueTimer(room.roomId);
        onMatchReady(room);
      } else {
        onQueueWaiting(player.id);
      }
      return room;
    }

    // Otherwise create a new public room for this game
    const randomText = await this.textsService.getRandomText();
    const roomId = `room_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newRoom = this.roomService.createRoom(
      roomId,
      player,
      randomText._id.toString(),
      randomText.content,
      false,
      undefined,
      targetGameId,
    );

    this.logger.log(`Created new public [${targetGameId}] room ${roomId} for ${player.username}. Starting ${botWaitTimeSec}s matchmaking timer.`);
    onQueueWaiting(player.id);

    // Dynamic timer configured in admin settings
    const timer = setTimeout(() => {
      this.fillWithBotsAndStart(roomId, onMatchReady);
    }, botWaitMs);

    this.queueTimers.set(roomId, timer);
    return newRoom;
  }

  handleQueueLeave(socketId: string): { room?: RoomState; wasHost: boolean; emptied: boolean } {
    const room = this.roomService.getRoomByPlayerId(socketId);
    if (room && !room.isPrivate && room.status === 'lobby') {
      const result = this.roomService.removePlayer(socketId);
      if (result.emptied || room.players.size === 0) {
        this.clearQueueTimer(room.roomId);
      }
      return result;
    }
    return { wasHost: false, emptied: false };
  }

  private fillWithBotsAndStart(roomId: string, onMatchReady: (room: RoomState) => void) {
    const room = this.roomService.getRoom(roomId);
    if (!room || room.status !== 'lobby') {
      return;
    }

    // Determine target WPM based on human players' average
    const humanPlayers = Array.from(room.players.values()).filter(
      (p) => !p.isBot,
    ) as HumanPlayer[];

    if (humanPlayers.length === 0) {
      this.roomService.destroyRoom(roomId);
      return;
    }

    const settings = this.settingsService.getSettings();

    // Only backfill bots if bots are enabled in admin settings
    if (settings.botsEnabled) {
      const avgWpm =
        humanPlayers.reduce((acc, p) => acc + (p.avgWpm || 40), 0) /
        humanPlayers.length;

      const targetTotal = Math.max(2, Math.min(settings.maxPlayersPerRace || 4, 4));
      const usedNames = new Set<string>(humanPlayers.map((p) => p.username));

      while (room.players.size < targetTotal) {
        const bot = this.botService.createBot(avgWpm, usedNames);
        room.players.set(bot.id, bot);
      }

      this.logger.log(`Filled room ${roomId} with bots to ${room.players.size} players. Starting countdown.`);
    } else {
      this.logger.log(`Bots disabled in admin settings. Starting room ${roomId} with ${room.players.size} human racer(s).`);
    }

    this.clearQueueTimer(roomId);
    onMatchReady(room);
  }

  clearQueueTimer(roomId: string) {
    const timer = this.queueTimers.get(roomId);
    if (timer) {
      clearTimeout(timer);
      this.queueTimers.delete(roomId);
    }
  }
}

