import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest } from "next/server";
import { GESTURE_EMOJI_MAP, GESTURE_LABELS } from "@/lib/gestureEmojiMap";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
};

const PROMPT = (label: string, emoji: string) => `
The user just showed the "${label}" hand gesture ${emoji} on a webcam.

Write a fun, warm interpretation in 2-3 sentences. Include ONE of:
- A witty joke about this gesture
- A line from a popular Punjabi/Hindi/English song that fits the vibe
- A funny observation about when people use this gesture in real life

Rules:
- Be playful and natural — like a fun friend, not a textbook
- Feel free to mix Hindi/Punjabi/English words naturally (yaar, bhai, ek dum, etc.)
- No markdown, no bullet points, no headers — just smooth flowing text
- Keep it SHORT: max 2-3 sentences
`.trim();

export async function GET(request: NextRequest) {
  const gesture = request.nextUrl.searchParams.get("gesture");

  if (!gesture || !GESTURE_EMOJI_MAP[gesture]) {
    return new Response("Invalid gesture", { status: 400 });
  }

  if (!apiKey) {
    return new Response("GEMINI_API_KEY not configured", { status: 503 });
  }

  const emoji = GESTURE_EMOJI_MAP[gesture];
  const label = GESTURE_LABELS[gesture];

  try {
    const result = await model.generateContentStream({
      contents: [{ role: "user", parts: [{ text: PROMPT(label, emoji) }] }],
      generationConfig,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) controller.enqueue(encoder.encode(text));
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    const isQuota =
      msg.includes("429") ||
      msg.includes("RESOURCE_EXHAUSTED") ||
      msg.includes("quota");
    console.error("Gemini error:", msg);
    return new Response(isQuota ? "QUOTA_EXCEEDED" : "ERROR", {
      status: isQuota ? 429 : 500,
    });
  }
}
