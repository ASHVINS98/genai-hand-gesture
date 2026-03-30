"use client";

import { useState } from "react";
import { GESTURE_EMOJI_MAP, GESTURE_LABELS } from "@/lib/gestureEmojiMap";

interface EmojiDisplayProps {
  gesture: string | null;
  history: string[];
  meaning: string;
  meaningLoading: boolean;
}

export function EmojiDisplay({ gesture, history, meaning, meaningLoading }: EmojiDisplayProps) {
  const [copied, setCopied] = useState(false);

  const emoji = gesture ? GESTURE_EMOJI_MAP[gesture] : null;
  const label = gesture ? GESTURE_LABELS[gesture] : null;

  async function handleCopy() {
    if (!emoji) return;
    try {
      await navigator.clipboard.writeText(emoji);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API may fail without HTTPS
    }
  }

  async function handleCopyAll() {
    const emojis = history
      .map((g) => GESTURE_EMOJI_MAP[g])
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
    <div className="flex flex-col items-center gap-6">
      {/* Current emoji */}
      <div className="flex flex-col items-center gap-3 w-full">
        <div
          className="text-[120px] leading-none min-h-35 flex items-center justify-center transition-all duration-200 ease-out"
          style={{
            transform: emoji ? "scale(1)" : "scale(0.8)",
            opacity: emoji ? 1 : 0.3,
          }}
        >
          {emoji ?? "🫳"}
        </div>

        {label && (
          <span className="text-white/50 text-sm tracking-wide uppercase">
            {label}
          </span>
        )}

        {emoji && (
          <button
            onClick={handleCopy}
            className="px-4 py-2 text-sm bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-xl text-white/80 transition-all duration-150 cursor-pointer"
          >
            {copied ? "Copied!" : "Copy Emoji"}
          </button>
        )}

        {/* Gemini meaning */}
        {(meaning || meaningLoading) && (
          <div className="w-full mt-1 px-4 py-3 rounded-xl bg-white/5 border border-white/8 text-white/60 text-sm leading-relaxed text-center min-h-15">
            {meaning || (
              <span className="animate-pulse text-white/30">Thinking…</span>
            )}
          </div>
        )}
      </div>

      {/* Gesture history */}
      {history.length > 0 && (
        <div className="flex flex-col items-center gap-2">
          <div className="text-white/30 text-xs uppercase tracking-widest">
            History
          </div>
          <div className="flex flex-wrap justify-center gap-2 text-4xl max-w-xs">
            {history.map((g, i) => (
              <span
                key={i}
                className="transition-all duration-200"
                style={{
                  opacity: 0.4 + (i / history.length) * 0.6,
                }}
              >
                {GESTURE_EMOJI_MAP[g] ?? ""}
              </span>
            ))}
          </div>
          <button
            onClick={handleCopyAll}
            className="px-3 py-1 text-xs bg-white/5 hover:bg-white/10 rounded-lg text-white/40 transition-colors cursor-pointer"
          >
            Copy All
          </button>
        </div>
      )}

      {/* Instructions when no gesture */}
      {!emoji && history.length === 0 && (
        <div className="text-white/30 text-sm text-center max-w-50 leading-relaxed">
          Show a hand gesture to the camera to generate an emoji
        </div>
      )}
    </div>
  );
}
