import { Injectable, NotFoundException } from '@nestjs/common';
import { RoomService, HumanPlayer } from '../../realtime/room.service';
import { AuditService } from '../audit/audit.service';
import { RaceGateway } from '../../realtime/race.gateway';

@Injectable()
export class AdminLiveService {
  constructor(
    private readonly roomService: RoomService,
    private readonly auditService: AuditService,
    private readonly raceGateway: RaceGateway,
  ) {}

  getLiveSummary() {
    const allRooms = this.roomService.getAllRooms();
    const activeRooms = allRooms.filter((r) => r.status !== 'finished');

    let totalHumanPlayers = 0;
    let queueSize = 0;
    const seenUserIds = new Set<string>();

    const formattedRooms = activeRooms.map((room) => {
      const playersList = [];
      for (const [, player] of room.players) {
        if (!player.isBot && player.userId) {
          seenUserIds.add(player.userId);
          totalHumanPlayers++;
          if (room.status === 'lobby') queueSize++;
        }
        playersList.push({
          id: player.id,
          userId: player.userId,
          username: player.username,
          isBot: player.isBot,
          progress: player.progress || 0,
          wpm: player.wpm || 0,
          accuracy: player.accuracy || 100,
          finished: player.finished || false,
          flagged: !player.isBot ? (player as HumanPlayer).flagged || false : false,
        });
      }

      return {
        roomId: room.roomId,
        roomCode: room.roomCode,
        isPrivate: room.isPrivate,
        status: room.status,
        createdAt: room.createdAt,
        playersCount: room.players.size,
        players: playersList,
        textPreview: room.text ? room.text.slice(0, 60) + '...' : '',
      };
    });

    return {
      onlineUsers: seenUserIds.size,
      activeRoomsCount: formattedRooms.length,
      queueSize,
      rooms: formattedRooms,
    };
  }

  async closeRoom(
    roomId: string,
    admin: { id: string; username: string },
    ip?: string,
  ) {
    const room = this.roomService.getRoom(roomId);
    if (!room) {
      throw new NotFoundException(`Room ${roomId} not found or already finished`);
    }

    // Notify connected players via race gateway server
    try {
      this.raceGateway.server.to(roomId).emit('race:error', {
        message: 'This race room has been closed by an administrator.',
      });
      this.raceGateway.server.to(roomId).emit('room:closed', {
        reason: 'Closed by administrator',
      });
    } catch (e) {
      // Ignored if socket broadcast fails
    }

    // Clear timers and destroy room
    this.roomService.destroyRoom(roomId);

    await this.auditService.log({
      adminId: admin.id,
      adminUsername: admin.username,
      action: 'room:close',
      targetType: 'room',
      targetId: roomId,
      details: {
        playersCount: room.players.size,
        roomCode: room.roomCode,
        status: room.status,
      },
      ipAddress: ip,
    });

    return { message: `Room ${roomId} closed successfully` };
  }

  async disconnectUser(
    userId: string,
    admin: { id: string; username: string },
    ip?: string,
  ) {
    let disconnectedFromRooms = 0;
    const allRooms = this.roomService.getAllRooms();

    for (const room of allRooms) {
      for (const [socketId, player] of room.players) {
        if (!player.isBot && player.userId === userId) {
          // Disconnect socket client
          try {
            const socket = this.raceGateway.server.sockets.sockets.get(socketId);
            if (socket) {
              socket.emit('auth:error', { message: 'Disconnected by administrator' });
              socket.disconnect(true);
            }
          } catch (e) {
            // Ignored
          }

          this.roomService.removePlayer(socketId, room.roomId, userId);
          disconnectedFromRooms++;
        }
      }
    }

    await this.auditService.log({
      adminId: admin.id,
      adminUsername: admin.username,
      action: 'user:disconnect',
      targetType: 'user',
      targetId: userId,
      details: { disconnectedFromRooms },
      ipAddress: ip,
    });

    return { message: `User disconnected from ${disconnectedFromRooms} active race session(s).` };
  }
}
