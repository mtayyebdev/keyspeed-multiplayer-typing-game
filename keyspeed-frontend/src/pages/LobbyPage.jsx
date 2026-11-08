import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { resetRace, setSelectedGame } from '../features/race/raceSlice';
import { getAllGames, getGame } from '../features/games/registry';
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
  ArrowLeft,
  AlertCircle,
  Radio,
  Gamepad2,
} from 'lucide-react';

export default function LobbyPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth?.user);
  const {
    status,
    roomId,
    roomCode,
    gameId,
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
      (hostPlayer &&
        (user?.id || user?._id) &&
        (hostPlayer.userId === user?.id || hostPlayer.userId === user?._id))
  );

  // 3-step state: 1 = Choose Mode, 2 = Choose Game, 3 = Start / Lobby / Queue
  const [step, setStep] = useState(1);
  const [selectedMode, setSelectedMode] = useState(null); // 'queue' | 'room'
  const [activeGameId, setActiveGameId] = useState(gameId || 'classic-race');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  // Sync step with Redux race status
  useEffect(() => {
    if (status === 'ready' || status === 'countdown' || status === 'racing') {
      navigate('/race');
    } else if (status === 'lobby' || status === 'queuing') {
      setStep(3);
    }
  }, [status, navigate]);

  const allGames = getAllGames();
  const currentGame = getGame(activeGameId);

  // Mode Selection Handlers
  const handleSelectMode = (mode) => {
    setSelectedMode(mode);
    setStep(2);
  };

  // Game Selection Handler
  const handleSelectGame = (gId) => {
    setActiveGameId(gId);
    dispatch(setSelectedGame(gId));

    if (selectedMode === 'queue') {
      dispatch({ type: 'socket/queueJoin', payload: { gameId: gId } });
      setStep(3);
    } else if (selectedMode === 'room') {
      dispatch({ type: 'socket/roomCreate', payload: { gameId: gId, isPrivate: true } });
      setStep(3);
    }
  };

  // Direct Join by Code
  const handleJoinByCode = (e) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    dispatch({ type: 'socket/roomJoin', payload: joinCodeInput.trim().toUpperCase() });
    setStep(3);
  };

  const handleCancelQueue = () => {
    dispatch({ type: 'socket/queueLeave' });
    dispatch(resetRace());
    setStep(2);
  };

  const handleLeaveRoom = () => {
    dispatch({ type: 'socket/roomLeave', payload: { roomId, roomCode } });
    dispatch(resetRace());
    setStep(1);
  };

  const handleStartRoom = () => {
    dispatch({ type: 'socket/roomStart', payload: { roomId, roomCode } });
  };

  const copyRoomCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  // Step transition animations
  const stepVariants = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
    exit: { opacity: 0, y: -15, transition: { duration: 0.2 } },
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full py-8 px-4">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-fg tracking-tight">
          Live Race <span className="text-accent">Paddock</span>
        </h1>
        <p className="text-sm text-fg/60 mt-1">
          {step === 1 && 'Step 1 of 3: Choose your matchmaking destination'}
          {step === 2 && 'Step 2 of 3: Select your racing discipline'}
          {step === 3 && (status === 'queuing' ? 'Step 3 of 3: Matchmaking in progress' : 'Step 3 of 3: Room lobby grid')}
        </p>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="w-full max-w-md mb-6 p-4 rounded-2xl bg-danger-soft border border-danger/30 text-danger text-xs flex items-center gap-2.5 shadow-card">
          <AlertCircle className="w-4 h-4 shrink-0 text-danger" />
          <span>{error}</span>
        </div>
      )}

      {/* Stepper Flow Container */}
      <AnimatePresence mode="wait">
        {/* ================= STEP 1: CHOOSE MODE ================= */}
        {step === 1 && (
          <motion.div
            key="step-1"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full flex flex-col gap-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* Option A: Public Matchmaking */}
              <button
                onClick={() => handleSelectMode('queue')}
                className="group relative flex flex-col items-start p-6 rounded-3xl bg-surface border-2 border-border hover:border-accent hover:bg-surface-hover text-left transition-all duration-200 cursor-pointer shadow-card active:scale-[0.98]"
              >
                <div className="w-12 h-12 rounded-2xl bg-accent-soft border border-accent/40 text-accent flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Play className="w-6 h-6 fill-current" />
                </div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-fg">Join Public Queue</h3>
                  <span className="text-[10px] font-mono uppercase font-extrabold px-2 py-0.5 rounded-full bg-accent-soft text-accent border border-accent/30">
                    Instant
                  </span>
                </div>
                <p className="text-xs text-fg/70 mt-2 leading-relaxed">
                  Enter matchmaking to race against live players worldwide. If no opponents join within seconds, smart AI bots fill the empty grid.
                </p>
                <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-accent">
                  <span>Continue to game select</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Option B: Create Private Room */}
              <button
                onClick={() => handleSelectMode('room')}
                className="group relative flex flex-col items-start p-6 rounded-3xl bg-surface border-2 border-border hover:border-accent hover:bg-surface-hover text-left transition-all duration-200 cursor-pointer shadow-card active:scale-[0.98]"
              >
                <div className="w-12 h-12 rounded-2xl bg-surface-hover border border-border text-fg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-fg">Create Room</h3>
                  <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-surface border border-border text-fg/70">
                    Host
                  </span>
                </div>
                <p className="text-xs text-fg/70 mt-2 leading-relaxed">
                  Host a custom multiplayer room with a unique 6-character room code. Share the code with friends and start when ready.
                </p>
                <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-accent">
                  <span>Set up room & choose game</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </div>

            {/* Direct Join by Room Code Box */}
            <div className="w-full bg-surface border border-border rounded-2xl p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-bg border border-border flex items-center justify-center text-accent">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-fg">Have a friend's room code?</h4>
                    <p className="text-xs text-fg/60">Enter the 6-character room code to join their lobby directly</p>
                  </div>
                </div>

                <form onSubmit={handleJoinByCode} className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="text"
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                    placeholder="CODE"
                    maxLength={6}
                    className="w-full sm:w-32 px-3 py-2 bg-bg border border-border rounded-xl text-center font-mono font-bold tracking-widest text-fg text-sm uppercase focus:outline-none focus:border-accent"
                  />
                  <button
                    type="submit"
                    disabled={!joinCodeInput.trim()}
                    className="py-2 px-4 rounded-xl bg-accent text-bg font-bold text-xs hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 cursor-pointer whitespace-nowrap"
                  >
                    Join
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        )}

        {/* ================= STEP 2: CHOOSE GAME ================= */}
        {step === 2 && (
          <motion.div
            key="step-2"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full flex flex-col gap-5"
          >
            {/* Top Bar with Back Button */}
            <div className="flex items-center justify-between w-full">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 text-xs text-fg/70 hover:text-fg py-1.5 px-3 rounded-xl bg-surface border border-border hover:bg-surface-hover cursor-pointer shadow-sm active:scale-95 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Mode</span>
              </button>

              <span className="text-xs font-mono font-bold uppercase text-accent">
                Mode: {selectedMode === 'queue' ? 'Public Queue' : 'Private Room'}
              </span>
            </div>

            {/* Game Selection Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {allGames.map((game) => {
                const IconComponent = game.icon || Gamepad2;
                const isSelected = activeGameId === game.id;

                return (
                  <button
                    key={game.id}
                    onClick={() => handleSelectGame(game.id)}
                    className={`group relative flex flex-col p-6 rounded-3xl border-2 text-left transition-all duration-200 cursor-pointer shadow-card active:scale-[0.98] ${
                      isSelected
                        ? 'bg-surface border-accent ring-2 ring-accent/30'
                        : 'bg-surface border-border hover:border-accent/60 hover:bg-surface-hover'
                    }`}
                  >
                    {/* Badge */}
                    <div className="flex items-center justify-between w-full mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-accent-soft border border-accent/40 text-accent flex items-center justify-center group-hover:scale-110 transition-transform">
                        <IconComponent className="w-6 h-6" />
                      </div>

                      <span
                        className={`text-[10px] font-mono uppercase font-black px-2.5 py-0.5 rounded-full border ${
                          game.badge === 'New'
                            ? 'bg-accent text-bg border-accent'
                            : 'bg-bg text-fg/80 border-border'
                        }`}
                      >
                        {game.badge}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-fg flex items-center gap-2">
                      {game.name}
                    </h3>

                    <p className="text-xs text-fg/70 mt-2 leading-relaxed flex-1">
                      {game.shortDescription}
                    </p>

                    <div className="mt-5 pt-3 border-t border-border w-full flex items-center justify-between text-xs font-mono">
                      <span className="text-fg/60">
                        {game.minPlayers} - {game.maxPlayers} Racers
                      </span>
                      <span className="text-accent font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                        Select Game <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ================= STEP 3: START (LOBBY OR QUEUE) ================= */}
        {step === 3 && (
          <motion.div
            key="step-3"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full flex flex-col items-center gap-6"
          >
            {/* Case A: Searching for Players in Public Queue */}
            {status === 'queuing' ? (
              <div className="w-full max-w-lg bg-surface border-2 border-border-strong rounded-3xl p-8 shadow-card flex flex-col items-center text-center gap-5">
                <div className="relative w-20 h-20 rounded-full bg-accent-soft border-2 border-accent/40 flex items-center justify-center text-accent">
                  <Radio className="w-10 h-10 animate-pulse text-accent" />
                  <div className="absolute inset-0 rounded-full border border-accent animate-ping opacity-40 pointer-events-none" />
                </div>

                <div>
                  <h3 className="text-2xl font-black text-fg tracking-tight">
                    Searching for Racers...
                  </h3>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-2 rounded-full bg-bg border border-border text-xs font-mono font-bold text-accent">
                    <span>Discipline:</span>
                    <span>{currentGame.name}</span>
                  </div>
                </div>

                <p className="text-xs text-fg/70 max-w-sm leading-relaxed">
                  Searching for opponents matching your pace. If no live players enter within a few moments, AI racers will backfill to start the race countdown.
                </p>

                <div className="w-full pt-4 border-t border-border flex items-center justify-center">
                  <button
                    onClick={handleCancelQueue}
                    className="py-2.5 px-6 rounded-xl bg-danger-soft border border-danger/30 text-danger text-xs font-mono font-bold hover:bg-danger/20 transition-all cursor-pointer active:scale-95 shadow-sm"
                  >
                    Cancel Matchmaking
                  </button>
                </div>
              </div>
            ) : (
              /* Case B: Room Lobby (Created or Joined) */
              <div className="w-full max-w-2xl bg-surface border-2 border-border-strong rounded-3xl p-6 sm:p-8 shadow-card flex flex-col gap-6">
                {/* Lobby Header & Room Code Display */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-5 border-b border-border">
                  <div className="text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <h3 className="text-xl font-bold text-fg">Race Room Lobby</h3>
                      <span className="text-[10px] font-mono font-black uppercase px-2.5 py-0.5 rounded-full bg-accent-soft text-accent border border-accent/30">
                        {currentGame.name}
                      </span>
                    </div>
                    <p className="text-xs text-fg/60 mt-0.5">
                      Share the code below with your racing crew
                    </p>
                  </div>

                  {/* 6-Character Room Code with Copy Button */}
                  {roomCode && (
                    <div className="flex items-center gap-2 bg-bg px-4 py-2 rounded-2xl border-2 border-border-strong shadow-sm">
                      <span className="font-mono text-xl sm:text-2xl font-black tracking-widest text-accent">
                        {roomCode}
                      </span>
                      <button
                        onClick={copyRoomCode}
                        className="p-1.5 rounded-lg bg-surface border border-border hover:bg-surface-hover text-fg/70 hover:text-fg active:scale-95 transition-all cursor-pointer"
                        title="Copy Room Code"
                      >
                        {copiedCode ? (
                          <Check className="w-4 h-4 text-accent" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Racer Grid (Slots 1 to 4) */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-fg/70">
                      Starting Grid ({players.length} / 4)
                    </span>
                    <span className="text-[11px] text-fg/50 font-mono">Min 2 to start</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[0, 1, 2, 3].map((slotIdx) => {
                      const player = players[slotIdx];

                      if (player) {
                        const isMe =
                          (socketId && player.id === socketId) ||
                          (user?.username && player.username === user.username);

                        return (
                          <div
                            key={player.id || slotIdx}
                            className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                              isMe
                                ? 'bg-accent-soft/40 border-accent/50 text-fg'
                                : 'bg-bg border-border text-fg'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                                  player.isHost
                                    ? 'bg-accent text-bg font-bold'
                                    : 'bg-surface border border-border text-fg'
                                }`}
                              >
                                {player.isBot ? (
                                  <Bot className="w-4 h-4" />
                                ) : (
                                  <User className="w-4 h-4" />
                                )}
                              </div>
                              <div>
                                <span className="font-bold text-sm block leading-tight truncate max-w-[140px]">
                                  {player.username}
                                  {isMe ? ' (You)' : ''}
                                </span>
                                <span className="text-[10px] font-mono text-fg/60">
                                  {player.isHost ? 'Host' : 'Racer'}
                                </span>
                              </div>
                            </div>

                            {player.isHost && (
                              <span className="text-[10px] font-mono font-bold text-accent px-2 py-0.5 rounded-full bg-accent-soft border border-accent/30">
                                HOST
                              </span>
                            )}
                          </div>
                        );
                      }

                      return (
                        <div
                          key={`empty-${slotIdx}`}
                          className="p-3.5 rounded-2xl border-2 border-dashed border-border/50 bg-bg/40 flex items-center justify-center text-fg/30 text-xs font-mono"
                        >
                          Slot {slotIdx + 1} Open
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Host Controls / Waiting Notice */}
                <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    onClick={handleLeaveRoom}
                    className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-surface border border-border hover:bg-surface-hover text-fg/70 hover:text-fg text-xs font-mono font-bold transition-all cursor-pointer active:scale-95"
                  >
                    Leave Room
                  </button>

                  {isHost ? (
                    <button
                      onClick={handleStartRoom}
                      disabled={players.length < 2}
                      className="w-full sm:w-auto py-3 px-8 rounded-xl bg-accent text-bg font-mono font-extrabold text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-sm cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>{players.length < 2 ? 'Need 2+ Players' : 'Start Race'}</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 text-xs font-mono text-fg/70">
                      <Loader2 className="w-4 h-4 animate-spin text-accent" />
                      <span>Waiting for room host to start...</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
