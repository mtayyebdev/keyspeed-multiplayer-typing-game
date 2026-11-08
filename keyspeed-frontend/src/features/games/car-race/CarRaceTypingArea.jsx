import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { AlertOctagon, RotateCcw, CornerDownLeft } from 'lucide-react';

/**
 * Split text into single-line chunks of approximately targetLength chars,
 * cleanly breaking on word boundaries and preserving every space.
 */
export function splitTextIntoLines(text, targetLength = 45) {
  if (!text) return [];
  const words = text.split(' ');
  const lines = [];
  let currentWords = [];
  let currentLen = 0;
  let charOffset = 0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const addedLen = currentWords.length > 0 ? word.length + 1 : word.length;

    if (currentLen + addedLen > targetLength && currentWords.length > 0) {
      const lineText = currentWords.join(' ') + ' ';
      lines.push({
        text: lineText,
        start: charOffset,
        end: charOffset + lineText.length,
      });
      charOffset += lineText.length;
      currentWords = [word];
      currentLen = word.length;
    } else {
      currentWords.push(word);
      currentLen += addedLen;
    }
  }

  if (currentWords.length > 0) {
    const lineText = currentWords.join(' ');
    lines.push({
      text: lineText,
      start: charOffset,
      end: charOffset + lineText.length,
    });
  }

  return lines;
}

/**
 * CarRaceTypingArea - Single-Line Focused Typing Engine.
 * Shows ONLY ONE LINE of text at a time.
 * When a line completes, it transitions to the next line automatically.
 * Drastically saves vertical space, prevents screen scrolling,
 * and maintains server-authoritative stop-on-error rules.
 */
