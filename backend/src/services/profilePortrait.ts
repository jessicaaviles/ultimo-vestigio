import { GoogleGenAI } from '@google/genai';

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const imageModels = [
  process.env.GEMINI_IMAGE_MODEL,
  'gemini-2.5-flash-image',
  'gemini-3.1-flash-image',
  'gemini-3-pro-image'
].filter(Boolean) as string[];

const profilePortraitPrompt = `Transform the supplied person photo into a realistic cinematic investigative portrait for the game Último Vestígio, applying the game's art direction while preserving the person's exact face, age, skin texture, hair color/style, and bone structure. CRITICAL: Do NOT add wrinkles, aging, or skin texture that is not present in the original photo. The person must appear exactly the same age as in the supplied photo. Do NOT age or de-age. Do NOT alter eye shape, nose, mouth, or facial structure. Do NOT smooth wrinkles or skin texture. Do NOT change hairstyle, hair color, beard, or makeup. Apply the Último Vestígio visual style only to lighting, color grading, and background: 35mm or 50mm lens, moderate depth of field, subtle film grain, low saturation, cool ambient light mixed with warm tungsten, restrained contrast, natural expression, atmospheric Hotel Vesper / forensic archive setting. No text, no logos, no horror, no blood, no cyberpunk, no neon, no glamour retouching, no exaggerated beauty filter. Return only the generated portrait image.`;

const generateWithOpenAI = async (mimeType: string, base64Data: string) => {
  const apiKey = process.env.OPENAI_API_KEY || process.env.OPEN_API_KEY;
  if (!apiKey) throw new Error('OpenAI image generation is unavailable');
  const imageBuffer = Buffer.from(base64Data, 'base64');
  const form = new FormData();
  form.append('model', process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1');
  form.append('prompt', profilePortraitPrompt);
  form.append('size', '1024x1024');
  form.append('image', new Blob([imageBuffer], { type: mimeType }), `profile.${mimeType.split('/')[1]}`);
  const response = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form
  });
  const payload = await response.json() as any;
  if (!response.ok) throw new Error(payload?.error?.message || 'OpenAI image generation failed');
  const image = payload?.data?.[0]?.b64_json;
  if (!image) throw new Error('OpenAI returned no portrait');
  return `data:image/png;base64,${image}`;
};

export const generateProfilePortrait = async (sourceDataUrl: string) => {
  const match = sourceDataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!match || !allowedMimeTypes.has(match[1])) throw new Error('Unsupported profile image');
  if (Buffer.byteLength(match[2], 'base64') > 4 * 1024 * 1024) throw new Error('Profile image is too large');
  let lastError: unknown;
  if (process.env.OPENAI_API_KEY || process.env.OPEN_API_KEY) {
    try { return await generateWithOpenAI(match[1], match[2]); }
    catch (error) { lastError = error; }
  }

  if (!process.env.GEMINI_API_KEY) throw lastError instanceof Error ? lastError : new Error('Image generation is unavailable');

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  for (const model of imageModels) {
    try {
      const response: any = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ inlineData: { mimeType: match[1], data: match[2] } }, { text: profilePortraitPrompt }] }],
        config: { responseModalities: ['TEXT', 'IMAGE'] }
      } as any);
      const imagePart = response.candidates?.[0]?.content?.parts?.find((part: any) => part.inlineData?.data);
      if (imagePart?.inlineData?.data) {
        const mimeType = imagePart.inlineData.mimeType || 'image/png';
        return `data:${mimeType};base64,${imagePart.inlineData.data}`;
      }
      lastError = new Error(`${model} returned no portrait`);
    } catch (error) { lastError = error; }
  }
  throw lastError instanceof Error ? lastError : new Error('Image generation returned no portrait');
};
