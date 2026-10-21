import { Injectable, Logger } from '@nestjs/common';
import { BotPlayer } from './bot.service';

export interface HumanPlayer {
  id: string; // Socket ID
  userId: string;
  username: string;
  avgWpm: number;
  isBot: false;
  isHost: boolean;
  progress: number;
  wpm: number;
  accuracy: number;
  errors: number;
  flagged: boolean;
  finished: boolean;
  position?: number;
  lastProgressUpdate?: number;
  lastProgressIndex?: number;
}

export type Player = HumanPlayer | BotPlayer;

export interface RoomState {
  roomId: string;
  roomCode?: string;
  isPrivate: boolean;
  textId: string;
  text: string;
  status: 'lobby' | 'countdown' | 'racing' | 'finished';
  players: Map<string, Player>;
  hostId: string;
  createdAt: number;
  startAt?: number;
  countdownTimer?: NodeJS.Timeout;
  botTickTimer?: NodeJS.Timeout;
  raceTimeoutTimer?: NodeJS.Timeout;
  standings: Player[];
  nextPosition: number;
}

@Injectable()
export class RoomService {
  private readonly logger = new Logger(RoomService.name);

  // NOTE: Room state lives in memory on the server for v1 (a Map inside RoomService).
  // Redis will replace this in-memory Map in a future version for horizontal scaling.
  private rooms: Map<string, RoomState> = new Map();

  createRoom(
    roomId: string,
    hostPlayer: HumanPlayer,
    textId: string,
    text: string,
    isPrivate: boolean = false,
    roomCode?: string,
  ): RoomState {
    const players = new Map<string, Player>();
    players.set(hostPlayer.id, hostPlayer);

    const room: RoomState = {
      roomId,
      roomCode,
      isPrivate,
      textId,
      text,
      status: 'lobby',
      players,
      hostId: hostPlayer.id,
      createdAt: Date.now(),
      standings: [],
      nextPosition: 1,
    };

    this.rooms.set(roomId, room);
    return room;
  }

  getRoom(roomId: string): RoomState | undefined {
    return this.rooms.get(roomId);
  }

  getRoomByCode(code: string): RoomState | undefined {
    const upper = code.trim().toUpperCase();
    for (const room of this.rooms.values()) {
      if (room.roomCode && room.roomCode.toUpperCase() === upper) {
        return room;
      }
    }
    return undefined;
  }

  getRoomByPlayerId(socketId: string): RoomState | undefined {
    for (const room of this.rooms.values()) {
      if (room.players.has(socketId)) {
        return room;
      }
    }
    return undefined;
  }

  removePlayer(
    socketId: string,
    roomId?: string,
    userId?: string,
    roomCode?: string,
  ): { room?: RoomState; wasHost: boolean; emptied: boolean } {
    let room = this.getRoomByPlayerId(socketId);
    if (!room && roomId) {
      room = this.getRoom(roomId);
    }
    if (!room && roomCode) {
      room = this.getRoomByCode(roomCode);
    }
    if (!room) {
      return { wasHost: false, emptied: false };
    }

    let targetKey = socketId;
    if (!room.players.has(socketId)) {
      for (const [key, p] of room.players.entries()) {
        if (p.id === socketId || (userId && (p as HumanPlayer).userId === userId)) {
          targetKey = key;
          break;
        }
      }
    }

    const wasHost = room.hostId === targetKey;
    room.players.delete(targetKey);

    // If no human players left, remove room & clear timers
    const humanPlayers = Array.from(room.players.values()).filter((p) => !p.isBot);
    if (humanPlayers.length === 0) {
      this.destroyRoom(room.roomId);
      return { room, wasHost, emptied: true };
    }

    // Reassign host if host left
    if (wasHost && humanPlayers.length > 0) {
      for (const p of humanPlayers) {
        (p as HumanPlayer).isHost = false;
      }
      const newHost = humanPlayers[0] as HumanPlayer;
      newHost.isHost = true;
      room.hostId = newHost.id;
    }

    return { room, wasHost, emptied: false };
  }

  destroyRoom(roomId: string) {
    const room = this.rooms.get(roomId);
    if (room) {
      if (room.countdownTimer) clearInterval(room.countdownTimer);
      if (room.botTickTimer) clearInterval(room.botTickTimer);
      if (room.raceTimeoutTimer) clearTimeout(room.raceTimeoutTimer);
      this.rooms.delete(roomId);
      this.logger.log(`Room ${roomId} destroyed.`);
    }
  }

  getAllRooms(): RoomState[] {
    return Array.from(this.rooms.values());
  }

  generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}

