"use client";

import { useState } from "react";
import { GESTURE_EMOJI_MAP, GESTURE_LABELS } from "@/lib/gestureEmojiMap";

export interface MeaningHistoryItem {
  id: string; // unique id
  gesture: string;
  emoji: string;
  label: string | null;
  meaning: string;
  loading: boolean;
}

interface EmojiDisplayProps {
  liveGesture: string | null;
  liveProgress: number;
  history: MeaningHistoryItem[];
  onClearHistory: () => void;
  onRegenerate: (id: string, gesture: string, mode: string) => void;
}

export function EmojiDisplay({ liveGesture, liveProgress, history, onClearHistory, onRegenerate }: EmojiDisplayProps) {
  const [copied, setCopied] = useState(false);

  const topGesture = liveGesture || (history.length > 0 ? history[0].gesture : null);
  const topEmoji = topGesture ? GESTURE_EMOJI_MAP[topGesture] : null;
  const topLabel = topGesture ? GESTURE_LABELS[topGesture] : null;

  async function handleCopy() {
    if (!topEmoji) return;
    try {
      await navigator.clipboard.writeText(topEmoji);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API may fail without HTTPS
    }
  }

  async function handleCopyAll() {
    const emojis = history
      .map((g) => g.emoji)
      .filter(Boolean)
      .join("");
    if (!emojis) return;
    try {
      await navigator.clipboard.writeText(emojis);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API may fail without HTTPS
    }
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto">
      {/* Current emoji */}
      <div className="flex flex-col items-center gap-3 w-full">
        <div
          className="text-[120px] leading-none min-h-[140px] flex items-center justify-center transition-all duration-200 ease-out"
          style={{
            transform: topEmoji ? "scale(1)" : "scale(0.8)",
            opacity: topEmoji ? 1 : 0.3,
          }}
        >
          {topEmoji ?? "🫳"}
        </div>

        {topLabel && (
          <span className="text-white/50 text-sm tracking-wide uppercase font-medium">
            {topLabel}
          </span>
        )}

        {topEmoji && (
          <button
            onClick={handleCopy}
            className="px-4 py-2 mt-2 text-sm bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-xl text-white/80 transition-all duration-150 cursor-pointer"
          >
            {copied ? "Copied!" : "Copy Top Emoji"}
          </button>
        )}

        {/* Live progress text */}
        {liveGesture && liveProgress < 1 && liveProgress > 0 && (
          <div className="w-full mt-2 px-4 py-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-sm font-medium leading-relaxed text-center animate-pulse">
            Wait for meaning... Hold still {(liveProgress * 100).toFixed(0)}%
          </div>
        )}
      </div>

      {/* Gesture history feed */}
      {history.length > 0 && (
        <div className="flex flex-col items-center gap-3 w-full mt-4">
          <div className="text-white/30 text-xs uppercase tracking-widest flex items-center justify-between w-full px-1">
            <span>Meaning History</span>
            <div className="flex gap-2">
              <button
                onClick={handleCopyAll}
                className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-white/40 transition-colors cursor-pointer"
              >
                Copy All Emojis
              </button>
              <button
                onClick={onClearHistory}
                className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>
          
          <div className="flex flex-col gap-3 w-full max-h-[350px] overflow-y-auto pr-1">
            {history.map((item) => (
              <div key={item.id} className={`w-full flex flex-col gap-2 p-4 rounded-xl border ${item.loading ? "bg-white/10 border-white/20 shadow-md" : "bg-white/5 border-white/8"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl leading-none">{item.emoji}</span>
                    <span className="text-white/50 text-xs uppercase tracking-widest font-semibold">{item.label}</span>
                  </div>
                  {item.loading ? (
                    <div className="w-4 h-4 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
                  ) : (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => onRegenerate(item.id, item.gesture, "punjabi")}
                        className="px-2 py-0.5 text-[9px] uppercase font-bold tracking-widest text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 rounded-md transition-colors whitespace-nowrap"
                      >
                        Punjabi
                      </button>
                      <button
                        onClick={() => onRegenerate(item.id, item.gesture, "bhojpuri")}
                        className="px-2 py-0.5 text-[9px] uppercase font-bold tracking-widest text-green-400 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-md transition-colors whitespace-nowrap"
                      >
                        Bhojpuri
                      </button>
                      <button
                        onClick={() => onRegenerate(item.id, item.gesture, "hindi")}
                        className="px-2 py-0.5 text-[9px] uppercase font-bold tracking-widest text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-md transition-colors whitespace-nowrap"
                      >
                        Hindi
                      </button>
                    </div>
                  )}
                </div>
                <div className="text-white/80 text-sm leading-relaxed min-h-[1.5rem] mt-1">
                   {item.meaning}
                   {item.loading && !item.meaning && (
                     <span className="animate-pulse text-white/40">Thinking...</span>
                   )}
                   {item.loading && item.meaning && (
                     <span className="ml-1 inline-block w-1.5 h-4 bg-cyan-400 animate-pulse align-middle" />
                   )}
                   {!item.loading && !item.meaning && (
                     <span className="text-white/30 italic">No meaning generated.</span>
                   )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions when no gesture and no history */}
      {!topEmoji && history.length === 0 && (
        <div className="text-white/30 text-sm text-center max-w-[200px] leading-relaxed mt-4">
          Show a hand gesture to the camera to generate an emoji
        </div>
      )}
    </div>
  );
}
