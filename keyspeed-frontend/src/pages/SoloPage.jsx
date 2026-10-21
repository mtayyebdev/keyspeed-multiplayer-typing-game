import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLazyGetRandomTextQuery, useSubmitSoloMutation } from '../features/solo/soloApi';
import TypingEngine from '../components/typing/TypingEngine';
import ResultsModal from '../components/common/ResultsModal';
import {
  Flame,
  Loader2,
  Sparkles,
  AlertCircle,
  Gauge,
  SlidersHorizontal,
  FileText,
} from 'lucide-react';

const DIFFICULTIES = [
  { id: 'all', label: 'All' },
  { id: 'easy', label: 'Easy' },
  { id: 'normal', label: 'Normal' },
  { id: 'hard', label: 'Hard' },
];

const LENGTHS = [
  { id: 'all', label: 'All' },
  { id: 'short', label: 'Short (25w)' },
  { id: 'medium', label: 'Medium (35w)' },
  { id: 'long', label: 'Long (40w+)' },
];

export default function SoloPage() {
  const [difficulty, setDifficulty] = useState('all');
  const [lengthMode, setLengthMode] = useState('all');

  const [fetchRandomText, { data: textData, isLoading: isTextLoading, isFetching, error: textError }] =
    useLazyGetRandomTextQuery();
  const [submitSolo, { isLoading: isSubmitting }] = useSubmitSoloMutation();

  const [soloResult, setSoloResult] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const navigate = useNavigate();

  // Load random text based on selected filters
  const loadNewText = useCallback(
    (diff = difficulty, len = lengthMode) => {
      setIsCompleted(false);
      setSoloResult(null);
      fetchRandomText({ difficulty: diff, length: len });
    },
    [difficulty, lengthMode, fetchRandomText]
  );

  useEffect(() => {
    loadNewText('all', 'all');
  }, [loadNewText]);

  const handleDifficultyChange = (newDiff) => {
    setDifficulty(newDiff);
    loadNewText(newDiff, lengthMode);
  };

  const handleLengthChange = (newLen) => {
    setLengthMode(newLen);
    loadNewText(difficulty, newLen);
  };

  const handleFinish = async (typedText, durationMs, perfStats) => {
    if (!textData?._id) return;

    try {
      const result = await submitSolo({
        textId: textData._id,
        typedText,
        durationMs,
      }).unwrap();

      setSoloResult({
        ...result,
        timeline: perfStats?.timeline,
        correctChars: perfStats?.correctChars,
        errorChars: perfStats?.errorChars,
        totalChars: perfStats?.totalChars,
      });
      setIsCompleted(true);
    } catch (err) {
      console.error('Failed to submit solo result:', err);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full py-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-soft text-accent border border-accent/20 flex items-center justify-center shadow-sm">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-fg tracking-tight">
              Solo Practice <span className="text-accent">Arena</span>
            </h1>
            <p className="text-xs text-fg/60">
              Practice solo at your own speed with instant server-verified metrics
            </p>
          </div>
        </div>

        <button
          onClick={() => loadNewText(difficulty, lengthMode)}
          disabled={isTextLoading || isFetching}
          className="btn-secondary text-xs py-2 px-3.5 shadow-sm"
        >
          <Sparkles className={`w-3.5 h-3.5 text-accent ${isFetching ? 'animate-spin' : ''}`} />
          <span>Shuffle Text</span>
        </button>
      </div>

      {/* PRACTICE TYPE SELECTOR BAR */}
      <div className="w-full rounded-2xl p-3 sm:p-4 border border-border bg-surface shadow-card mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4 overflow-hidden">
        {/* Difficulty Selector */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-fg/70 shrink-0">
            <Gauge className="w-4 h-4 text-accent" />
            <span>Difficulty:</span>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-xl bg-bg border border-border flex-wrap sm:flex-nowrap">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.id}
                onClick={() => handleDifficultyChange(d.id)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs transition-all duration-150 whitespace-nowrap cursor-pointer ${
                  difficulty === d.id
                    ? 'bg-accent text-bg font-semibold shadow-sm border border-accent'
                    : 'bg-surface border border-border text-fg hover:bg-surface-hover hover:border-strong font-medium'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Length Selector */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-fg/70 shrink-0">
            <SlidersHorizontal className="w-4 h-4 text-accent" />
            <span>Length:</span>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-xl bg-bg border border-border flex-wrap sm:flex-nowrap">
            {LENGTHS.map((l) => (
              <button
                key={l.id}
                onClick={() => handleLengthChange(l.id)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs transition-all duration-150 whitespace-nowrap cursor-pointer ${
                  lengthMode === l.id
                    ? 'bg-accent text-bg font-semibold shadow-sm border border-accent'
                    : 'bg-surface border border-border text-fg hover:bg-surface-hover hover:border-strong font-medium'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Paragraph Info Bar */}
      {textData && !isCompleted && (
        <div className="w-full flex items-center justify-between text-xs px-2 mb-2 text-fg/60 font-mono">
          <div className="flex items-center gap-2">
            <span className="capitalize px-2 py-0.5 rounded-full text-[10px] font-bold border border-accent/20 bg-accent-soft text-accent">
              {textData.difficulty || 'normal'}
            </span>
            <span className="flex items-center gap-1 text-fg/70 font-semibold">
              <FileText className="w-3.5 h-3.5 text-accent" />
              {textData.wordCount} words
            </span>
          </div>
          <span className="text-[11px] text-fg/50">Language: English</span>
        </div>
      )}

      {/* Main Content Area */}
      {isTextLoading ? (
        <div className="w-full rounded-2xl p-16 border border-border bg-surface shadow-card flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
          <p className="text-xs text-fg/70 font-medium">Loading typing challenge...</p>
        </div>
      ) : textError ? (
        <div className="w-full rounded-2xl p-12 text-center flex flex-col items-center gap-4 border border-danger/30 bg-danger-soft shadow-card">
          <AlertCircle className="w-8 h-8 text-danger" />
          <p className="text-sm text-danger font-medium">Unable to load text from server.</p>
          <button
            onClick={() => loadNewText(difficulty, lengthMode)}
            className="btn-primary text-xs py-2 px-4 shadow-sm"
          >
            Retry
          </button>
        </div>
      ) : isCompleted && soloResult ? (
        <ResultsModal
          isOpen={isCompleted}
          result={soloResult}
          onPlayAgain={() => loadNewText(difficulty, lengthMode)}
          onNavigateHome={() => navigate('/')}
          title="Solo Test Completed!"
        />
      ) : (
        <div className="w-full relative">
          <TypingEngine
            key={textData?._id || 'typing-engine'}
            text={textData?.content || ''}
            disabled={isSubmitting}
            onFinish={handleFinish}
            onRestart={() => loadNewText(difficulty, lengthMode)}
            showLiveMetrics={true}
          />
          {isSubmitting && (
            <div className="absolute inset-0 bg-bg/80 rounded-3xl flex flex-col items-center justify-center gap-2 z-30">
              <Loader2 className="w-7 h-7 text-accent animate-spin" />
              <p className="text-xs text-accent font-semibold tracking-wide">
                Verifying score with server...
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
