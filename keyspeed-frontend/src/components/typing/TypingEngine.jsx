import React, { useRef, useEffect, useState, useCallback } from 'react';
import { calculateWpm, calculateAccuracy } from '../../lib/typingMetrics';
import { soundEngine } from '../../lib/soundEngine';
import { RotateCcw, Activity, MousePointerClick } from 'lucide-react';

/**
 * TypingEngine adheres strictly to Architecture Rule 4:
 * "Typing input must use refs and a hidden input, not React state per keystroke, to keep typing smooth."
 */
export default function TypingEngine({
  text = '',
  disabled = false,
  onProgress,
  onFinish,
  onRestart,
  showLiveMetrics = true,
}) {
  const hiddenInputRef = useRef(null);
  const containerRef = useRef(null);
  const charElementsRef = useRef([]);
  const typedTextRef = useRef('');
  const startTimeRef = useRef(null);
  const isFinishedRef = useRef(false);
  const timelineRef = useRef([]);
  const lastRecordedSecRef = useRef(0);

  // Periodic display metrics (updated on 200ms interval, NOT per keystroke)
  const [liveWpm, setLiveWpm] = useState(0);
  const [liveAccuracy, setLiveAccuracy] = useState(100);
  const [hasStarted, setHasStarted] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Focus the input element
  const focusInput = useCallback(() => {
    if (!disabled && !isFinishedRef.current && hiddenInputRef.current) {
      hiddenInputRef.current.focus();
    }
  }, [disabled]);

  // Reset internal states without triggering parent reload
  const resetInternalState = useCallback(() => {
    typedTextRef.current = '';
    startTimeRef.current = null;
    isFinishedRef.current = false;
    timelineRef.current = [];
    lastRecordedSecRef.current = 0;
    setLiveWpm(0);
    setLiveAccuracy(100);
    setHasStarted(false);

    if (hiddenInputRef.current) {
      hiddenInputRef.current.value = '';
    }

    // Reset DOM character styling
    charElementsRef.current.forEach((el, idx) => {
      if (el) {
        if (idx === 0) {
          el.className = 'char-span text-fg bg-accent-soft border-b-2 border-accent caret-blink rounded-sm font-semibold char-instant';
        } else {
          el.className = 'char-span text-fg/45 char-instant';
        }
      }
    });

    focusInput();
  }, [focusInput]);

  // Triggered on text change
  useEffect(() => {
    resetInternalState();
  }, [text, resetInternalState]);

  // Global keydown capture: start typing immediately even if not focused
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (disabled || isFinishedRef.current) return;

      // Don't intercept if user is typing in another input/textarea
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === 'input' && document.activeElement !== hiddenInputRef.current) return;
      if (activeTag === 'textarea') return;

      if (e.key === 'Tab') return;

      if (hiddenInputRef.current && document.activeElement !== hiddenInputRef.current) {
        hiddenInputRef.current.focus();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [disabled]);

  // Live metrics interval (every 200ms)
  useEffect(() => {
    if (disabled || isFinishedRef.current) return;

    const interval = setInterval(() => {
      if (startTimeRef.current && typedTextRef.current.length > 0) {
        const elapsedMs = Date.now() - startTimeRef.current;
        const currentTyped = typedTextRef.current;

        const currentWpm = calculateWpm(currentTyped.length, elapsedMs);
        const { accuracy, errors } = calculateAccuracy(text, currentTyped);

        setLiveWpm(currentWpm);
        setLiveAccuracy(accuracy);

        // Record second-by-second timeline snapshot for performance analytics
        const currentSec = Math.max(1, Math.floor(elapsedMs / 1000));
        if (currentSec > lastRecordedSecRef.current) {
          lastRecordedSecRef.current = currentSec;
          const rawWpm = Math.round((currentTyped.length / 5) / (elapsedMs / 60000)) || currentWpm;
          timelineRef.current.push({
            second: currentSec,
            wpm: currentWpm,
            rawWpm,
            accuracy,
            errors,
          });
        }
      }
    }, 200);

    return () => clearInterval(interval);
  }, [disabled, text]);

  const handleInput = (e) => {
    if (disabled || isFinishedRef.current) return;

    // Start timer on very first keystroke
    if (!startTimeRef.current) {
      startTimeRef.current = Date.now();
      setHasStarted(true);
    }

    const value = e.target.value;
    if (value.length > text.length) {
      e.target.value = value.substring(0, text.length);
      return;
    }

    typedTextRef.current = value;
    const currentLength = value.length;

    // Directly update DOM character elements using refs (no React rerender)
    charElementsRef.current.forEach((el, idx) => {
      if (!el) return;

      if (idx < currentLength) {
        const expectedChar = text[idx];
        const typedChar = value[idx];

        if (typedChar === expectedChar) {
          el.className = 'char-span text-fg font-semibold char-instant';
        } else {
          el.className = 'char-span text-danger bg-danger-soft rounded px-0.5 shake char-instant';
        }
      } else if (idx === currentLength) {
        // Active caret on current character with accent-soft background and accent underline
        el.className = 'char-span text-fg bg-accent-soft border-b-2 border-accent caret-blink rounded-sm font-semibold char-instant';
      } else {
        // Pending untyped characters at 45% opacity
        el.className = 'char-span text-fg/45 char-instant';
      }
    });

    if (onProgress) {
      onProgress(currentLength);
    }

    if (currentLength >= text.length) {
      isFinishedRef.current = true;
      const durationMs = Date.now() - startTimeRef.current;
      const { accuracy, errors } = calculateAccuracy(text, value);
      const finalWpm = calculateWpm(value.length, durationMs);
      const rawWpm = Math.round((value.length / 5) / (durationMs / 60000)) || finalWpm;

      let correctChars = 0;
      let errorChars = 0;
      for (let i = 0; i < text.length; i++) {
        if (value[i] === text[i]) {
          correctChars++;
        } else {
          errorChars++;
        }
      }

      // Ensure final point exists in timeline
      const finalSec = Math.max(1, Math.round(durationMs / 1000));
      const timeline = [...timelineRef.current];
      if (timeline.length === 0 || timeline[timeline.length - 1].second !== finalSec) {
        timeline.push({
          second: finalSec,
          wpm: finalWpm,
          rawWpm,
          accuracy,
          errors,
        });
      }

      const performanceStats = {
        timeline,
        correctChars,
        errorChars,
        totalChars: text.length,
        wpm: finalWpm,
        rawWpm,
        accuracy,
        errors,
        durationMs,
      };

      if (onFinish) {
        onFinish(value, durationMs, performanceStats);
      }
    }
  };

  const handleManualRestart = (e) => {
    e.stopPropagation();
    resetInternalState();
    if (onRestart) {
      onRestart();
    }
  };

  return (
    <div
      ref={containerRef}
      onClick={focusInput}
      className={`relative w-full rounded-2xl p-6 sm:p-8 bg-surface border border-strong shadow-card transition-all duration-150 cursor-text select-none group ${
        isFocused ? 'ring-2 ring-accent/30 border-accent' : ''
      }`}
    >
      {/* Live HUD */}
      {showLiveMetrics && (
        <div className="flex items-center justify-between pb-5 mb-5 border-b border-border">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-accent animate-pulse" />
              <span className="text-2xl font-black text-accent font-mono">
                {liveWpm}
              </span>
              <span className="text-xs uppercase text-fg/60 font-bold tracking-wider">
                WPM
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-fg font-mono">
                {liveAccuracy}%
              </span>
              <span className="text-xs uppercase text-fg/60 font-bold tracking-wider">
                ACC
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!hasStarted && (
              <span className="text-xs text-fg/60 hidden sm:flex items-center gap-1.5 animate-pulse">
                <MousePointerClick className="w-3.5 h-3.5 text-accent" />
                Click or start typing to begin
              </span>
            )}
            <button
              onClick={handleManualRestart}
              title="Restart typing test"
              aria-label="Restart typing test"
              className="p-2 rounded-xl text-fg/70 hover:text-fg hover:bg-surface-hover transition-all duration-150 border border-transparent hover:border-border cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Hidden input overlay catching all physical and mobile keystrokes */}
      <input
        ref={hiddenInputRef}
        type="text"
        autoFocus
        disabled={disabled}
        onChange={handleInput}
        onKeyDown={(e) => {
          if (!disabled && !isFinishedRef.current) {
            soundEngine.playKey(e.key);
          }
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-text z-10"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
      />

      {/* Target text with character level refs */}
      <div className="font-mono text-xl sm:text-2xl leading-relaxed sm:leading-loose tracking-wide break-words relative z-0">
        {text.split('').map((char, index) => (
          <span
            key={index}
            ref={(el) => (charElementsRef.current[index] = el)}
            className={`char-span ${
              index === 0
                ? 'text-fg bg-accent-soft border-b-2 border-accent caret-blink rounded-sm font-semibold'
                : 'text-fg/45'
            } char-instant`}
          >
            {char}
          </span>
        ))}
      </div>

      {disabled && (
        <div className="absolute inset-0 bg-bg/85 rounded-2xl flex items-center justify-center pointer-events-none z-20">
          <span className="text-xs font-bold uppercase tracking-widest text-accent bg-surface px-4 py-2 rounded-full border border-accent/40 shadow-card">
            Waiting for countdown...
          </span>
        </div>
      )}
    </div>
  );
}
