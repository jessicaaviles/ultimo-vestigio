import { GoogleGenAI } from '@google/genai';

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const imageModels = [
  process.env.GEMINI_IMAGE_MODEL,
  'gemini-2.5-flash-image',
  'gemini-3.1-flash-image',
  'gemini-3-pro-image'
].filter(Boolean) as string[];

const profilePortraitPrompt = `EDIT THE PROVIDED REFERENCE PHOTOGRAPH.

Create an official investigator profile portrait for the premium mystery game "Último Vestígio".

This is an image-editing task, not a new character generation.

The reference photograph is the absolute ground truth for the person's identity.

ABSOLUTE RULE: The person's age must remain exactly as in the reference photo. Do NOT add any wrinkles, aging, or maturity that is not already present. This is the most important rule.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
01. IDENTITY — VARIABLE PER USER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Preserve the exact identity and physical characteristics of the person shown in the reference image.

The final portrait must be immediately recognizable as the same real person.

CRITICAL: Do NOT alter the person's apparent age. Do NOT add wrinkles, creases, age spots, gray hair, receded hairline, sagging skin, or any other aging effects that are not present in the reference photograph. The person must look exactly the same age as in the supplied photo.

Keep unchanged:

- facial structure and proportions
- face width and length
- forehead
- cheekbones and cheeks
- jawline and chin
- eye shape, size, spacing and eyelids
- eyebrows
- nose shape, width and proportions
- nostrils
- lips, mouth shape and teeth
- ears
- skin tone
- freckles, pores, expression lines and natural imperfections
- natural facial asymmetries
- hairline
- hair color, texture, curl pattern, density and volume
- neck and visible body proportions
- apparent age

Do not reinterpret the face.

Do not generate a look-alike.

Do not beautify or idealize.

Do not slim or elongate the face.

Do not modify the eyes, nose, mouth, jaw or skin tone.

Do not smooth the skin.

Do not change ethnicity, age or body type.

Preserve the person's natural expression whenever possible.

The result must look like the original person photographed during the same professional photo session used for every investigator in the game.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
02. FIXED PORTRAIT STANDARD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Apply exactly the same portrait standard used for every investigator:

- square image
- 1:1 aspect ratio
- chest-up portrait
- head centered horizontally
- eyes positioned slightly above the vertical center
- camera at eye level
- body turned approximately 10 degrees
- face directed toward the camera
- natural upright posture
- neutral, attentive and approachable expression
- no dramatic pose
- no exaggerated smile

Do not crop the top of the hair.

Maintain comfortable negative space around the head and shoulders.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
03. FIXED WARDROBE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Replace only the visible clothing with:

- dark desaturated olive overshirt
- warm light-beige crew-neck shirt underneath
- matte natural fabrics
- no logos
- no text
- no uniform
- no tie
- no police badge
- no costume
- no visible investigative accessories

The clothing must be identical in style, color family and visual weight across all investigator portraits.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
04. FIXED LIGHTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Use the same lighting setup for every portrait:

- large soft light coming from the front-left side of the camera
- subtle natural shadow on the opposite side of the face
- gentle fill light
- soft contrast
- realistic skin exposure
- slightly warm highlights
- neutral shadows
- no harsh light
- no strong rim light
- no colored light
- no theatrical chiaroscuro
- no face partially hidden in darkness

Both eyes and all identity-defining facial features must remain clearly visible.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
05. FIXED BACKGROUND
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Replace the original background with the same standardized investigative environment:

- contemporary private investigation workspace
- soft charcoal and muted blue-gray base
- subtle dark olive and warm-beige elements
- a restrained dark-burgundy detail
- blurred investigation board
- indistinct documents and archival folders
- subtle map or case-material shapes
- no people in the background
- no readable text
- no logos
- no crime-scene tape
- no weapons
- no police-station clichés

Keep the environment heavily blurred and understated.

The background must never compete with the person.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
06. FIXED GAME COLOR DIRECTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Use the official "Último Vestígio" visual palette:

- muted blue-gray
- desaturated olive green
- warm beige
- soft charcoal
- restrained dark burgundy

Apply low saturation and balanced cinematic color grading.

Avoid:

- pure black
- neon colors
- purple glow
- saturated blue
- orange-and-teal blockbuster grading
- cyberpunk aesthetics
- horror aesthetics
- fantasy aesthetics

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
07. FIXED PHOTOGRAPHIC TREATMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Premium contemporary editorial photography.

Natural full-frame camera appearance.

85 mm portrait-lens look.

Moderately shallow depth of field.

Eyes and facial features in sharp focus.

Background softly blurred.

Realistic skin texture.

Subtle cinematic grain.

Controlled dynamic range.

Natural colors.

No beauty filter.

No artificial sharpening.

No plastic skin.

No illustration.

No painterly effect.

No 3D-rendered appearance.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
08. EDITING BOUNDARIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Change only:

- clothing
- background
- lighting treatment
- framing adjustments required by the fixed portrait standard
- color grading

Preserve the original person's identity, face, age, hair and physical characteristics.

When a requested stylistic change conflicts with identity preservation, preserve identity and reduce the stylistic transformation.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
09. FINAL VALIDATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The result must satisfy all of these conditions:

1. It is unmistakably the same person as the reference photograph.
2. It matches the same framing used for every investigator.
3. It uses the same wardrobe standard.
4. It uses the same lighting setup.
5. It uses the same background environment.
6. It uses the same game color palette and photographic treatment.
7. It looks like part of one cohesive investigator roster.
8. It does not look like an independently generated cinematic character.
9. The person's apparent age is exactly the same as in the reference photograph — no added wrinkles, aging or maturity.

The final image must feel like the original photograph was professionally reshot inside the visual universe of "Último Vestígio", not like the person was redesigned by AI.`;

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
