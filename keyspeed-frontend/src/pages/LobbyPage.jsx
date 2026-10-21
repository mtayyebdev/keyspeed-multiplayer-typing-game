import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { resetRace } from '../features/race/raceSlice';
import {
  Users,
  Play,
  KeyRound,
  Loader2,
  Copy,
  Check,
  Bot,
  User,
  ArrowRight,
  LogOut,
  AlertCircle,
} from 'lucide-react';

export default function LobbyPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth?.user);
  const {
    status,
    roomId,
    roomCode,
    isHost: sliceIsHost,
    hostId,
    socketId,
    players,
    error,
  } = useSelector((state) => state.race);

  // Derive host status reliably
  const hostPlayer = players.find((p) => p.isHost || (hostId && p.id === hostId));
  const isHost = Boolean(
    sliceIsHost ||
    (hostId && socketId && hostId === socketId) ||
    (hostPlayer && socketId && hostPlayer.id === socketId) ||
    (hostPlayer && user?.username && hostPlayer.username === user.username) ||
    (hostPlayer && (user?.id || user?._id) && (hostPlayer.userId === user?.id || hostPlayer.userId === user?._id))
  );

  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [isJoiningQueue, setIsJoiningQueue] = useState(false);

  // Navigate to race page when game is ready or countdown begins
  useEffect(() => {
    if (status === 'ready' || status === 'countdown' || status === 'racing') {
      navigate('/race');
    }
    if (status !== 'idle') {
      setIsJoiningQueue(false);
    }
  }, [status, navigate]);

  useEffect(() => {
    if (error) {
      setIsJoiningQueue(false);
    }
  }, [error]);

  const handleJoinQueue = () => {
    setIsJoiningQueue(true);
    dispatch({ type: 'socket/queueJoin' });
  };

  const handleLeaveQueue = () => {
    dispatch({ type: 'socket/queueLeave' });
    dispatch(resetRace());
  };

  const handleCreateRoom = () => {
    dispatch({ type: 'socket/roomCreate' });
  };

  const handleJoinByCode = (e) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    dispatch({ type: 'socket/roomJoin', payload: joinCodeInput.trim().toUpperCase() });
  };

  const handleStartRoom = () => {
    dispatch({ type: 'socket/roomStart', payload: { roomId, roomCode } });
  };

  const handleLeaveRoom = () => {
    dispatch({ type: 'socket/roomLeave', payload: { roomId, roomCode } });
    dispatch(resetRace());
  };

  const copyRoomCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full py-8">
      {/* Heading */}
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-fg tracking-tight">
          Multiplayer Race <span className="text-accent">Lobby</span>
        </h1>
        <p className="text-sm text-fg/60 mt-1">
          Compete against players worldwide or race with friends in private rooms
        </p>
      </div>

      {/* Error notice */}
      {error && (
        <div className="w-full max-w-md mb-6 p-4 rounded-2xl bg-danger-soft border border-danger/30 text-danger text-xs flex items-center gap-2.5 shadow-card">
          <AlertCircle className="w-4 h-4 shrink-0 text-danger" />
          <span>{error}</span>
        </div>
      )}

      {/* QUEUE WAITING STATE */}
      {status === 'queuing' ? (
        <div className="w-full max-w-md rounded-2xl p-8 border border-border bg-surface shadow-card text-center flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-accent-soft text-accent border border-accent/20 flex items-center justify-center mb-4 shadow-sm">
            <Loader2 className="w-7 h-7 text-accent animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-fg mb-1">Searching for Opponents...</h2>
          <p className="text-xs text-fg/60 max-w-xs mb-6">
            Connecting you to an active match. If no players join within 8 seconds, bots will backfill automatically.
          </p>

          <button
            onClick={handleLeaveQueue}
            className="btn-secondary text-xs py-2.5 px-6 shadow-sm"
          >
            Cancel Matchmaking
          </button>
        </div>
      ) : status === 'lobby' && roomCode ? (
        /* PRIVATE ROOM LOBBY STATE */
        <div className="w-full max-w-lg rounded-2xl p-8 border border-border bg-surface shadow-card">
          {/* Room Header */}
          <div className="flex items-center justify-between pb-6 mb-6 border-b border-border">
            <div>
              <span className="text-xs uppercase font-bold tracking-widest text-accent">
                Private Room
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-black font-mono tracking-widest text-fg">
                  {roomCode}
                </span>
                <button
                  onClick={copyRoomCode}
                  className="p-1.5 rounded-lg border border-border bg-bg hover:bg-surface-hover text-fg transition-all duration-150 cursor-pointer shadow-sm active:scale-95"
                  title="Copy code"
                  aria-label="Copy room code"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-fg/60 block font-medium">Racers</span>
              <span className="text-lg font-bold text-accent font-mono">
                {players.length} / 4
              </span>
            </div>
          </div>

          {/* Racers list in private room */}
          <div className="space-y-2.5 mb-8">
            <div className="text-xs font-semibold uppercase text-fg/70 tracking-wider mb-2">
              Racers in Room
            </div>
            {players.map((p, idx) => (
              <div
                key={p.id || idx}
                className="flex items-center justify-between p-3 rounded-xl bg-bg border border-border"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-surface border border-border text-fg flex items-center justify-center font-bold text-xs">
                    {p.isBot ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-sm font-semibold text-fg">{p.username}</span>
                  {p.isHost && (
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-accent text-bg shadow-sm">
                      HOST
                    </span>
                  )}
                </div>
                <span className="text-xs text-accent font-semibold bg-accent-soft px-2 py-0.5 rounded border border-accent/20">Ready</span>
              </div>
            ))}
          </div>

          {/* Host Controls */}
          {isHost ? (
            <div className="space-y-3">
              <button
                onClick={handleStartRoom}
                disabled={players.length < 2}
                className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm transition-all duration-150 flex items-center justify-center gap-2 shadow-sm ${
                  players.length >= 2
                    ? 'bg-accent text-bg hover:bg-accent-hover hover:-translate-y-[1px] active:scale-[0.98] cursor-pointer'
                    : 'bg-surface text-fg/40 border border-border cursor-not-allowed opacity-60'
                }`}
              >
                <Play className="w-4 h-4 fill-current" />
                <span>
                  {players.length >= 2
                    ? `Start Race Now (${players.length} Racers Ready)`
                    : 'Need Minimum 2 Racers to Start'}
                </span>
              </button>

              <div className="text-center text-[11px] text-fg/60">
                {players.length < 2 ? (
                  <span>Share your 6-character room code with a friend to begin.</span>
                ) : players.length < 4 ? (
                  <span>You can start now with {players.length} racers, or wait for up to 4 players (game starts automatically at 4).</span>
                ) : (
                  <span className="text-accent font-semibold animate-pulse">Room full (4 racers)! Launching race automatically...</span>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center p-3.5 rounded-xl bg-bg border border-border text-xs text-fg/70 font-medium">
              {players.length < 2
                ? 'Waiting for more racers to join (minimum 2)...'
                : players.length >= 4
                ? 'Room full! Starting game...'
                : 'Ready! Waiting for host to start the race...'}
            </div>
          )}

          <div className="mt-4 text-center">
            <button
              onClick={handleLeaveRoom}
              className="text-xs text-fg/60 hover:text-danger hover:bg-danger-soft px-3 py-1.5 rounded-lg transition-all duration-150 flex items-center justify-center gap-1 mx-auto cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Leave Room</span>
            </button>
          </div>
        </div>
      ) : (
        /* DEFAULT LOBBY MODE SELECT */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
          {/* Public Quick Race Card */}
          <div className="rounded-2xl p-6 sm:p-8 border border-border bg-surface shadow-card flex flex-col justify-between hover:border-strong hover:bg-surface-hover transition-all duration-150">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-accent-soft text-accent border border-accent/20 flex items-center justify-center mb-4 shadow-sm">
                <Play className="w-6 h-6 fill-current" />
              </div>
              <h2 className="text-xl font-bold text-fg mb-2">Public Quick Race</h2>
              <p className="text-xs text-fg/60 leading-relaxed mb-6">
                Jump into the public matchmaking queue. Race 2 to 4 players with synchronized starts and bot fallback.
              </p>
            </div>

            <button
              onClick={handleJoinQueue}
              disabled={isJoiningQueue || status === 'queuing'}
              className="w-full py-3 px-5 rounded-xl bg-accent text-bg font-bold text-sm hover:bg-accent-hover hover:-translate-y-[1px] active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none transition-all duration-150 flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              {isJoiningQueue || status === 'queuing' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-bg" />
                  <span>Entering Queue...</span>
                </>
              ) : (
                <>
                  <Users className="w-4 h-4" />
                  <span>Join Public Queue</span>
                </>
              )}
            </button>
          </div>

          {/* Private Room Card */}
          <div className="rounded-2xl p-6 sm:p-8 border border-border bg-surface shadow-card flex flex-col justify-between hover:border-strong hover:bg-surface-hover transition-all duration-150">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-accent-soft text-accent border border-accent/20 flex items-center justify-center mb-4 shadow-sm">
                <KeyRound className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-fg mb-2">Private Room</h2>
              <p className="text-xs text-fg/60 leading-relaxed mb-4">
                Create a private room with a 6-character code or enter a code to race with friends.
              </p>

              {/* Join with code form */}
              <form onSubmit={handleJoinByCode} className="flex gap-2 mb-4">
                <input
                  type="text"
                  maxLength={6}
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  placeholder="6-CHAR CODE"
                  className="flex-1 px-3 py-2 rounded-xl bg-bg border border-border text-fg font-mono uppercase text-xs tracking-wider placeholder-fg/40 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-150"
                />
                <button
                  type="submit"
                  disabled={joinCodeInput.trim().length < 4}
                  className="px-4 py-2 rounded-xl bg-accent text-bg font-semibold text-xs hover:bg-accent-hover hover:-translate-y-[1px] active:scale-[0.98] disabled:opacity-50 transition-all duration-150 shadow-sm cursor-pointer"
                >
                  Join
                </button>
              </form>
            </div>

            <button
              onClick={handleCreateRoom}
              className="w-full py-3 px-5 rounded-xl bg-surface border border-strong text-fg hover:bg-surface-hover hover:border-accent active:scale-[0.98] font-semibold text-sm transition-all duration-150 flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <span>Create New Private Room</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
