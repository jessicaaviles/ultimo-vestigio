import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

async function test() {
  // Find any jpg/png in test folder
  const testDir = __dirname;
  const files = fs.readdirSync(testDir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
  
  let imageData;
  let mimeType;

  if (files.length > 0) {
    const imgPath = path.join(testDir, files[0]);
    console.log('Using:', files[0]);
    const buf = fs.readFileSync(imgPath);
    const ext = path.extname(files[0]).toLowerCase();
    mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
    imageData = buf.toString('base64');
  } else {
    console.log('No test images found. Need to upload via API.');
    console.log('Testing via running server on port 3001...');
    
    const { default: fetch } = await import('node-fetch');
    
    // We need a user first - let's check if there's a test user
    // Or we can just test the portrait generation directly by importing
    
    // Actually let's just test the interactions call directly
    console.log('Cannot test without an image. Place a test image in backend/test/ folder.');
    return;
  }

  // Direct test of Interactions API
  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const prompt = `Edit the supplied photograph into a cinematic circular profile portrait.

PRESERVE EXACTLY (do not change):
- Face: all facial features, bone structure, skin, and expression must remain identical
- Hair: exact style, color, length, and texture
- Age: do not age or de-age
- Body: proportions and build

CHANGE:
- Clothing: replace with a dark utilitarian trench coat
- Badge: add a circular embossed gold metal badge with number "12" on the lapel or chest
- Background: replace with a dark stormy coastal landscape; a distant cliff with an ancient gloomy manor house with faint yellow-lit windows
- Lighting: dramatic chiaroscuro — deep navy/black shadows against warm gold highlights, melancholic mysterious mood
- Texture: visible film grain, high-caliber photographic film emulation
- Shape: circular frame

The person in the output must be IDENTICAL to the person in the input photo. This is an edit, not a new generation.`;

  console.log('Calling Interactions API with gemini-3.1-flash-lite-image...');
  
  try {
    const interaction = await ai.interactions.create({
      model: 'gemini-3.1-flash-lite-image',
      input: [
        { type: 'image', data: imageData, mime_type: mimeType },
        { type: 'text', text: prompt }
      ],
      response_modalities: ['text', 'image'],
    });
    
    if (interaction.output_image?.data) {
      console.log('SUCCESS! Image generated:', interaction.output_image.data.length, 'bytes');
      const outPath = path.join(__dirname, 'portrait-output.png');
      fs.writeFileSync(outPath, Buffer.from(interaction.output_image.data, 'base64'));
      console.log('Saved to:', outPath);
    } else {
      console.log('FAIL - no output image');
      console.log('Response text:', interaction.output_text || '(none)');
    }
  } catch (err) {
    console.error('ERROR:', err.message);
    if (err.status) console.error('Status:', err.status);
  }
}

test().catch(console.error);
