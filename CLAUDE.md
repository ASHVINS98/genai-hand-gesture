# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Real-time hand gesture to emoji converter. Uses a webcam feed with MediaPipe HandLandmarker (WASM/GPU) to detect hand landmarks, classifies gestures via rule-based finger-state heuristics, and displays the corresponding emoji. Single-page client-side app — no backend.

## Commands

- `npm run dev` — Start dev server with Turbopack
- `npm run build` — Production build
- `npm run lint` — ESLint via Next.js

## Tech Stack

- Next.js 16 (App Router, single `"use client"` page)
- React 19, TypeScript (strict mode)
- Tailwind CSS v4 via `@tailwindcss/postcss`
- `@mediapipe/tasks-vision` — HandLandmarker loaded from CDN at runtime (WASM + float16 model)

## Architecture

All application code lives in three directories:

- **`lib/`** — Pure logic, no React. `handDetector.ts` wraps MediaPipe singleton init and per-frame detection. `gestureClassifier.ts` maps 21-landmark coordinates to gesture names using finger extension heuristics. `gestureEmojiMap.ts` maps gesture keys to emoji/label strings.
- **`components/`** — `Camera.tsx` owns the video/canvas elements and the rAF detection loop with frame-count debouncing (`CONFIRM_FRAMES = 8`). `EmojiDisplay.tsx` renders the current emoji, history trail, and clipboard copy buttons.
- **`app/`** — `page.tsx` is the sole route; composes Camera + EmojiDisplay and manages gesture/history state. `layout.tsx` is minimal (metadata + globals.css).

### Detection Pipeline (runs each animation frame)

`Camera.useEffect` → `detectHands(video, timestamp)` → MediaPipe landmarks → `classifyGesture(landmarks)` → debounce buffer → `onGesture` callback → page state → EmojiDisplay

### Key Conventions

- Path alias: `@/*` maps to project root
- Webpack config disables `fs` fallback for MediaPipe WASM compatibility
- Video is mirrored (`scaleX(-1)`) for natural selfie view
- Gesture classifier uses distance-from-wrist ratios; thumb has a separate heuristic. Thresholds are hardcoded constants.
- Supported gestures: wave, fist, thumbsUp, thumbsDown, peace, pointUp, ok, rockOn, callMe
