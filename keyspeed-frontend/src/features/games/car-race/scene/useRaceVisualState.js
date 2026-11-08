import { useRef, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { THEMES } from '../../../theme/themeSlice';
import { buildRoad } from './engine/road.js';
import { CAMERA_CONFIG, lerp } from './engine/projection.js';

export function useRaceVisualState({
  players = [],
  currentUserId,
  currentSocketId,
  currentUsername,
  status = 'idle',
  countdownSeconds = 0,
  text = '',
  textId = '',
}) {
  const currentThemeId = useSelector((state) => state.theme?.current || 'midnight');
  const themeAccent = useMemo(() => {
    return THEMES.find((t) => t.id === currentThemeId)?.accent || '#10b981';
  }, [currentThemeId]);

  // Find own player
  const myPlayer = useMemo(() => {
    return (
      players.find(
        (p) =>
          (currentSocketId && p.id === currentSocketId) ||
          (currentUserId && p.userId === currentUserId) ||
          (currentUsername && p.username === currentUsername)
      ) || players[0]
    );
  }, [players, currentSocketId, currentUserId, currentUsername]);

  // Road segments generated deterministically from text/textId
  const seedString = textId || text.slice(0, 30) || 'keyspeed-track';
  const roadSegments = useMemo(() => {
    // Road segments: approx 600 - 1200 segments based on text length
    const count = Math.max(500, Math.min(1200, Math.round((text.length || 100) * 2.5)));
    return buildRoad(count, seedString);
  }, [seedString, text.length]);

  const totalTrackLength = roadSegments.length * CAMERA_CONFIG.SEGMENT_LENGTH;

  // Visual ref that rAF loop can read at 60fps without React re-renders
  const stateRef = useRef({
    cameraZ: 0,
    cameraX: 0,
    currentProgress: 0,
    currentSpeed: 0,
    currentState: 'idle',
    lastState: 'idle',
    shouldTriggerStall: false,
    players: [],
    myPlayerId: '',
    myPlayerIndex: 0,
    roadSegments,
    totalTrackLength,
    themeAccent,
    status,
    countdownSeconds,
  });

  // Keep stateRef in sync with React props
  useEffect(() => {
    const s = stateRef.current;
    s.players = players;
    s.status = status;
    s.countdownSeconds = countdownSeconds;
    s.themeAccent = themeAccent;
    s.roadSegments = roadSegments;
    s.totalTrackLength = totalTrackLength;

    if (myPlayer) {
      s.myPlayerId = myPlayer.id || '';
      const idx = players.findIndex((p) => p.id === myPlayer.id);
      s.myPlayerIndex = idx >= 0 ? idx : 0;

      const targetProgress = Math.max(0, Math.min(100, myPlayer.progress || 0));
      const targetSpeed = myPlayer.speed || 0;
      const targetState = myPlayer.state || 'idle';

      // Detect transition to stalled
      if (targetState === 'stalled' && s.lastState !== 'stalled') {
        s.shouldTriggerStall = true;
      }
      s.lastState = targetState;
      s.currentState = targetState;
    }
  }, [players, myPlayer, status, countdownSeconds, themeAccent, roadSegments, totalTrackLength]);

  return stateRef;
}
