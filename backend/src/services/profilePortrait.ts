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

  return `Edit this photo into a mysterious detective portrait.

CRITICAL — keep identical:
- Gender, age, and ethnicity must remain exactly as in the original photo
- Face: every detail, skin, expression unchanged
- Hair: exact color, cut, texture, and length
- Body: proportions, build, head size relative to body must remain natural and unchanged

What to change:
- Replace the background: ${bg.description}
- Replace the clothing: ${outfit.description}
- Lighting: low-light nocturnal scene — soft, diffused illumination falling gently on the face, background darker and receding into shadow, mysterious and melancholic mood, focus on the face with the surroundings dim

Composition:
- Tight portrait crop, head and shoulders visible
- Face perfectly centered in the frame — eyes at the vertical center of the image
- Person looking directly toward the camera
- Shallow depth of field: background softly blurred as if shot with an 85mm lens at a wide aperture (f/1.4–f/2)
- Background out of focus, only the person in sharp focus

Do NOT add film grain, noise, or texture overlay. The person must look exactly like the original photo — this is a realistic photo edit, not an illustration.`
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
