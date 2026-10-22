import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';
import { AdminLiveService } from './admin-live.service';

@WebSocketGateway({
  namespace: '/admin',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
})
export class AdminLiveGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AdminLiveGateway.name);
  private liveInterval: NodeJS.Timeout | null = null;
  private connectedAdmins = 0;

  constructor(
    private readonly jwtService: JwtService,
    private readonly adminLiveService: AdminLiveService,
  ) {}

  private extractTokenFromSocket(client: Socket): string | undefined {
    let token = client.handshake.auth?.token;
    if (!token && client.handshake.headers?.authorization) {
      const auth = client.handshake.headers.authorization;
      if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
        token = auth.slice(7).trim();
      }
    }
    if (!token && client.handshake.headers?.cookie) {
      const match =
        client.handshake.headers.cookie.match(/(?:^|;\s*)keyspeed_token=([^;]+)/) ||
        client.handshake.headers.cookie.match(/(?:^|;\s*)token=([^;]+)/);
      if (match) token = decodeURIComponent(match[1]);
    }
    return token;
  }

  handleConnection(client: Socket) {
    try {
      const token = this.extractTokenFromSocket(client);
      if (!token) {
        client.emit('auth:error', { message: 'Authentication required' });
        client.disconnect(true);
        return;
      }

      const payload = this.jwtService.verify(token);
      if (payload.role !== 'admin') {
        client.emit('auth:error', { message: 'Admin access required' });
        client.disconnect(true);
        return;
      }

      this.connectedAdmins++;
      this.logger.log(`Admin socket connected: ${payload.username} (${client.id}). Total: ${this.connectedAdmins}`);

      // Send initial live summary immediately
      client.emit('admin:live_update', this.adminLiveService.getLiveSummary());

      // Start periodic push if not running
      if (!this.liveInterval) {
        this.liveInterval = setInterval(() => {
          if (this.connectedAdmins > 0 && this.server) {
            this.server.emit('admin:live_update', this.adminLiveService.getLiveSummary());
          }
        }, 3000);
      }
    } catch (err: any) {
      this.logger.warn(`Admin socket auth failed: ${err.message}`);
      client.emit('auth:error', { message: 'Invalid authentication token' });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.connectedAdmins = Math.max(0, this.connectedAdmins - 1);
    this.logger.log(`Admin socket disconnected (${client.id}). Total remaining: ${this.connectedAdmins}`);

    if (this.connectedAdmins === 0 && this.liveInterval) {
      clearInterval(this.liveInterval);
      this.liveInterval = null;
    }
  }
}

