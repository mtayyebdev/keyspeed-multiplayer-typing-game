import { io } from 'socket.io-client';
import {
  setSocketId,
  setQueuing,
  setLobby,
  updatePlayers,
  setRaceReady,
  setCountdown,
  startRacing,
  clearCountdown,
  updateRaceProgress,
  setPlayerFinished,
  setRaceResults,
  setClockOffset,
  setRaceError,
} from '../features/race/raceSlice';

let socket = null;
let lastProgressSentAt = 0;

export const socketMiddleware = (store) => (next) => (action) => {
  const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

  switch (action.type) {
    case 'socket/connect': {
      if (socket && socket.connected) {
        return next(action);
      }

      const token =
        store.getState().auth?.token ||
        (typeof window !== 'undefined' ? localStorage.getItem('keyspeed_token') : null);
      socket = io(`${socketUrl}/race`, {
        withCredentials: true,
        auth: { token },
        transports: ['websocket', 'polling'],
      });

      socket.on('connect', () => {
        if (socket?.id) {
          store.dispatch(setSocketId(socket.id));
        }
      });

      socket.on('session:init', (data) => {
        if (data?.socketId) {
          store.dispatch(setSocketId(data.socketId));
        }
      });

      // Synchronize clock offset on connect
      const pingStart = Date.now();
      socket.emit('ping:time', (serverResponseTime) => {
        if (serverResponseTime) {
          const rtt = Date.now() - pingStart;
          const offset = serverResponseTime - (Date.now() - rtt / 2);
          store.dispatch(setClockOffset(offset));
        }
      });

      socket.on('queue:waiting', () => {
        store.dispatch(setQueuing());
      });

      socket.on('room:updated', (data) => {
        const myId = socket?.id;
        const currentUser = store.getState().auth?.user;
        const myUsername = currentUser?.username;
        const myUserId = currentUser?.id || currentUser?._id;

        const hostPlayer = data.players?.find((p) => p.isHost || (data.hostId && p.id === data.hostId));
        const amIHost = Boolean(
          (data.hostId && myId && data.hostId === myId) ||
          (hostPlayer && myId && hostPlayer.id === myId) ||
          (hostPlayer && myUsername && hostPlayer.username === myUsername) ||
          (hostPlayer && myUserId && hostPlayer.userId === myUserId)
        );

        if (data.roomCode || data.roomId) {
          store.dispatch(
            setLobby({
              roomId: data.roomId,
              roomCode: data.roomCode,
              hostId: data.hostId,
              isHost: amIHost,
              players: data.players,
            })
          );
        } else if (data.players) {
          store.dispatch(
            updatePlayers({
              players: data.players,
              hostId: data.hostId,
              isHost: amIHost,
            })
          );
        }
      });

      socket.on('race:ready', (data) => {
        store.dispatch(setRaceReady(data));
      });

      socket.on('race:countdown', (data) => {
        const secondsLeft = typeof data === 'number' ? data : data.secondsLeft;
        store.dispatch(setCountdown(secondsLeft));
        if (secondsLeft === 0) {
          store.dispatch(startRacing());
          setTimeout(() => {
            store.dispatch(clearCountdown());
          }, 700);
        }
      });

      socket.on('race:update', (data) => {
        const players = data.players || data;
        store.dispatch(updateRaceProgress(players));
      });

      socket.on('race:finished', (data) => {
        store.dispatch(setPlayerFinished(data));
      });

      socket.on('race:results', (data) => {
        const standings = data.standings || data;
        store.dispatch(setRaceResults(standings));
      });

      socket.on('error', (err) => {
        store.dispatch(setRaceError(err.message || 'An error occurred'));
      });

      socket.on('disconnect', () => {
        // Handle disconnect if needed
      });
      break;
    }

    case 'socket/disconnect': {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
      break;
    }

    case 'socket/queueJoin': {
      if (socket?.connected) {
        socket.emit('queue:join');
      }
      break;
    }

    case 'socket/queueLeave': {
      if (socket?.connected) {
        socket.emit('queue:leave');
      }
      break;
    }

    case 'socket/roomCreate': {
      if (socket?.connected) {
        socket.emit('room:create');
      }
      break;
    }

    case 'socket/roomJoin': {
      if (socket?.connected) {
        socket.emit('room:join', { code: action.payload });
      }
      break;
    }

    case 'socket/roomLeave': {
      if (socket?.connected) {
        const payload = action.payload || {
          roomId: store.getState().race.roomId,
          roomCode: store.getState().race.roomCode,
        };
        socket.emit('room:leave', payload);
      }
      break;
    }

    case 'race/resetRace':
    case 'auth/logout': {
      const currentRoomId = store.getState().race?.roomId;
      const currentRoomCode = store.getState().race?.roomCode;
      if (socket?.connected && currentRoomId) {
        socket.emit('room:leave', { roomId: currentRoomId, roomCode: currentRoomCode });
      }
      if (action.type === 'auth/logout' && socket) {
        socket.disconnect();
        socket = null;
      }
      break;
    }

    case 'socket/roomStart': {
      if (socket?.connected) {
        const payload = action.payload || {
          roomId: store.getState().race.roomId,
          roomCode: store.getState().race.roomCode,
        };
        socket.emit('room:start', payload);
      }
      break;
    }

    case 'socket/raceProgress': {
      // Throttle progress events to at most every 150ms per Architecture Rule 4
      const now = Date.now();
      if (now - lastProgressSentAt >= 150) {
        lastProgressSentAt = now;
        if (socket?.connected) {
          socket.emit('race:progress', action.payload);
        }
      }
      break;
    }

    case 'socket/raceFinish': {
      if (socket?.connected) {
        socket.emit('race:finish', action.payload);
      }
      break;
    }

    default:
      break;
  }

  return next(action);
};

