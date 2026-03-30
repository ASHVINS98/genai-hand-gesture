"use client";

import { useState, useCallback, useRef } from "react";
import { Camera } from "@/components/Camera";
import { EmojiDisplay } from "@/components/EmojiDisplay";
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
  const [gesture, setGesture] = useState<string | null>(null);
  const [lastConfirmedGesture, setLastConfirmedGesture] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [meaning, setMeaning] = useState<string>("");
  const [meaningLoading, setMeaningLoading] = useState(false);
  const [meaningError, setMeaningError] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const fetchMeaning = useCallback(async (g: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setMeaning("");
    setMeaningError(false);
    setMeaningLoading(true);

    try {
      const res = await fetch(`/api/gesture-meaning?gesture=${g}`, {
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        setMeaningError(true);
        setMeaningLoading(false);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      while (!done) {
        const { value, done: d } = await reader.read();
        done = d;
        if (value) setMeaning((prev) => prev + decoder.decode(value));
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      setMeaningError(true);
    } finally {
      setMeaningLoading(false);
    }
  }, []);

  const handleGesture = useCallback(
    (g: string | null) => {
      setGesture(g);
      if (g) {
        setHistory((prev) => {
          if (prev[prev.length - 1] === g) return prev;
          return [...prev.slice(-(MAX_HISTORY - 1)), g];
        });
        fetchMeaning(g);
      }
    },
    [fetchMeaning]
  );

  return (
    <main className="min-h-screen text-white">
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-8">

        {/* Header */}
        <header className="text-center pt-2">
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
              <Camera onGesture={handleGesture} />
            </div>
          </div>

          {/* Emoji display panel */}
          <div className="w-full lg:max-w-70 shrink-0">
            <EmojiDisplay
              gesture={gesture}
              history={history}
              meaning={meaning}
              meaningLoading={meaningLoading}
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
                    gesture === key
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
                    gesture === key
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
      </div>
    </main>
  );
}
