import Groq from "groq-sdk";
import { NextRequest } from "next/server";
import { GESTURE_EMOJI_MAP, GESTURE_LABELS } from "@/lib/gestureEmojiMap";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "",
});

const PROMPT = (label: string, emoji: string, mode?: string | null, language: string = "English") => {
  if (mode === "punjabi" || mode === "bhojpuri" || mode === "hindi") {
    const langName = mode.charAt(0).toUpperCase() + mode.slice(1);
    const context = 
      mode === "punjabi" ? "loud Punjabi/desi joke or a swagger vibe using Punjabi slang naturally (oye, paaji, chak de, bruah)" :
      mode === "bhojpuri" ? "funny Bhojpuri/desi joke or a local swagger vibe using typical Bhojpuri slang naturally (bhaiya, babua, garda macha diya)" :
      "witty Hindi joke or a dramatic Bollywood vibe using Hindi slang naturally (bhai, yaar, arre, mast)";

    return `
The user just showed the "${label}" hand gesture ${emoji} on a webcam.
Write a highly energetic, funny interpretation in 2-3 sentences. 
Focus heavily on a ${context}.
You MUST respond strictly in the ${langName} language/dialect completely.
No markdown, no bullet points, no headers — just smooth flowing text.
Keep it SHORT: max 2-3 sentences.
    `.trim();
  }
  
  return `
The user just showed the "${label}" hand gesture ${emoji} on a webcam.

Write a fun, warm interpretation in 2-3 sentences. Include ONE of:
- A witty joke about this gesture
- A line from a popular song that fits the vibe
- A funny observation about when people use this gesture in real life

Rules:
- You MUST write the entire response strictly in: ${language}.
- Be playful and natural — like a fun friend, not a textbook
- Feel free to mix culturally relevant slang naturally
- No markdown, no bullet points, no headers — just smooth flowing text
- Keep it SHORT: max 2-3 sentences
`.trim();
};

export async function GET(request: NextRequest) {
  const gesture = request.nextUrl.searchParams.get("gesture");
  const mode = request.nextUrl.searchParams.get("mode");
  const lang = request.nextUrl.searchParams.get("lang") || "English";

  if (!gesture || !GESTURE_EMOJI_MAP[gesture]) {
    return new Response("Invalid gesture", { status: 400 });
  }

  if (!process.env.GROQ_API_KEY) {
    return new Response("GROQ_API_KEY not configured", { status: 503 });
  }

  const emoji = GESTURE_EMOJI_MAP[gesture];
  const label = GESTURE_LABELS[gesture];

  try {
    const stream = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: PROMPT(label, emoji, mode, lang),
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 1,
      top_p: 0.95,
      stream: true,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || "";
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
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
  } catch (error: any) {
    const msg = error.message || String(error);
    console.error("Groq error:", msg);
    const isQuota =
      msg.toLowerCase().includes("429") ||
      msg.toLowerCase().includes("rate limit") ||
      msg.toLowerCase().includes("quota");
      
    if (isQuota) {
      return new Response("QUOTA_EXCEEDED", { status: 429 });
    }
    return new Response("ERROR", { status: 500 });
  }
}
