import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';
import { RoomService, HumanPlayer, RoomState, Player } from './room.service';
import { MatchmakingService } from './matchmaking.service';
import { TextsService } from '../texts/texts.service';
import { RacesService } from '../races/races.service';
import { UsersService } from '../users/users.service';
import { ClassicRaceEngine } from '../../games/classic-race.engine';
import { BotPlayer, BotService } from './bot.service';
import { validateProgressJump } from '../../games/anti-cheat.util';
import { SettingsService } from '../admin/settings/settings.service';

@WebSocketGateway({
  namespace: '/race',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
})
export class RaceGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RaceGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly roomService: RoomService,
    private readonly matchmakingService: MatchmakingService,
    private readonly textsService: TextsService,
    private readonly racesService: RacesService,
    private readonly usersService: UsersService,
    private readonly raceEngine: ClassicRaceEngine,
    private readonly botService: BotService,
    private readonly settingsService: SettingsService,
  ) {}

  private extractTokenFromSocket(client: Socket): string | undefined {
    let token = client.handshake.auth?.token;
    if (!token && client.handshake.headers?.authorization) {
      const auth = client.handshake.headers.authorization;
      if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
        token = auth.slice(7);
      }
    }
    if (!token && client.handshake.headers?.cookie) {
      const cookieHeader = client.handshake.headers.cookie;
      const match =
        cookieHeader.match(/(?:^|;\s*)keyspeed_token=([^;]+)/) ||
        cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
      if (match) {
        token = decodeURIComponent(match[1]);
      }
    }
    return token;
  }

  async handleConnection(client: Socket) {
    try {
      const token = this.extractTokenFromSocket(client);

      if (!token) {
        // Guest user or unauthenticated connection
        client.data.user = {
          sub: null,
          username: `Guest_${client.id.substring(0, 4)}`,
          avgWpm: 40,
          isGuest: true,
        };
      } else {
        const decoded = this.jwtService.verify(token);
        const user = await this.usersService.findById(decoded.sub);
        if (!user) {
          client.data.user = {
            sub: null,
            username: `Guest_${client.id.substring(0, 4)}`,
            avgWpm: 40,
            isGuest: true,
          };
        } else {
          client.data.user = {
            sub: user._id.toString(),
            username: user.username,
            avgWpm: user.avgWpm || 40,
            isGuest: false,
          };
        }
      }
    } catch (err) {
      // Allow connection as guest if token expired or invalid
      client.data.user = {
        sub: null,
        username: `Guest_${client.id.substring(0, 4)}`,
        avgWpm: 40,
        isGuest: true,
      };
    }

    client.emit('session:init', {
      socketId: client.id,
      user: client.data.user,
    });
  }

  async handleDisconnect(client: Socket) {
    const queueLeaveRes = this.matchmakingService.handleQueueLeave(client.id);
    let targetRoom = queueLeaveRes.room;
    let isEmptied = queueLeaveRes.emptied;

    if (!targetRoom) {
      const removeRes = this.roomService.removePlayer(client.id, undefined, client.data?.user?.sub);
      targetRoom = removeRes.room;
      isEmptied = removeRes.emptied;
    }

    if (targetRoom && !isEmptied) {
      if (targetRoom.status === 'lobby') {
        this.broadcastRoomUpdate(targetRoom);
      } else if (targetRoom.status === 'racing') {
        this.broadcastRaceUpdate(targetRoom);
        const humans = Array.from(targetRoom.players.values()).filter((p) => !p.isBot);
        if (humans.length > 0 && humans.every((p) => p.finished)) {
          await this.finalizeRace(targetRoom);
        }
      }
    }
  }

  // Ping endpoint for client clock offset calculation
  @SubscribeMessage('ping:time')
  handlePingTime(@ConnectedSocket() client: Socket) {
    return Date.now();
  }

  @SubscribeMessage('queue:join')
  async handleQueueJoin(@ConnectedSocket() client: Socket) {
    if (!client.data?.user?.sub || client.data?.user?.isGuest) {
      return client.emit('error', {
        code: 'UNAUTHORIZED',
        message: 'Authentication required. Please sign in to join live races.',
      });
    }

    const settings = this.settingsService.getSettings();
    if (settings.maintenanceMode && client.data?.user?.role !== 'admin') {
      return client.emit('error', {
        code: 'MAINTENANCE_MODE',
        message: 'KeySpeed is currently in maintenance mode. Live matchmaking is paused.',
      });
    }

    const human: HumanPlayer = {
      id: client.id,
      userId: client.data?.user?.sub || null,
      username: client.data?.user?.username || `Racer_${client.id.substring(0, 4)}`,
      avgWpm: client.data?.user?.avgWpm || 40,
      isBot: false,
      isHost: false,
      progress: 0,
      wpm: 0,
      accuracy: 100,
      errors: 0,
      flagged: false,
      finished: false,
    };

    this.leaveOtherRooms(client);
    const room = await this.matchmakingService.handleQueueJoin(
      human,
      (readyRoom) => this.startRaceSequence(readyRoom),
      (socketId) => {
        this.server.to(socketId).emit('queue:waiting');
      },
    );

    client.join(room.roomId);
  }

  @SubscribeMessage('queue:leave')
  handleQueueLeave(@ConnectedSocket() client: Socket) {
    const { room, emptied } = this.matchmakingService.handleQueueLeave(client.id);
    client.emit('room:updated', { players: [] });
    if (room && !emptied && room.status === 'lobby') {
      this.broadcastRoomUpdate(room);
    }
  }

  @SubscribeMessage('room:leave')
  async handleRoomLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() data?: { roomId?: string; roomCode?: string },
  ) {
    const queueLeaveRes = this.matchmakingService.handleQueueLeave(client.id);
    let targetRoom = queueLeaveRes.room;
    let isEmptied = queueLeaveRes.emptied;

    if (!targetRoom) {
      const removeRes = this.roomService.removePlayer(
        client.id,
        data?.roomId,
        client.data?.user?.sub,
        data?.roomCode,
      );
      targetRoom = removeRes.room;
      isEmptied = removeRes.emptied;
    }

    if (data?.roomId) {
      client.leave(data.roomId);
    }
    if (targetRoom?.roomId) {
      client.leave(targetRoom.roomId);
    }

    client.emit('room:updated', { players: [] });

    if (targetRoom && !isEmptied) {
      if (targetRoom.status === 'lobby') {
        this.broadcastRoomUpdate(targetRoom);
      } else if (targetRoom.status === 'racing') {
        this.broadcastRaceUpdate(targetRoom);
        const humans = Array.from(targetRoom.players.values()).filter((p) => !p.isBot);
        if (humans.length > 0 && humans.every((p) => p.finished)) {
          await this.finalizeRace(targetRoom);
        }
      }
    }
  }

  @SubscribeMessage('room:create')
  async handleRoomCreate(@ConnectedSocket() client: Socket) {
    if (!client.data?.user?.sub || client.data?.user?.isGuest) {
      return client.emit('error', {
        code: 'UNAUTHORIZED',
        message: 'Authentication required. Please sign in to create a race room.',
      });
    }

    const code = this.roomService.generateRoomCode();
    const randomText = await this.textsService.getRandomText();
    const roomId = `private_${code}`;

    const host: HumanPlayer = {
      id: client.id,
      userId: client.data?.user?.sub || null,
      username: client.data?.user?.username || `Racer_${client.id.substring(0, 4)}`,
      avgWpm: client.data?.user?.avgWpm || 40,
      isBot: false,
      isHost: true,
      progress: 0,
      wpm: 0,
      accuracy: 100,
      errors: 0,
      flagged: false,
      finished: false,
    };

    this.leaveOtherRooms(client);
    client.join(roomId);
    const room = this.roomService.createRoom(
      roomId,
      host,
      randomText._id.toString(),
      randomText.content,
      true,
      code,
    );

    this.broadcastRoomUpdate(room);
  }

  @SubscribeMessage('room:join')
  handleRoomJoin(@ConnectedSocket() client: Socket, @MessageBody() data: { code: string }) {
    if (!client.data?.user?.sub || client.data?.user?.isGuest) {
      return client.emit('error', {
        code: 'UNAUTHORIZED',
        message: 'Authentication required. Please sign in to join a race room.',
      });
    }

    if (!data?.code) {
      return client.emit('error', { code: 'INVALID_CODE', message: 'Room code is required' });
    }

    const room = this.roomService.getRoomByCode(data.code);
    if (!room) {
      return client.emit('error', { code: 'NOT_FOUND', message: 'Room not found' });
    }

    if (room.status !== 'lobby') {
      return client.emit('error', { code: 'RACE_IN_PROGRESS', message: 'Race already started' });
    }

    if (room.players.size >= 4) {
      return client.emit('error', {
        code: 'ROOM_FULL',
        message: 'Room is already full (max 4 players)',
      });
    }

    const player: HumanPlayer = {
      id: client.id,
      userId: client.data?.user?.sub || null,
      username: client.data?.user?.username || `Racer_${client.id.substring(0, 4)}`,
      avgWpm: client.data?.user?.avgWpm || 40,
      isBot: false,
      isHost: false,
      progress: 0,
      wpm: 0,
      accuracy: 100,
      errors: 0,
      flagged: false,
      finished: false,
    };

    this.leaveOtherRooms(client);
    client.join(room.roomId);
    room.players.set(client.id, player);

    this.broadcastRoomUpdate(room);

    // If room reached 4 racers, automatically start the game
    if (room.players.size >= 4) {
      this.logger.log(`Room ${room.roomId} reached 4 racers. Auto-starting race!`);
      this.startRaceSequence(room);
    }
  }

  @SubscribeMessage('room:start')
  handleRoomStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data?: { roomId?: string; roomCode?: string },
  ) {
    if (!client.data?.user?.sub || client.data?.user?.isGuest) {
      return client.emit('error', {
        code: 'UNAUTHORIZED',
        message: 'Authentication required. Please sign in to start the race.',
      });
    }

    let room = this.roomService.getRoomByPlayerId(client.id);
    if (!room && data?.roomCode) {
      room = this.roomService.getRoomByCode(data.roomCode);
    }
    if (!room && data?.roomId) {
      room = this.roomService.getRoom(data.roomId);
    }
    if (!room) {
      return client.emit('error', { code: 'NOT_IN_ROOM', message: 'You are not in a room' });
    }

    const hostPlayer = room.players.get(room.hostId);
    const isHost =
      room.hostId === client.id ||
      (hostPlayer &&
        client.data.user?.sub &&
        (hostPlayer as HumanPlayer).userId === client.data.user.sub) ||
      (hostPlayer &&
        client.data.user?.username &&
        hostPlayer.username === client.data.user.username);

    if (!isHost) {
      return client.emit('error', {
        code: 'NOT_HOST',
        message: 'Only room host can start the race',
      });
    }

    // Refresh hostId to current socket ID in case of socket reconnect
    room.hostId = client.id;

    if (room.status !== 'lobby') {
      return;
    }

    // Require minimum 2 racers to start
    if (room.players.size < 2) {
      return client.emit('error', {
        code: 'NOT_ENOUGH_PLAYERS',
        message: 'A minimum of 2 racers is required to start the race',
      });
    }

    this.startRaceSequence(room);
  }

  @SubscribeMessage('race:progress')
  handleRaceProgress(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; index: number },
  ) {
    if (!data?.roomId || typeof data.index !== 'number') return;
    const room = this.roomService.getRoom(data.roomId);
    if (!room || room.status !== 'racing') return;

    const player = room.players.get(client.id) as HumanPlayer;
    if (!player || player.finished) return;

    const now = Date.now();

    // Socket flood protection: drop updates arriving faster than 50ms from same socket
    if (player.lastProgressUpdate && now - player.lastProgressUpdate < 50) {
      return;
    }

    const elapsedMs = Math.max(500, now - (room.startAt || now));

    // Anti-cheat: Check progress jump
    const maxJump = this.settingsService.getSettings().maxProgressJumpPerTick || 15;
    if (player.lastProgressIndex !== undefined) {
      const jumpCheck = validateProgressJump(player.lastProgressIndex, data.index, maxJump);
      if (jumpCheck.isFlagged) {
        player.flagged = true;
      }
    }
    player.lastProgressIndex = data.index;
    player.lastProgressUpdate = now;

    // Source of truth: Server calculates progress and WPM
    const updated = this.raceEngine.calculateProgress(
      player,
      data.index,
      room.text.length,
      elapsedMs,
    );

    player.progress = updated.progress;
    player.wpm = updated.wpm;

    this.broadcastRaceUpdate(room);
  }

  @SubscribeMessage('race:finish')
  async handleRaceFinish(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; typedText: string },
  ) {
    if (!data?.roomId) return;
    const room = this.roomService.getRoom(data.roomId);
    if (!room || room.status !== 'racing') return;

    const player = room.players.get(client.id) as HumanPlayer;
    if (!player || player.finished) return;

    const now = Date.now();
    const durationMs = Math.max(1000, now - (room.startAt || now));

    const settings = this.settingsService.getSettings();
    const finalScore = this.raceEngine.calculateFinalScore(
      player,
      room.text,
      data.typedText || '',
      durationMs,
      settings.maxAllowedWpm || 250,
      settings.maxProgressJumpPerTick || 15,
    );

    player.progress = 100;
    player.wpm = finalScore.wpm;
    player.netWpm = finalScore.netWpm;
    player.accuracy = finalScore.accuracy;
    player.errors = finalScore.errors;
    player.durationMs = durationMs;
    if (finalScore.isFlagged) {
      player.flagged = true;
    }
    player.finished = true;

    // Notify client of individual finish
    this.server.to(client.id).emit('race:player_finished', {
      playerId: player.id,
      wpm: player.wpm,
      netWpm: player.netWpm,
      accuracy: player.accuracy,
      errors: player.errors,
      durationMs,
    });

    this.broadcastRaceUpdate(room);

    // Check if all human racers have finished
    const humans = Array.from(room.players.values()).filter((p) => !p.isBot);
    const allHumansDone = humans.every((p) => p.finished);

    if (allHumansDone) {
      await this.finalizeRace(room);
    }
  }

  private calculateRankScore(player: Player): number {
    const isFinished = player.finished && player.progress >= 100;
    const wpm = player.wpm || 0;
    const accuracy = player.accuracy || 0;
    const errors = (player as HumanPlayer).errors || 0;
    const netWpm = player.netWpm ?? Math.max(0, Math.round(wpm * (accuracy / 100)));

    // 1. Completion bonus: completed racers always rank above unfinished racers
    const completionBonus = isFinished ? 100000 : player.progress * 500;

    // 2. Net WPM has high priority: speed with accuracy
    const speedScore = netWpm * 100;

    // 3. Accuracy bonus
    const accuracyScore = accuracy * 10;

    // 4. Heavy Error penalty: every mistake deducts 50 points, pulling position down
    const errorPenalty = errors * 50;

    return completionBonus + speedScore + accuracyScore - errorPenalty;
  }

  private startRaceSequence(room: RoomState) {
    room.status = 'countdown';

    const settings = this.settingsService.getSettings();
    const countdownSeconds = settings.countdownSeconds ?? 3;
    const raceTimeoutSeconds = settings.raceTimeoutSeconds ?? 60;
    const countdownDuration = (countdownSeconds + 1) * 1000;
    const startAt = Date.now() + countdownDuration;
    const endAt = startAt + raceTimeoutSeconds * 1000;
    room.startAt = startAt;
    room.endAt = endAt;
    room.timeLimitSeconds = raceTimeoutSeconds;

    const playersList = Array.from(room.players.values()).map((p) => ({
      id: p.id,
      username: p.username,
      progress: 0,
      wpm: 0,
      isBot: p.isBot,
      isHost: (p as HumanPlayer).isHost || false,
    }));

    // Broadcast race:ready
    this.server.to(room.roomId).emit('race:ready', {
      roomId: room.roomId,
      text: room.text,
      startAt,
      endAt,
      timeLimitSeconds: raceTimeoutSeconds,
      players: playersList,
    });

    let secondsLeft = countdownSeconds;
    this.server.to(room.roomId).emit('race:countdown', { secondsLeft });

    const countdownInterval = setInterval(() => {
      secondsLeft -= 1;
      if (secondsLeft >= 0) {
        this.server.to(room.roomId).emit('race:countdown', { secondsLeft });
      }

      if (secondsLeft <= 0) {
        clearInterval(countdownInterval);
        room.status = 'racing';
        this.startBotSimulation(room);

        // Notify room that race has started along with timer info
        this.server.to(room.roomId).emit('race:start', {
          startAt: room.startAt,
          endAt: room.endAt,
          timeLimitSeconds: raceTimeoutSeconds,
        });

        // Dynamic timeout limit from admin settings
        room.raceTimeoutTimer = setTimeout(() => {
          this.finalizeRace(room);
        }, raceTimeoutSeconds * 1000);
      }
    }, 1000);

    room.countdownTimer = countdownInterval;
  }

  private startBotSimulation(room: RoomState) {
    const textLength = Math.max(1, room.text.length);
    const bots = Array.from(room.players.values()).filter((p) => p.isBot) as BotPlayer[];
    if (bots.length === 0) return;

    for (const bot of bots) {
      bot.charsTyped = 0;
      bot.progress = 0;
      bot.wpm = bot.targetWpm;
      bot.finished = false;
      const botErrors = Math.round(textLength * (1 - (bot.accuracy || 95) / 100));
      bot.errors = botErrors;
    }

    const tickMs = 250;
    room.botTickTimer = setInterval(() => {
      if (room.status !== 'racing') {
        clearInterval(room.botTickTimer);
        return;
      }

      const now = Date.now();
      const elapsedMs = Math.max(500, now - (room.startAt || now));
      let stateChanged = false;

      for (const bot of bots) {
        if (bot.finished) continue;

        // Occasional random hesitation (10% chance of small pause)
        if (Math.random() < 0.1) {
          continue;
        }

        // Target characters per second = (targetWpm * 5) / 60
        const charsPerSec = (bot.targetWpm * 5) / 60;
        // Minor natural variance per tick (between 0.85 and 1.15)
        const variance = 0.85 + Math.random() * 0.3;
        const increment = charsPerSec * (tickMs / 1000) * variance;

        bot.charsTyped = Math.min(textLength, (bot.charsTyped || 0) + increment);
        const progressPercent = Math.min(100, Math.round((bot.charsTyped / textLength) * 100));

        bot.progress = progressPercent;
        const currentWpm = Math.round(bot.charsTyped / 5 / (elapsedMs / 60000));
        bot.wpm = Math.max(15, currentWpm);

        if (bot.charsTyped >= textLength || bot.progress >= 100) {
          bot.progress = 100;
          bot.finished = true;
          bot.durationMs = elapsedMs;
          const botErrors = Math.round(textLength * (1 - (bot.accuracy || 95) / 100));
          bot.errors = botErrors;
          bot.netWpm = Math.max(0, Math.round((textLength / 5 - botErrors) / (elapsedMs / 60000)));

          this.server.to(room.roomId).emit('race:player_finished', {
            playerId: bot.id,
            wpm: bot.wpm,
            netWpm: bot.netWpm,
            accuracy: bot.accuracy,
            errors: bot.errors,
          });
        }
        stateChanged = true;
      }

      if (stateChanged) {
        this.broadcastRaceUpdate(room);
      }

      // Check if all players or all humans have finished
      const humans = Array.from(room.players.values()).filter((p) => !p.isBot);
      const allHumansFinished = humans.length > 0 && humans.every((p) => p.finished);
      const allPlayersFinished = Array.from(room.players.values()).every((p) => p.finished);

      if (allHumansFinished || allPlayersFinished) {
        this.finalizeRace(room);
      }
    }, tickMs);
  }

  private async finalizeRace(room: RoomState) {
    if (room.status === 'finished') return;
    room.status = 'finished';

    if (room.botTickTimer) clearInterval(room.botTickTimer);
    if (room.raceTimeoutTimer) clearTimeout(room.raceTimeoutTimer);

    // Compute fair position rankings for ALL players based on completion, Net WPM, accuracy, and error penalties
    const allPlayers = Array.from(room.players.values());

    const sortedPlayers = allPlayers.sort((a, b) => {
      // 1. Disqualified / flagged racers placed at the bottom
      const aFlagged = (a as HumanPlayer).flagged;
      const bFlagged = (b as HumanPlayer).flagged;
      if (aFlagged && !bFlagged) return 1;
      if (!aFlagged && bFlagged) return -1;

      // 2. Finished racers rank ahead of unfinished racers
      const aDone = a.finished && a.progress >= 100;
      const bDone = b.finished && b.progress >= 100;
      if (aDone && !bDone) return -1;
      if (!aDone && bDone) return 1;

      // 3. Rank score (Net WPM + Accuracy - Error Penalty)
      const aScore = this.calculateRankScore(a);
      const bScore = this.calculateRankScore(b);
      if (bScore !== aScore) {
        return bScore - aScore;
      }

      // 4. Tie-breaker 1: Fewer errors wins
      const aErrors = (a as HumanPlayer).errors ?? 0;
      const bErrors = (b as HumanPlayer).errors ?? 0;
      if (aErrors !== bErrors) {
        return aErrors - bErrors;
      }

      // 5. Tie-breaker 2: Faster duration wins
      const aDur = (a as any).durationMs || 999999;
      const bDur = (b as any).durationMs || 999999;
      return aDur - bDur;
    });

    room.standings = [];
    sortedPlayers.forEach((player, idx) => {
      player.position = idx + 1;
      player.rankScore = this.calculateRankScore(player);
      room.standings.push(player);
    });

    this.broadcastRaceUpdate(room);

    const formattedStandings = room.standings.map((p) => ({
      userId: p.userId,
      username: p.username,
      isBot: p.isBot,
      position: p.position || 0,
      wpm: p.wpm || 0,
      netWpm: p.netWpm || p.wpm || 0,
      accuracy: p.accuracy || 100,
      errors: (p as HumanPlayer).errors || 0,
      flagged: (p as HumanPlayer).flagged || false,
    }));

    // Send final standings to all players
    this.server.to(room.roomId).emit('race:results', { standings: formattedStandings });

    // Save to MongoDB
    try {
      await this.racesService.createAndSaveCompletedRace(
        'race',
        room.textId,
        new Date(room.startAt || room.createdAt),
        new Date(),
        room.isPrivate,
        room.roomCode,
        formattedStandings,
      );
    } catch (err: any) {
      this.logger.error(`Error saving race ${room.roomId} results: ${err.message}`);
    }

    // Destroy room after small buffer (15s) so players can view results
    setTimeout(() => {
      this.roomService.destroyRoom(room.roomId);
    }, 15000);
  }

  private broadcastRoomUpdate(room: RoomState) {
    const players = Array.from(room.players.values()).map((p) => ({
      id: p.id,
      userId: (p as HumanPlayer).userId,
      username: p.username,
      isBot: p.isBot,
      isHost: p.id === room.hostId || (p as HumanPlayer).isHost || false,
    }));

    this.server.to(room.roomId).emit('room:updated', {
      roomId: room.roomId,
      roomCode: room.roomCode,
      hostId: room.hostId,
      players,
    });
  }

  private broadcastRaceUpdate(room: RoomState) {
    const players = Array.from(room.players.values()).map((p) => ({
      id: p.id,
      username: p.username,
      progress: p.progress,
      wpm: p.wpm,
      finished: p.finished,
      position: p.position,
    }));

    this.server.to(room.roomId).emit('race:update', { players });
  }

  private leaveOtherRooms(client: Socket) {
    const existing = this.roomService.getRoomByPlayerId(client.id);
    if (existing) {
      const { room, emptied } = this.roomService.removePlayer(client.id);
      if (room && !emptied && room.status === 'lobby') {
        this.broadcastRoomUpdate(room);
      }
    }
    for (const r of client.rooms) {
      if (r !== client.id) {
        client.leave(r);
      }
    }
  }
}
