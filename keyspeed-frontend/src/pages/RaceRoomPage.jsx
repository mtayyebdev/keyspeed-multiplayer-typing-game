import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { resetRace, clearCountdown } from '../features/race/raceSlice';
import RaceTrack from '../components/race/RaceTrack';
import CountdownOverlay from '../components/race/CountdownOverlay';
import TypingEngine from '../components/typing/TypingEngine';
import ResultsModal from '../components/common/ResultsModal';
import { Trophy, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';

export default function RaceRoomPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    status,
    roomId,
    text,
    countdownSeconds,
    players,
    standings,
    myResult,
    error,
    socketId,
  } = useSelector((state) => state.race);
  const { user } = useSelector((state) => state.auth);

  const [hasFinishedLocal, setHasFinishedLocal] = useState(false);
  const [localPerfStats, setLocalPerfStats] = useState(null);

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
      <div className="flex items-center justify-between w-full mb-6">
        <button
          onClick={handleExit}
          className="flex items-center gap-1.5 text-xs text-fg/70 hover:text-fg transition-all duration-150 py-1.5 px-3 rounded-lg bg-surface border border-border hover:bg-surface-hover hover:border-strong cursor-pointer shadow-sm active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Race</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-fg/60 font-semibold">
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
            <div className="absolute inset-0 bg-bg/85 rounded-3xl flex flex-col items-center justify-center gap-3 z-30">
              <div className="w-12 h-12 rounded-2xl bg-accent-soft border border-accent/30 text-accent flex items-center justify-center">
                <Trophy className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-bold text-fg">Finished!</h3>
              <p className="text-xs text-fg/60 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
                Waiting for remaining racers to cross the line...
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
