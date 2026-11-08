import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { resetRace } from '../../race/raceSlice';
import RaceCanvas from './scene/RaceCanvas';
import F1StartLights from './F1StartLights';
import CarRaceHud from './CarRaceHud';
import CarRaceTypingArea from './CarRaceTypingArea';
import CarRaceResultsModal from './CarRaceResultsModal';
import { carRaceAudio } from './CarRaceAudio';
import { ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';

export default function CarRaceScreen() {
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
  const [isAudioMuted, setIsAudioMuted] = useState(carRaceAudio.isMuted);

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

  // If not in a race and no room, redirect to lobby
  useEffect(() => {
    if (status === 'idle' && !roomId) {
      navigate('/lobby');
    }
  }, [status, roomId, navigate]);

  // Identify own player state
  const myPlayer = useMemo(() => {
    return (
      players.find(
        (p) =>
          (socketId && p.id === socketId) ||
          (user?.id && p.userId === user.id) ||
          (user?._id && p.userId === user._id) ||
          (user?.username && p.username === user.username)
      ) || players[0]
    );
  }, [players, socketId, user]);

  // Sync engine sound with live speed
  useEffect(() => {
    if (status === 'racing' && myPlayer) {
      carRaceAudio.setSpeed(myPlayer.speed || 0, myPlayer.state || 'running');
    } else {
      carRaceAudio.setSpeed(0, 'idle');
    }

    return () => {
      carRaceAudio.setSpeed(0, 'idle');
    };
  }, [status, myPlayer?.speed, myPlayer?.state]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      carRaceAudio.stop();
    };
  }, []);

  const handleToggleAudio = () => {
    const muted = carRaceAudio.toggleMute();
    setIsAudioMuted(muted);
  };

  const handleProgress = (currentLength, hasError) => {
    if (status === 'racing' && roomId) {
      dispatch({
        type: 'socket/raceProgress',
        payload: { roomId, index: currentLength, hasError },
      });
    }
  };

  const handleFinish = (typedText, _durationMs, perfStats) => {
    if (perfStats) {
      setLocalPerfStats(perfStats);
    }
    if (roomId && !hasFinishedLocal) {
      setHasFinishedLocal(true);
      carRaceAudio.setSpeed(0, 'idle');
      dispatch({
        type: 'socket/raceFinish',
        payload: { roomId, typedText },
      });
    }
  };

  const handleExit = () => {
    carRaceAudio.stop();
    dispatch({ type: 'socket/roomLeave', payload: { roomId } });
    dispatch(resetRace());
    navigate('/lobby');
  };

  const handleRaceAgain = () => {
    carRaceAudio.stop();
    dispatch({ type: 'socket/roomLeave', payload: { roomId } });
    dispatch(resetRace());
    dispatch({ type: 'socket/queueJoin', payload: { gameId: 'car-race' } });
    navigate('/lobby');
  };

  const handleChangeGame = () => {
    carRaceAudio.stop();
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
    <div className="flex-1 flex flex-col justify-between max-w-5xl mx-auto w-full h-full overflow-hidden py-1 px-1 sm:px-2 gap-1.5">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between w-full flex-wrap gap-1.5 shrink-0">
        <button
          onClick={handleExit}
          className="flex items-center gap-1.5 text-xs text-fg/70 hover:text-fg py-1 px-2.5 rounded-lg bg-surface border border-border hover:bg-surface-hover hover:border-strong cursor-pointer shadow-sm active:scale-95 transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Exit Track</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-accent-soft text-accent border border-accent/30">
            🏎️ CAR RACE GP
          </span>
          <span
            className={`text-[11px] uppercase font-mono font-bold px-2 py-0.5 rounded-full border shadow-sm ${
              status === 'racing'
                ? 'bg-accent-soft text-accent border-accent/40 animate-pulse'
                : 'bg-surface text-fg/70 border-border'
            }`}
          >
            {status}
          </span>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="w-full p-2 rounded-xl bg-danger-soft border border-danger/30 text-danger text-xs flex items-center gap-2 shadow-sm shrink-0">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-danger" />
          <span>{error}</span>
        </div>
      )}

      {/* F1 5-Light Start Sequence */}
      {(status === 'countdown' || status === 'ready') && (
        <div className="shrink-0">
          <F1StartLights secondsLeft={countdownSeconds} isRacing={false} />
        </div>
      )}

      {/* Motorsport Racing HUD */}
      <div className="shrink-0">
        <CarRaceHud
          speed={myPlayer?.speed || 0}
          wpm={myPlayer?.wpm || 0}
          accuracy={myPlayer?.accuracy || 100}
          position={myPlayer?.position || 1}
          errors={myPlayer?.errors || 0}
          stalls={myPlayer?.stalls || 0}
          timeRemaining={timeRemaining}
          isAudioMuted={isAudioMuted}
          onToggleAudio={handleToggleAudio}
          state={myPlayer?.state || 'idle'}
        />
      </div>

      {/* Pseudo-3D Behind-The-Car Racing Track */}
      <div className="flex-1 min-h-[160px] max-h-[380px] w-full flex flex-col justify-center overflow-hidden">
        <RaceCanvas
          players={players}
          currentUserId={user?.id || user?._id}
          currentSocketId={socketId}
          currentUsername={user?.username}
          status={status}
          countdownSeconds={countdownSeconds}
          text={text}
          ownSpeed={myPlayer?.speed || 0}
          ownState={myPlayer?.state || 'idle'}
        />
      </div>

      {/* Single-Line Typing Area or Finished Waiting Overlay */}
      <div className="w-full relative shrink-0">
        <CarRaceTypingArea
          text={text || ''}
          disabled={isRacingDisabled || hasFinishedLocal}
          onProgress={handleProgress}
          onFinish={handleFinish}
        />

        {hasFinishedLocal && status !== 'finished' && (
          <div className="absolute inset-0 bg-bg/90 rounded-xl flex items-center justify-center gap-3 z-30 p-2 text-center backdrop-blur-sm">
            <span className="text-xl">🏁</span>
            <span className="text-sm font-bold font-mono text-fg">Crossed Finish Line!</span>
            <span className="text-xs text-fg/70 flex items-center gap-1 font-mono">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
              Waiting for final results...
            </span>
          </div>
        )}
      </div>

      {/* Podium Results Modal */}
      {status === 'finished' && myFinalStanding && (
        <CarRaceResultsModal
          isOpen={true}
          result={{ ...myFinalStanding, ...localPerfStats }}
          standings={standings}
          onRaceAgain={handleRaceAgain}
          onChangeGame={handleChangeGame}
          onHome={() => navigate('/')}
          isPersonalBest={myFinalStanding.wpm > (user?.bestWpm || 0)}
        />
      )}
    </div>
  );
}
