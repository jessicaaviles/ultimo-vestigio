import { GoogleGenAI } from '@google/genai';
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

  return `Edit the supplied photograph into a cinematic profile portrait.

PRESERVE EXACTLY (do not change):
- Face: all facial features, bone structure, skin, and expression must remain identical
- Hair: exact style, color, length, and texture
- Age: do not age or de-age
- Body: proportions and build

CHANGE:
- Pose: 3/4 angle (three-quarter turn), person looking directly toward the camera
- Framing: face perfectly centered in the image — eyes at the exact vertical center, equal space above the head and below the chin, shoulders and upper torso visible, tight portrait crop optimized for a circular avatar (the face must not be cut off when cropped as a circle)
- Clothing: ${outfit.description}
- Background: replace the background with ${bg.description}
- Lighting: dramatic chiaroscuro — deep navy-black shadows against warm gold highlights, melancholic mysterious mood, cinematographic lighting inspired by thriller films
- Texture: visible film grain, high-caliber photographic film emulation, subtle

The person in the output must be IDENTICAL to the person in the input photo. This is an edit, not a new generation.`
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
      const result = useNewApi
        ? await generateViaInteractions(ai, model, match[1], match[2], prompt)
        : await generateViaGenerateContent(ai, model, match[1], match[2], prompt);
      return result;
    } catch (error) {
      lastError = error;
      console.error(`[profilePortrait] ${model} failed:`, error instanceof Error ? error.message : error);
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Image generation returned no portrait');
};
