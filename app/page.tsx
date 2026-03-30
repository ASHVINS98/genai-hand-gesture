"use client";

import { useState, useCallback, useRef } from "react";
import { Camera } from "@/components/Camera";
import { EmojiDisplay, MeaningHistoryItem } from "@/components/EmojiDisplay";
import {
  GESTURE_EMOJI_MAP,
  GESTURE_LABELS,
  TWO_HAND_GESTURE_KEYS,
} from "@/lib/gestureEmojiMap";

const MAX_HISTORY = 12;

const SINGLE_HAND_KEYS = Object.keys(GESTURE_EMOJI_MAP).filter(
  (k) => !TWO_HAND_GESTURE_KEYS.has(k)
);
const TWO_HAND_KEYS = Object.keys(GESTURE_EMOJI_MAP).filter((k) =>
  TWO_HAND_GESTURE_KEYS.has(k)
);

export default function Home() {
  const [liveGesture, setLiveGesture] = useState<string | null>(null);
  const [liveProgress, setLiveProgress] = useState(0);
  const [history, setHistory] = useState<MeaningHistoryItem[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const fetchMeaning = useCallback(async (g: string, id: string, mode?: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const url = `/api/gesture-meaning?gesture=${g}${mode ? `&mode=${mode}` : ''}`;
      const res = await fetch(url, {
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const errorText = await res.text().catch(() => "");
        let meaningMsg = "Error: Failed to get meaning.";
        
        if (res.status === 429 || errorText === "QUOTA_EXCEEDED") {
          meaningMsg = "Error: Too many requests! Please wait a minute and try again.";
        } else if (errorText.includes("GROQ_API_KEY") || errorText.includes("Groq error")) {
          meaningMsg = "Error: Groq API Key is missing or invalid. Please check your .env.local file.";
        }

        setHistory((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, loading: false, meaning: meaningMsg } : item
          )
        );
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      while (!done) {
        const { value, done: d } = await reader.read();
        done = d;
        if (value) {
          const chunk = decoder.decode(value);
          setHistory((prev) =>
            prev.map((item) =>
              item.id === id ? { ...item, meaning: item.meaning + chunk } : item
            )
          );
        }
      }
      setHistory((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, loading: false } : item
        )
      );
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      setHistory((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, loading: false, meaning: item.meaning || "Error: Could not load meaning." } : item
        )
      );
    }
  }, []);

  const handleConfirmedGesture = useCallback(
    (g: string) => {
      const id = Date.now().toString() + Math.random().toString(36).substring(2, 9);
      const emoji = GESTURE_EMOJI_MAP[g];
      const label = GESTURE_LABELS[g];
      
      setHistory((prev) => [
        { id, gesture: g, emoji, label: label || null, meaning: "", loading: true },
        ...prev.slice(0, MAX_HISTORY - 1),
      ]);
      fetchMeaning(g, id);
    },
    [fetchMeaning]
  );
  
  const handleLiveGesture = useCallback((g: string | null, progress: number) => {
    setLiveGesture(g);
    setLiveProgress(progress);
  }, []);

  const handleClearHistory = useCallback(() => {
    setHistory([]);
    abortRef.current?.abort();
  }, []);

  const handleRegenerate = useCallback((id: string, g: string, mode: string) => {
    setHistory((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, loading: true, meaning: "" } : item
      )
    );
    fetchMeaning(g, id, mode);
  }, [fetchMeaning]);

  return (
    <main className="min-h-screen text-white">
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-8">

        {/* Header */}
        <header className="text-center pt-2 relative">
          <h1 className="text-3xl font-bold tracking-tight bg-linear-to-r from-cyan-400 via-white/90 to-violet-400 bg-clip-text text-transparent">
            Hand Gesture Emoji
          </h1>
          <p className="text-white/35 text-sm mt-1.5 tracking-wide">
            Real-time gesture recognition · Single &amp; dual hand
          </p>
        </header>

        {/* Camera + emoji side by side */}
        <div className="flex flex-col lg:flex-row gap-5 items-start justify-center">
          {/* Camera with gradient ring */}
          <div className="w-full lg:max-w-2xl">
            <div className="p-px rounded-2xl bg-linear-to-br from-cyan-500/35 via-violet-500/15 to-cyan-500/20 shadow-2xl shadow-black/40">
              <Camera onLiveGesture={handleLiveGesture} onConfirmedGesture={handleConfirmedGesture} />
            </div>
          </div>

          {/* Emoji display panel */}
          <div className="w-full lg:max-w-[400px] shrink-0">
            <EmojiDisplay
              liveGesture={liveGesture}
              liveProgress={liveProgress}
              history={history}
              onClearHistory={handleClearHistory}
              onRegenerate={handleRegenerate}
            />
          </div>
        </div>

        {/* Gesture reference guide */}
        <div className="rounded-2xl bg-white/2.5 border border-white/8 backdrop-blur-sm p-5 space-y-5">

          {/* Single hand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-cyan-500/12 text-cyan-400 border border-cyan-500/20 tracking-widest uppercase">
                Single Hand
              </span>
              <div className="h-px flex-1 bg-white/6" />
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
              {SINGLE_HAND_KEYS.map((key) => (
                <div
                  key={key}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all duration-200 ${
                    liveGesture === key
                      ? "bg-cyan-500/12 ring-1 ring-cyan-400/35 shadow-md shadow-cyan-500/10"
                      : "bg-white/3 hover:bg-white/6"
                  }`}
                >
                  <span className="text-3xl leading-none">
                    {GESTURE_EMOJI_MAP[key]}
                  </span>
                  <span className="text-white/35 text-[10px] text-center leading-tight">
                    {GESTURE_LABELS[key]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Two hand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-violet-500/12 text-violet-400 border border-violet-500/20 tracking-widest uppercase">
                Two Hands
              </span>
              <div className="h-px flex-1 bg-white/6" />
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {TWO_HAND_KEYS.map((key) => (
                <div
                  key={key}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all duration-200 ${
                    liveGesture === key
                      ? "bg-violet-500/12 ring-1 ring-violet-400/35 shadow-md shadow-violet-500/10"
                      : "bg-white/3 hover:bg-white/6"
                  }`}
                >
                  <span className="text-3xl leading-none">
                    {GESTURE_EMOJI_MAP[key]}
                  </span>
                  <span className="text-white/35 text-[10px] text-center leading-tight">
                    {GESTURE_LABELS[key]}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
        
        {/* Footer */}
        <footer className="w-full text-center mt-6 pt-6 border-t border-white/5 text-white/40 text-[13px] tracking-wide max-w-2xl mx-auto flex flex-col items-center gap-3">
          <div>
            Built with <span className="text-red-500 animate-pulse inline-block mx-0.5">❤️</span> by <span className="text-white/60 font-medium tracking-widest px-1">Ashwani</span>
          </div>
          <a
            href="https://github.com/ASHVINS98/genai-hand-gesture"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-white/80 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span>View on GitHub</span>
          </a>
        </footer>
      </div>
    </main>
  );
}
