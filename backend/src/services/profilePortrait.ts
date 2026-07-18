import { GoogleGenAI } from '@google/genai';
import sharp from 'sharp';
import { selectBackground } from './portraitBackgrounds';
import { selectOutfit } from './portraitOutfits';

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

const imageModels = [
  process.env.GEMINI_IMAGE_MODEL,
  'gemini-3.1-flash-lite-image',
  'gemini-3.1-flash-image',
  'gemini-2.5-flash-image',
  'gemini-3-pro-image'
].filter(Boolean) as string[];

const NEW_API_MODELS = new Set(['gemini-3.1-flash-lite-image', 'gemini-3.1-flash-image', 'gemini-3-pro-image']);

function hashSeed(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return Math.abs(hash)
}

function buildPrompt(userHash: number): string {
  const bg = selectBackground(userHash)
  const outfit = selectOutfit(userHash + 7)

  return `Transform this photo into a cinematic Hollywood detective thriller portrait — the aesthetic of a prestige crime TV series or noir film.

CRITICAL — keep identical:
- Gender, age, and ethnicity must remain exactly as in the original photo
- Face: every detail, skin, expression unchanged
- Hair: MUST remain EXACTLY as in the original photo — DO NOT change it in ANY way. If the hair is loose and down, keep it loose and down. If it is curly, keep it curly. If it is wavy, keep it wavy. NEVER tie it, pin it, put it in a bun, ponytail, braid, updo, or pull it back. The hair volume, flow, and placement must be identical to the original.

What to change:
- Replace the background: ${bg.description}
- Replace the clothing: ${outfit.description}

Cinematic style to apply:
- Mood: dark, moody, atmospheric — like a Netflix crime thriller or noir Hollywood film
- Lighting: dramatic single-source side lighting (chiaroscuro) — one side of the face is sharply lit, the other falls into deep shadow; the background is significantly darker than the subject
- Atmospheric haze: subtle smoke or mist drifting in the background, giving depth and tension
- Color grade: desaturated, cold-leaning tones — dark teals, muted grays, deep shadows; very little saturation
- Background: softly blurred (bokeh), dark and moody environment (abandoned office, dimly lit corridor, foggy street, etc.)
- The subject's eyes carry a serious, intense, detective expression
- Cinematic depth of field: subject in sharp focus, background blurred
- Film-quality rendering: photorealistic, high-detail, sharp facial features
- Subtle HDR look: slightly enhanced local contrast, micro-detail in skin and fabric, rich blacks with preserved shadow detail — not over-processed, just a cinematic punch

Composition:
- Tight portrait framing: head and upper shoulders only — nothing below the chest
- The face must be centered both horizontally and vertically within the frame
- The ENTIRE head must be fully visible — top of skull, hair, and chin all within the image boundaries
- Eyes positioned at the vertical midpoint of the image
- Subject looks directly at the camera, expression serious and intense
- Background softly blurred (bokeh), subject in sharp focus

Do NOT add film grain, noise, vignette overlay, or illustration effects. This must be a realistic photographic edit.`
}

const generateViaInteractions = async (ai: GoogleGenAI, model: string, mimeType: string, base64Data: string, prompt: string) => {
  const interaction = await ai.interactions.create({
    model,
    input: [
      { type: 'image' as const, data: base64Data, mime_type: mimeType },
      { type: 'text' as const, text: prompt }
    ],
    response_modalities: ['text', 'image'],
  });
  if (interaction.output_image?.data) {
    const outMime = interaction.output_image.mime_type || 'image/png';
    return `data:${outMime};base64,${interaction.output_image.data}`;
  }
  throw new Error(`${model} returned no portrait via Interactions API`);
};

const generateViaGenerateContent = async (ai: GoogleGenAI, model: string, mimeType: string, base64Data: string, prompt: string) => {
  const response: any = await ai.models.generateContent({
    model,
    contents: [{ role: 'user', parts: [{ inlineData: { mimeType, data: base64Data } }, { text: prompt }] }],
    config: { responseModalities: ['TEXT', 'IMAGE'] }
  } as any);
  const imageParts = response.candidates?.[0]?.content?.parts?.filter((part: any) => part.inlineData?.data) || [];
  if (imageParts.length > 0) {
    const imagePart = imageParts[imageParts.length - 1];
    const outMime = imagePart.inlineData.mimeType || 'image/png';
    return `data:${outMime};base64,${imagePart.inlineData.data}`;
  }
  throw new Error(`${model} returned no portrait via generateContent`);
};

/**
 * Recorta a imagem centralizando no rosto.
 * Estratégia: num retrato (busto), o rosto ocupa o terço superior-central da imagem.
 * Recorta um quadrado cujo centro está a 35% da altura total.
 */
async function smartCropFace(dataUrl: string): Promise<string> {
  try {
    const [, mime, b64] = dataUrl.match(/^data:(image\/[^;]+);base64,(.+)$/) || [];
    if (!b64) return dataUrl;

    const buf = Buffer.from(b64, 'base64');
    const img = sharp(buf);
    const { width, height } = await img.metadata();
    if (!width || !height) return dataUrl;

    // Em retratos de busto gerados por IA, o centro do rosto está em ~52% da altura
    // Usamos um quadrado de 60% da altura para capturar cabeça + ombros
    const size = Math.min(width, Math.round(height * 0.60));
    const left = Math.round((width - size) / 2);
    const faceCenter = Math.round(height * 0.52);
    const top = Math.max(0, Math.min(height - size, faceCenter - Math.round(size / 2)));

    const cropped = await img
      .extract({ left, top, width: size, height: size })
      .toBuffer();

    const outMime = (mime as string) || 'image/jpeg';
    return `data:${outMime};base64,${cropped.toString('base64')}`;
  } catch (err) {
    console.warn('[smartCropFace] crop failed, returning original:', err);
    return dataUrl;
  }
}

export const generateProfilePortrait = async (sourceDataUrl: string, userId?: string) => {
  const match = sourceDataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!match || !allowedMimeTypes.has(match[1])) throw new Error('Unsupported profile image');
  if (Buffer.byteLength(match[2], 'base64') > 4 * 1024 * 1024) throw new Error('Profile image is too large');

  if (!process.env.GEMINI_API_KEY) throw new Error('Image generation is unavailable');

  const userHash = userId ? hashSeed(userId) : Math.floor(Math.random() * 100000);
  const prompt = buildPrompt(userHash);

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  let lastError: unknown;
  for (const model of imageModels) {
    try {
      const useNewApi = NEW_API_MODELS.has(model) || (model.startsWith('gemini-3.') && !model.includes('flash-lite'));
      const raw = useNewApi
        ? await generateViaInteractions(ai, model, match[1], match[2], prompt)
        : await generateViaGenerateContent(ai, model, match[1], match[2], prompt);
      return await smartCropFace(raw);
    } catch (error) {
      lastError = error;
      console.error(`[profilePortrait] ${model} failed:`, error instanceof Error ? error.message : error);
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Image generation returned no portrait');
};
