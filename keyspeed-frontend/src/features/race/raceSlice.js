import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  status: 'idle', // 'idle' | 'queuing' | 'lobby' | 'ready' | 'countdown' | 'racing' | 'finished'
  roomId: null,
  roomCode: null,
  hostId: null,
  socketId: null,
  isHost: false,
  text: '',
  startAt: null,
  endAt: null,
  timeLimitSeconds: 60,
  countdownSeconds: null,
  players: [], // array of { id, username, progress, wpm, isBot, isHost }
  myResult: null,
  standings: [],
  error: null,
  clockOffset: 0,
};

const raceSlice = createSlice({
  name: 'race',
  initialState,
  reducers: {
    setSocketId: (state, action) => {
      state.socketId = action.payload;
    },
    setQueuing: (state) => {
      state.status = 'queuing';
      state.error = null;
    },
    setLobby: (state, action) => {
      const { roomId, roomCode, hostId, isHost, players } = action.payload;
      state.status = 'lobby';
      state.roomId = roomId;
      state.roomCode = roomCode;
      if (hostId) state.hostId = hostId;
      if (isHost !== undefined) {
        state.isHost = !!isHost;
      }
      state.players = players || [];
      state.error = null;
    },
    updatePlayers: (state, action) => {
      if (Array.isArray(action.payload)) {
        state.players = action.payload;
      } else {
        state.players = action.payload.players || [];
        if (action.payload.hostId) state.hostId = action.payload.hostId;
        if (action.payload.isHost !== undefined) {
          state.isHost = !!action.payload.isHost;
        }
      }
    },
    setRaceReady: (state, action) => {
      const { roomId, text, startAt, endAt, timeLimitSeconds, players } = action.payload;
      state.status = 'ready';
      state.roomId = roomId;
      state.text = text;
      state.startAt = startAt;
      state.timeLimitSeconds = timeLimitSeconds || 60;
      state.endAt = endAt || (startAt ? startAt + state.timeLimitSeconds * 1000 : null);
      state.players = players;
      state.myResult = null;
      state.standings = [];
      state.error = null;
    },
    setCountdown: (state, action) => {
      state.status = 'countdown';
      state.countdownSeconds = action.payload;
    },
    startRacing: (state, action) => {
      state.status = 'racing';
      if (action?.payload?.timeLimitSeconds) {
        state.timeLimitSeconds = action.payload.timeLimitSeconds;
      }
      if (action?.payload?.endAt) {
        state.endAt = action.payload.endAt;
      }
    },
    clearCountdown: (state) => {
      state.countdownSeconds = null;
    },
    updateRaceProgress: (state, action) => {
      // action.payload: array of { id, username, progress, wpm }
      const incoming = action.payload;
      state.players = state.players.map((p) => {
        const update = incoming.find((u) => u.id === p.id);
        if (update) {
          return { ...p, ...update };
        }
        return p;
      });
    },
    setPlayerFinished: (state, action) => {
      const { playerId, position, wpm, accuracy } = action.payload;
      state.players = state.players.map((p) => {
        if (p.id === playerId) {
          return { ...p, finished: true, position, wpm, accuracy };
        }
        return p;
      });
    },
    setMyResult: (state, action) => {
      state.myResult = action.payload;
      state.status = 'finished';
    },
    setRaceResults: (state, action) => {
      state.standings = action.payload;
      state.status = 'finished';
    },
    setClockOffset: (state, action) => {
      state.clockOffset = action.payload;
    },
    setRaceError: (state, action) => {
      state.error = action.payload;
      state.status = 'idle';
    },
    resetRace: (state) => {
      state.status = 'idle';
      state.roomId = null;
      state.roomCode = null;
      state.hostId = null;
      state.isHost = false;
      state.text = '';
      state.startAt = null;
      state.endAt = null;
      state.timeLimitSeconds = 60;
      state.countdownSeconds = null;
      state.players = [];
      state.myResult = null;
      state.standings = [];
      state.error = null;
    },
  },
});

export const {
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
  setMyResult,
  setRaceResults,
  setClockOffset,
  setRaceError,
  resetRace,
} = raceSlice.actions;

export default raceSlice.reducer;

