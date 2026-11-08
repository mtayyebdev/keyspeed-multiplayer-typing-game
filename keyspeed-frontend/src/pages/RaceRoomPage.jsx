import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { resetRace, clearCountdown } from '../features/race/raceSlice';
import RaceTrack from '../components/race/RaceTrack';
import CountdownOverlay from '../components/race/CountdownOverlay';
import TypingEngine from '../components/typing/TypingEngine';
import ResultsModal from '../components/common/ResultsModal';
import { Trophy, AlertCircle, ArrowLeft, Loader2, Timer, ShieldAlert } from 'lucide-react';

export default function RaceRoomPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    status,
    roomId,
    text,
    countdownSeconds,
    timeLimitSeconds,
    startAt,
    endAt,
    players,
    standings,
    myResult,
    error,
    socketId,
  } = useSelector((state) => state.race);
  const { user } = useSelector((state) => state.auth);

  const [hasFinishedLocal, setHasFinishedLocal] = useState(false);
  const [localPerfStats, setLocalPerfStats] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(timeLimitSeconds || 60);

  // Synchronized Race Countdown Timer
  useEffect(() => {
    if (status !== 'racing') {
      if (timeLimitSeconds) {
        setTimeRemaining(timeLimitSeconds);
      }
      return;
    }

    const targetEnd =
      endAt ||
      (startAt ? startAt + (timeLimitSeconds || 60) * 1000 : Date.now() + 60000);

    const checkTimer = () => {
      const remainingMs = Math.max(0, targetEnd - Date.now());
      const remainingSec = Math.ceil(remainingMs / 1000);
      setTimeRemaining(remainingSec);
    };

    checkTimer();
    const interval = setInterval(checkTimer, 500);
    return () => clearInterval(interval);
  }, [status, endAt, startAt, timeLimitSeconds]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // If not in a race and no room, redirect to lobby
  useEffect(() => {
    if (status === 'idle' && !roomId) {
      navigate('/lobby');
    }
  }, [status, roomId, navigate]);

  const handleProgress = (currentLength) => {
    if (status === 'racing' && roomId) {
      dispatch({
        type: 'socket/raceProgress',
        payload: { roomId, index: currentLength },
      });
    }
  };

  const handleFinish = (typedText, _durationMs, perfStats) => {
    if (perfStats) {
      setLocalPerfStats(perfStats);
    }
    if (roomId && !hasFinishedLocal) {
      setHasFinishedLocal(true);
      dispatch({
        type: 'socket/raceFinish',
        payload: { roomId, typedText },
      });
    }
  };

  const handleExit = () => {
    dispatch({ type: 'socket/roomLeave', payload: { roomId } });
    dispatch(resetRace());
    navigate('/lobby');
  };

  // Find user's result from final standings or individual finish
  const myFinalStanding =
    standings.find((s) => s.userId === user?.id || s.username === user?.username) ||
    myResult;

  const isRacingDisabled = status === 'countdown' || status === 'ready' || status === 'finished';

  return (
    <div className="flex-1 flex flex-col items-center justify-center max-w-5xl mx-auto w-full py-6">
      {/* 3-2-1-GO Animated Countdown Overlay */}
      <CountdownOverlay
        secondsLeft={countdownSeconds}
        onComplete={() => dispatch(clearCountdown())}
      />

      {/* Header bar */}
      <div className="flex items-center justify-between w-full mb-6 flex-wrap gap-3">
        <button
          onClick={handleExit}
          className="flex items-center gap-1.5 text-xs text-fg/70 hover:text-fg transition-all duration-150 py-1.5 px-3 rounded-lg bg-surface border border-border hover:bg-surface-hover hover:border-strong cursor-pointer shadow-sm active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Race</span>
        </button>

        <div className="flex items-center gap-2.5">
          {/* Active Race Countdown Timer */}
          {status === 'racing' && (
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border font-mono font-bold text-xs sm:text-sm shadow-sm transition-all ${
                timeRemaining <= 10
                  ? 'bg-danger-soft text-danger border-danger/40 animate-pulse'
                  : timeRemaining <= 20
                  ? 'bg-warning-soft text-warning border-warning/40'
                  : 'bg-surface text-accent border-accent/30'
              }`}
            >
              <Timer className="w-4 h-4 shrink-0" />
              <span>{formatTimer(timeRemaining)}</span>
              <span className="text-[10px] font-normal uppercase opacity-75 hidden sm:inline">
                left
              </span>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <span className="text-xs uppercase tracking-wider text-fg/60 font-semibold hidden sm:inline">
              Status:
            </span>
            <span
              className={`text-xs uppercase font-bold px-2.5 py-0.5 rounded-full border shadow-sm ${
                status === 'racing'
                  ? 'bg-accent-soft text-accent border-accent/30 animate-pulse'
                  : 'bg-surface text-fg/70 border-border'
              }`}
            >
              {status}
            </span>
          </div>
        </div>
      </div>

      {/* Error notice */}
      {error && (
        <div className="w-full mb-6 p-4 rounded-2xl bg-danger-soft border border-danger/30 text-danger text-xs flex items-center gap-2.5 shadow-card">
          <AlertCircle className="w-4 h-4 shrink-0 text-danger" />
          <span>{error}</span>
        </div>
      )}

      {/* Race Track showing animated cars for all racers */}
      <RaceTrack
        players={players}
        currentUserId={user?.id || user?._id}
        currentSocketId={socketId}
        currentUsername={user?.username}
      />

      {/* Results View or Typing Engine */}
      {status === 'finished' && myFinalStanding ? (
        <ResultsModal
          isOpen={true}
          result={{ ...myFinalStanding, ...localPerfStats }}
          onPlayAgain={handleExit}
          onNavigateHome={() => navigate('/')}
          title="Race Finished!"
        />
      ) : (
        <div className="w-full relative">
          <TypingEngine
            text={text || ''}
            disabled={isRacingDisabled || hasFinishedLocal}
            onProgress={handleProgress}
            onFinish={handleFinish}
            showLiveMetrics={true}
          />

          {hasFinishedLocal && status !== 'finished' && (
            <div className="absolute inset-0 bg-bg/85 rounded-3xl flex flex-col items-center justify-center gap-3 z-30 p-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-accent-soft border border-accent/30 text-accent flex items-center justify-center shadow-sm">
                <Trophy className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-bold text-fg">Finished!</h3>
              <p className="text-xs text-fg/70 flex items-center justify-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
                Waiting for timer or all racers to finish...
              </p>
              <span className="text-[11px] text-fg/50 max-w-sm">
                Final positions are calculated by <strong>Speed & Accuracy</strong>. Fewer errors yield higher podium positions.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
