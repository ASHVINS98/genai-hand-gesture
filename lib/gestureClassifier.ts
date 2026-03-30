type Point = { x: number; y: number; z: number };

function dist3d(a: Point, b: Point): number {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2 + (b.z - a.z) ** 2);
}

// Finger extended: tip must be farther from wrist than PIP joint
// When finger curls, tip swings back toward palm and becomes closer to wrist than PIP
function isFingerExtended(lm: Point[], tipIdx: number, pipIdx: number): boolean {
  const wrist = lm[0];
  return dist3d(lm[tipIdx], wrist) > dist3d(lm[pipIdx], wrist);
}

// Thumb extended: tip far from wrist (radial) AND laterally away from index base
// Combines both axes so it works even when hand is tilted
function isThumbExtended(lm: Point[]): boolean {
  const wrist = lm[0];
  const tipFarFromWrist = dist3d(lm[4], wrist) > dist3d(lm[3], wrist);
  const tipFarFromIndexBase = dist3d(lm[4], lm[5]) > 0.08;
  return tipFarFromWrist || tipFarFromIndexBase;
}

interface FingerState {
  thumb: boolean;
  index: boolean;
  middle: boolean;
  ring: boolean;
  pinky: boolean;
  pinchDist: number;
  thumbTipY: number;
  wristY: number;
}

function getFingerStates(lm: Point[]): FingerState {
  return {
    thumb: isThumbExtended(lm),
    index: isFingerExtended(lm, 8, 6),
    middle: isFingerExtended(lm, 12, 10),
    ring: isFingerExtended(lm, 16, 14),
    pinky: isFingerExtended(lm, 20, 18),
    pinchDist: dist3d(lm[4], lm[8]),
    thumbTipY: lm[4].y,
    wristY: lm[0].y,
  };
}

export function classifyGesture(lm: Point[]): string | null {
  if (lm.length < 21) return null;

  const f = getFingerStates(lm);
  const allFingersCurled = !f.index && !f.middle && !f.ring && !f.pinky;

  // OK: thumb-index pinch with other 3 fingers extended
  if (f.pinchDist < 0.09 && f.middle && f.ring && f.pinky) return "ok";

  // Wave: all 5 extended (thumb must be clearly out)
  if (f.thumb && f.index && f.middle && f.ring && f.pinky) return "wave";

  // Peace: index + middle up, ring + pinky curled, thumb tucked
  if (f.index && f.middle && !f.ring && !f.pinky && !f.thumb) return "peace";

  // Rock on: index + pinky up, middle + ring curled
  if (f.index && !f.middle && !f.ring && f.pinky) return "rockOn";

  // Call me: thumb + pinky only
  if (f.thumb && !f.index && !f.middle && !f.ring && f.pinky) return "callMe";

  // Point up: only index extended
  if (f.index && !f.middle && !f.ring && !f.pinky && !f.thumb) return "pointUp";

  // Fist / thumbsUp / thumbsDown — all 4 fingers curled
  if (allFingersCurled) {
    if (!f.thumb) return "fist";
    // Compare thumb tip Y to wrist Y (hand-relative, survives tilt)
    const palmHeight = Math.abs(lm[0].y - lm[9].y); // wrist to middle-MCP
    const thumbOffset = f.wristY - f.thumbTipY;      // positive = thumb above wrist
    if (thumbOffset > palmHeight * 0.5) return "thumbsUp";
    if (thumbOffset < -palmHeight * 0.3) return "thumbsDown";
    return "fist";
  }

  return null;
}

function classifyTwoHandGesture(lm1: Point[], lm2: Point[]): string | null {
  if (lm1.length < 21 || lm2.length < 21) return null;

  const g1 = classifyGesture(lm1);
  const g2 = classifyGesture(lm2);

  if (g1 === "wave" && g2 === "wave") return "clap";
  if (g1 === "thumbsUp" && g2 === "thumbsUp") return "doubleThumbsUp";
  if (g1 === "peace" && g2 === "peace") return "doublePeace";
  if (g1 === "rockOn" && g2 === "rockOn") return "doubleRockOn";

  // Heart hands: both hands finger-gun shape (thumb + index), tips close
  const f1 = getFingerStates(lm1);
  const f2 = getFingerStates(lm2);
  const heartShape1 = f1.thumb && f1.index && !f1.middle && !f1.ring && !f1.pinky;
  const heartShape2 = f2.thumb && f2.index && !f2.middle && !f2.ring && !f2.pinky;
  if (heartShape1 && heartShape2) {
    const indexDist = dist3d(lm1[8], lm2[8]);
    const thumbDist = dist3d(lm1[4], lm2[4]);
    if (indexDist < 0.25 || thumbDist < 0.25) return "heartHands";
  }

  return null;
}

export function classifyGestureDual(hands: Point[][]): string | null {
  if (hands.length === 0) return null;

  if (hands.length >= 2) {
    const twoHand = classifyTwoHandGesture(hands[0], hands[1]);
    if (twoHand) return twoHand;
  }

  return classifyGesture(hands[0]);
}