export default function CarRaceTypingArea({
  text = '',
  disabled = false,
  onProgress,
  onFinish,
}) {
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const startTimeRef = useRef(null);

  const [cursorIndex, setCursorIndex] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [wrongChar, setWrongChar] = useState('');
  const [errorCount, setErrorCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // Divide text into single-line segments
  const lines = useMemo(() => {
    return splitTextIntoLines(text, 45);
  }, [text]);

  // Find active line index based on cursor
  const activeLineIndex = useMemo(() => {
    if (!lines.length) return 0;
    const foundIdx = lines.findIndex(
      (line) => cursorIndex >= line.start && cursorIndex < line.end
    );
    return foundIdx >= 0 ? foundIdx : Math.max(0, lines.length - 1);
  }, [lines, cursorIndex]);

  const activeLine = lines[activeLineIndex] || {
    text: '',
    start: 0,
    end: 0,
  };

  // State ref for high-frequency keydown listener
  const stateRef = useRef({
    cursorIndex: 0,
    hasError: false,
    text,
    disabled,
    errorCount: 0,
    isCompleted: false,
  });

  stateRef.current = {
    cursorIndex,
    hasError,
    text,
    disabled,
    errorCount,
    isCompleted,
  };

  // Keep input focused
  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled]);

  const handleContainerClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = useCallback(
    (e) => {
      const {
        cursorIndex: currentCursor,
        hasError: currentError,
        text: targetText,
        disabled: isDisabled,
        errorCount: currentErrors,
        isCompleted: done,
      } = stateRef.current;

      if (isDisabled || done) return;

      if (!startTimeRef.current) {
        startTimeRef.current = Date.now();
      }

      // Backspace: clears error state
      if (e.key === 'Backspace') {
        e.preventDefault();
        if (currentError) {
          setHasError(false);
          setWrongChar('');
          if (onProgress) {
            onProgress(currentCursor, false);
          }
        }
        return;
      }

      // Ignore modifier keys
      if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      e.preventDefault();

      // Stop-on-error: blocks all input until backspace pressed
      if (currentError) {
        return;
      }

      const expectedChar = targetText[currentCursor];

      if (e.key === expectedChar) {
        const nextIndex = currentCursor + 1;
        setCursorIndex(nextIndex);

        if (onProgress) {
          onProgress(nextIndex, false);
        }

        // Finish text
        if (nextIndex >= targetText.length) {
          setIsCompleted(true);
          const durationMs = Math.max(1000, Date.now() - (startTimeRef.current || Date.now()));
          const wpm = Math.round((targetText.length / 5) / (durationMs / 60000));
          const accuracy = Math.max(
            0,
            Math.round(((targetText.length - currentErrors) / targetText.length) * 100)
          );

          if (onFinish) {
            onFinish(targetText, durationMs, {
              wpm,
              accuracy,
              errors: currentErrors,
              durationMs,
            });
          }
        }
      } else {
        // Wrong character typed -> engine stall!
        const newErrorCount = currentErrors + 1;
        setHasError(true);
        setWrongChar(e.key === ' ' ? '␣' : e.key);
        setErrorCount(newErrorCount);

        if (onProgress) {
          onProgress(currentCursor, true);
        }
      }
    },
    [onProgress, onFinish]
  );

  const lineChars = activeLine.text.split('');

  return (
    <div
      ref={containerRef}
      onClick={handleContainerClick}
      className={`relative w-full px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border bg-surface shadow-sm transition-all cursor-text outline-none select-none ${
        disabled
          ? 'opacity-60 pointer-events-none border-border'
          : hasError
          ? 'border-danger/80 ring-2 ring-danger/20'
          : 'border-border hover:border-strong'
      }`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Hidden input to capture focus on desktop & mobile */}
      <input
        ref={inputRef}
        type="text"
        className="absolute opacity-0 pointer-events-none w-0 h-0"
        autoCapitalize="none"
        autoComplete="off"
        autoCorrect="off"
        spellCheck="false"
        disabled={disabled}
      />

      {/* Header telemetry: Line progress & character count */}
      <div className="flex items-center justify-between text-[10px] font-mono text-fg/60 mb-1">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-bg border border-border font-bold text-accent">
            LINE {activeLineIndex + 1}/{lines.length || 1}
          </span>
          {hasError ? (
            <span className="text-danger font-bold flex items-center gap-1 animate-pulse">
              <AlertOctagon className="w-3 h-3 text-danger" />
              <span>STALLED ON '{wrongChar}' • PRESS BACKSPACE</span>
            </span>
          ) : (
            <span className="opacity-70 hidden sm:inline">Type active line to advance</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 font-bold">
          <span>{cursorIndex}</span>
          <span className="opacity-40">/</span>
          <span>{text.length} chars</span>
        </div>
      </div>

      {/* Single Line Text Display */}
      <div className="font-mono text-base sm:text-lg md:text-xl leading-normal tracking-wide whitespace-pre overflow-x-auto overflow-y-hidden py-1 px-1 select-none scrollbar-none">
        {lineChars.map((char, localIdx) => {
          const globalIdx = activeLine.start + localIdx;
          const isTyped = globalIdx < cursorIndex;
          const isCurrent = globalIdx === cursorIndex;
          const displayChar = char === ' ' ? '\u00A0' : char;

          if (isTyped) {
            return (
              <span key={globalIdx} className="text-accent font-semibold">
                {displayChar}
              </span>
            );
          }

          if (isCurrent) {
            if (hasError) {
              return (
                <span
                  key={globalIdx}
                  className="bg-danger text-bg border-b-2 border-danger font-black px-1 rounded-sm animate-pulse"
                >
                  {char === ' ' ? '␣' : char}
                </span>
              );
            }

            return (
              <span
                key={globalIdx}
                className="relative text-bg bg-accent font-bold px-1 rounded-sm animate-pulse shadow-sm"
              >
                {char === ' ' ? '␣' : char}
              </span>
            );
          }

          return (
            <span key={globalIdx} className="text-fg/40">
              {displayChar}
            </span>
          );
        })}

        {/* Small next-line indicator at end of line */}
        {activeLineIndex < lines.length - 1 && (
          <span className="inline-block ml-2 text-fg/30 text-xs">
            ↵
          </span>
        )}
      </div>
    </div>
  );
}
