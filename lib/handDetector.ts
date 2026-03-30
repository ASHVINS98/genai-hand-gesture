import {
  HandLandmarker,
  FilesetResolver,
  type HandLandmarkerResult,
} from "@mediapipe/tasks-vision";

const WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

let detector: HandLandmarker | null = null;
let initPromise: Promise<void> | null = null;

export async function initHandDetector(): Promise<void> {
  if (detector) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const vision = await FilesetResolver.forVisionTasks(WASM_URL);
    detector = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: MODEL_URL,
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numHands: 2,
    });
  })();

  return initPromise;
}

export function detectHands(
  video: HTMLVideoElement,
  timestampMs: number
): HandLandmarkerResult | null {
  if (!detector) return null;
  return detector.detectForVideo(video, timestampMs);
}
