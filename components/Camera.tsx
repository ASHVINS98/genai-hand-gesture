"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { initHandDetector, detectHands } from "@/lib/handDetector";
import { classifyGestureDual } from "@/lib/gestureClassifier";

interface CameraProps {
  onLiveGesture: (gesture: string | null, progress: number) => void;
  onConfirmedGesture: (gesture: string) => void;
}

const HOLD_DURATION_MS = 2000;

const HAND_COLORS = [
  { stroke: "rgba(6, 182, 212, 0.65)", dot: "rgba(6, 182, 212, 0.95)" },
  { stroke: "rgba(168, 85, 247, 0.65)", dot: "rgba(168, 85, 247, 0.95)" },
];

const CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [0, 9], [9, 10], [10, 11], [11, 12],
  [0, 13], [13, 14], [14, 15], [15, 16],
  [0, 17], [17, 18], [18, 19], [19, 20],
  [5, 9], [9, 13], [13, 17],
];

export function Camera({ onLiveGesture, onConfirmedGesture }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const holdRef = useRef<{
    gesture: string | null;
    startTime: number;
    fired: boolean;
    pendingGesture: string | null;
    pendingCount: number;
  }>({
    gesture: null,
    startTime: 0,
    fired: false,
    pendingGesture: null,
    pendingCount: 0,
  });
  const lastTimestamp = useRef<number>(0);
  const handsCountRef = useRef(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [handsCount, setHandsCount] = useState(0);
  const [holdProgress, setHoldProgress] = useState(0);

  const stableOnLiveGesture = useRef(onLiveGesture);
  stableOnLiveGesture.current = onLiveGesture;
  const stableOnConfirmedGesture = useRef(onConfirmedGesture);
  stableOnConfirmedGesture.current = onConfirmedGesture;

  const drawLandmarks = useCallback(
    (allLandmarks: { x: number; y: number; z: number }[][]) => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let h = 0; h < allLandmarks.length; h++) {
        const landmarks = allLandmarks[h];
        const color = HAND_COLORS[h % HAND_COLORS.length];

        ctx.strokeStyle = color.stroke;
        ctx.lineWidth = 2.5;
        for (const [a, b] of CONNECTIONS) {
          const pa = landmarks[a];
          const pb = landmarks[b];
          ctx.beginPath();
          ctx.moveTo(pa.x * canvas.width, pa.y * canvas.height);
          ctx.lineTo(pb.x * canvas.width, pb.y * canvas.height);
          ctx.stroke();
        }

        for (const lm of landmarks) {
          const x = lm.x * canvas.width;
          const y = lm.y * canvas.height;
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, 2 * Math.PI);
          ctx.fillStyle = color.dot;
          ctx.fill();
          ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    },
    []
  );

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    async function start() {
      try {
        setLoading(true);
        await initHandDetector();
        if (cancelled) return;

        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: "user" },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        const video = videoRef.current!;
        video.srcObject = stream;
        await video.play();
        setLoading(false);
        setReady(true);
        loop();
      } catch (e) {
        if (!cancelled) {
          setLoading(false);
          setError(
            e instanceof Error ? e.message : "Failed to access camera"
          );
        }
      }
    }

    function loop() {
      if (cancelled) return;
      const video = videoRef.current;
      if (!video || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const now = performance.now();
      if (now <= lastTimestamp.current) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      lastTimestamp.current = now;

      const result = detectHands(video, now);
      const allLandmarks = result?.landmarks ?? [];

      const newCount = allLandmarks.length;
      if (newCount !== handsCountRef.current) {
        handsCountRef.current = newCount;
        setHandsCount(newCount);
      }

      if (allLandmarks.length > 0) {
        drawLandmarks(allLandmarks);
      } else {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext("2d");
          ctx?.clearRect(0, 0, canvas.width, canvas.height);
        }
      }

      const gesture = classifyGestureDual(allLandmarks);

      const hold = holdRef.current;
      if (gesture === hold.gesture) {
        // Same gesture — reset jitter counter, advance timer
        hold.pendingGesture = null;
        hold.pendingCount = 0;
        let progress = 0;
        if (gesture) {
          progress = Math.min((now - hold.startTime) / HOLD_DURATION_MS, 1);
          setHoldProgress(progress);
          if (progress >= 1 && !hold.fired) {
            hold.fired = true;
            stableOnConfirmedGesture.current(gesture);
          }
        }
        stableOnLiveGesture.current(gesture, progress);
      } else {
        // Different gesture — only commit after 5 stable frames (jitter guard)
        if (gesture === hold.pendingGesture) {
          hold.pendingCount++;
        } else {
          hold.pendingGesture = gesture;
          hold.pendingCount = 1;
        }
        if (hold.pendingCount >= 5) {
          hold.gesture = gesture;
          hold.startTime = now;
          hold.fired = false;
          hold.pendingGesture = null;
          hold.pendingCount = 0;
          setHoldProgress(0);
          stableOnLiveGesture.current(gesture, 0);
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    }

    start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [drawLandmarks]);

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 p-10 rounded-2xl bg-red-950/20 border border-red-800/30">
        <div className="text-red-400 font-medium">Camera Error</div>
        <div className="text-red-300/60 text-sm text-center">{error}</div>
        <div className="text-red-300/40 text-xs text-center">
          Make sure you&apos;re on HTTPS or localhost and have granted camera
          permission.
        </div>
      </div>
    );
  }

  const handLabel =
    handsCount === 0 ? null : handsCount === 1 ? "1 Hand" : "2 Hands";
  const handBadgeColor =
    handsCount === 2
      ? "bg-violet-500/20 border-violet-400/30 text-violet-300"
      : "bg-cyan-500/20 border-cyan-400/30 text-cyan-300";

  return (
    <div className="relative rounded-2xl overflow-hidden bg-gray-900/80 shadow-2xl">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-950/90 z-10 rounded-2xl">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20" />
              <div className="absolute inset-0 rounded-full border-2 border-t-cyan-400 animate-spin" />
            </div>
            <span className="text-white/40 text-sm">
              Loading hand detection model…
            </span>
          </div>
        </div>
      )}
      <video
        ref={videoRef}
        className="w-full block"
        style={{ transform: "scaleX(-1)" }}
        muted
        playsInline
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ transform: "scaleX(-1)" }}
      />
      {ready && holdProgress > 0 && holdProgress < 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
          <svg width="56" height="56" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
            <circle
              cx="28" cy="28" r="24"
              fill="none"
              stroke="rgba(6,182,212,0.9)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 24}`}
              strokeDashoffset={`${2 * Math.PI * 24 * (1 - holdProgress)}`}
              transform="rotate(-90 28 28)"
            />
          </svg>
        </div>
      )}
      {ready && (
        <div className="absolute top-3 right-3 flex items-center gap-2">
          {handLabel && (
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border backdrop-blur-sm transition-all duration-300 ${handBadgeColor}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              {handLabel}
            </div>
          )}
          <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs text-white/50 border border-white/10">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Live
          </div>
        </div>
      )}
    </div>
  );
}
