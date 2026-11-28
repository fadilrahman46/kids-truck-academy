import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { GoogleGenAI } from '@google/genai';

type TtsLanguage = 'id' | 'en';
type TtsMood = 'welcome' | 'explain' | 'action' | 'encourage' | 'celebrate';

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';
const MAX_TEXT_LENGTH = 280;
const MAX_CACHE_ENTRIES = 180;

const ALLOWED_LANGUAGES = new Set<TtsLanguage>(['id', 'en']);
const ALLOWED_MOODS = new Set<TtsMood>([
  'welcome',
  'explain',
  'action',
  'encourage',
  'celebrate',
]);

const MOOD_STYLE_DIRECTIONS: Record<TtsMood, string> = {
  welcome:
    'Warm, smiling kindergarten teacher greeting young children with joyful storybook energy, bright rising intonation, friendly warmth, and clear toddler-friendly pacing.',
  explain:
    'Cheerful, expressive preschool teacher explaining a fun game step to young children with playful curiosity, lively musical pitch melody, warm smile, and crisp clear articulation.',
  action:
    'Upbeat, animated children storyteller narrating exciting truck action with bubbly enthusiasm, lively rhythmic intonation, and joyful emphasis.',
  encourage:
    'Gentle, warm, reassuring kindergarten teacher smiling encouragingly with soft uplifting intonation, patient kindness, and playful warmth so young kids feel happy to try again.',
  celebrate:
    'Sparkling, super happy kindergarten teacher celebrating a child achievement with bright cheering upward intonation, proud excitement, and warm joyful laughter in the voice.',
};

// Bounded LRU cache for synthesized 24kHz WAV buffers (instant repeat playback)
const wavCache = new Map<string, Buffer>();
const inFlightRequests = new Map<string, Promise<Buffer>>();

let cachedAiClient: GoogleGenAI | null = null;
let cachedApiKey = '';

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!cachedAiClient || cachedApiKey !== apiKey) {
    cachedApiKey = apiKey;
    cachedAiClient = new GoogleGenAI({
      apiKey,
      apiVersion: 'v1beta',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return cachedAiClient;
}

function getCachedWav(key: string): Buffer | null {
  const hit = wavCache.get(key);
  if (!hit) return null;
  // Refresh LRU recency
  wavCache.delete(key);
  wavCache.set(key, hit);
  return hit;
}

function setCachedWav(key: string, buffer: Buffer): void {
  if (wavCache.has(key)) {
    wavCache.delete(key);
  }
  wavCache.set(key, buffer);
  while (wavCache.size > MAX_CACHE_ENTRIES) {
    const oldestKey = wavCache.keys().next().value;
    if (oldestKey === undefined) break;
    wavCache.delete(oldestKey);
  }
}

function sanitizeSpokenText(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  // Strip control characters and collapse whitespace
  const cleaned = raw
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned || cleaned.length > MAX_TEXT_LENGTH) return null;
  return cleaned;
}

async function synthesizeKoreSpeech(
  ai: GoogleGenAI,
  text: string,
  language: TtsLanguage,
  mood: TtsMood,
): Promise<Buffer> {
  const langPrompt =
    language === 'en'
      ? 'Speak naturally in lively, clear American English for children ages 2 to 6.'
      : 'Speak naturally in lively, clear Bahasa Indonesia for children ages 2 to 6.';
  const style = `${MOOD_STYLE_DIRECTIONS[mood]} ${langPrompt}`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash-lite-tts',
    contents: [
      {
        role: 'user',
        parts: [
          {
            text,
            speechMetadata: {
              style,
            },
          },
        ],
      },
    ],
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: 'Kore',
          },
        },
      },
    },
  });

  const base64Audio =
    response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error('Empty audio payload from Gemini TTS');
  }
  return Buffer.from(base64Audio, 'base64');
}

async function startServer(): Promise<void> {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '16kb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true, ttsReady: Boolean(getGeminiClient()) });
  });

  app.post('/api/tts', async (req: Request, res: Response) => {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const text = sanitizeSpokenText(body.text);
    if (!text) {
      res.status(400).json({ error: 'Invalid or empty text payload.' });
      return;
    }

    const rawLang = typeof body.language === 'string' ? body.language : 'id';
    const language: TtsLanguage = ALLOWED_LANGUAGES.has(rawLang as TtsLanguage)
      ? (rawLang as TtsLanguage)
      : 'id';

    const rawMood = typeof body.mood === 'string' ? body.mood : 'explain';
    const mood: TtsMood = ALLOWED_MOODS.has(rawMood as TtsMood)
      ? (rawMood as TtsMood)
      : 'explain';

    const cacheKey = `${language}|${mood}|${text}`;
    const cached = getCachedWav(cacheKey);
    if (cached) {
      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(cached);
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({ error: 'TTS service not configured.' });
      return;
    }

    try {
      let pending = inFlightRequests.get(cacheKey);
      if (!pending) {
        pending = synthesizeKoreSpeech(ai, text, language, mood)
          .then((wavBuffer) => {
            setCachedWav(cacheKey, wavBuffer);
            return wavBuffer;
          })
          .finally(() => {
            inFlightRequests.delete(cacheKey);
          });
        inFlightRequests.set(cacheKey, pending);
      }

      const wavBuffer = await pending;
      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(wavBuffer);
    } catch (err: unknown) {
      const status =
        typeof err === 'object' &&
        err !== null &&
        'status' in err &&
        typeof (err as { status?: unknown }).status === 'number'
          ? (err as { status: number }).status
          : 502;
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`[TTS] Synthesis failed (status=${status}):`, errMsg.slice(0, 300));
      const safeStatus =
        status === 429 ? 429 : status === 403 || status === 401 ? status : status === 400 ? 400 : 502;
      res.status(safeStatus).json({
        error: 'Unable to synthesize expressive voice right now.',
        code: status,
      });
    }
  });

  if (!IS_PROD) {
    // Serve a clean WebSocket-free /@vite/client module when HMR is disabled so the browser
    // never attempts an unproxied HMR WebSocket connection while preserving dev CSS injection.
    const NOOP_VITE_CLIENT_JS = `
const sheetsMap = new Map();
export function updateStyle(id, content) {
  let style = sheetsMap.get(id);
  if (!style) {
    style = document.createElement("style");
    style.setAttribute("type", "text/css");
    style.setAttribute("data-vite-dev-id", id);
    style.textContent = content;
    document.head.appendChild(style);
    sheetsMap.set(id, style);
  } else if (style.textContent !== content) {
    style.textContent = content;
  }
}
export function removeStyle(id) {
  const style = sheetsMap.get(id);
  if (style) {
    style.remove();
    sheetsMap.delete(id);
  }
}
export function createHotContext() {
  return {
    data: {},
    accept() {},
    acceptExports() {},
    dispose() {},
    prune() {},
    decline() {},
    invalidate() {},
    on() {},
    off() {},
    send() {},
  };
}
export function injectQuery(url) {
  return url;
}
export class ErrorOverlay {}
`.trim();

    app.get('/@vite/client', (_req: Request, res: Response) => {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      res.send(NOOP_VITE_CLIENT_JS);
    });

    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir, { maxAge: '1h' }));
    app.get('*', (_req: Request, res: Response) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build not found.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Kota Kendaraan Ceria 3D server listening on http://0.0.0.0:${PORT}`);
  });
}

void startServer();
