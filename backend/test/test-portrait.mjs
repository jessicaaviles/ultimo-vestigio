import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

async function test() {
  const testImagePath = path.resolve(__dirname, '..', 'test', 'test-profile.jpg');
  
  let imageData;
  let mimeType;
  
  if (fs.existsSync(testImagePath)) {
    const buf = fs.readFileSync(testImagePath);
    mimeType = 'image/jpeg';
    imageData = buf.toString('base64');
    console.log('Using test image:', testImagePath);
  } else {
    console.log('No test image found at', testImagePath);
    console.log('Creating a larger test image...');
    // Create a 200x200 gradient PNG
    const { createCanvas } = await import('canvas');
    const canvas = createCanvas(200, 200);
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 200, 200);
    gradient.addColorStop(0, 'red');
    gradient.addColorStop(1, 'blue');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 200, 200);
    const buf = canvas.toBuffer('image/png');
    mimeType = 'image/png';
    imageData = buf.toString('base64');
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const profilePortraitPrompt = `Edit the supplied photograph into a cinematic circular profile portrait.

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

  console.log('Testing Interactions API with gemini-3.1-flash-lite-image...');
  
  try {
    const interaction = await ai.interactions.create({
      model: 'gemini-3.1-flash-lite-image',
      input: [
        { type: 'image', data: imageData, mime_type: mimeType },
        { type: 'text', text: profilePortraitPrompt }
      ],
      response_modalities: ['text', 'image'],
    });
    
    if (interaction.output_image?.data) {
      const outMime = interaction.output_image.mime_type || 'image/png';
      console.log('SUCCESS! Image generated.');
      console.log('Output size:', interaction.output_image.data.length, 'bytes');
      
      const outputPath = path.resolve(__dirname, 'portrait-output.png');
      fs.writeFileSync(outputPath, Buffer.from(interaction.output_image.data, 'base64'));
      console.log('Saved to:', outputPath);
    } else {
      console.log('FAIL: No output_image in response');
      const text = interaction.output_text || '(no text)';
      console.log('Output text:', text);
    }
  } catch (err) {
    console.error('ERROR:', err.message);
    if (err.status) console.error('Status:', err.status);
    if (err.details) console.error('Details:', err.details);
  }
}

test().catch(console.error);
