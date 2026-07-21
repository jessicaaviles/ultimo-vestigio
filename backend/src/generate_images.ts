import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('No GEMINI_API_KEY found');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

const items = [
  {
    name: 'ev_glass.png',
    prompt: '2D digital painting noir detective illustration, sepia and gold accents, painterly texture. Broken crystal wine glass shards scattered on a dark wooden floor, dark petrol blue shadows, stylized digital artwork, not photorealistic.'
  },
  {
    name: 'ev_safe.png',
    prompt: '2D digital painting noir detective illustration, sepia and gold accents, painterly texture. An open heavy antique steel wall safe hidden behind a golden oil painting pushed aside on a dark library wall, stylized digital artwork, not photorealistic.'
  },
  {
    name: 'ev_cigar.png',
    prompt: '2D digital painting noir detective illustration, sepia and gold accents, painterly texture. An unlit cigar resting in a heavy crystal glass ashtray on a mahogany desk, stylized digital artwork, not photorealistic.'
  },
  {
    name: 'ev_suitcase.png',
    prompt: '2D digital painting noir detective illustration, sepia and gold accents, painterly texture. An open vintage leather suitcase on a bedroom floor, packed with thick winter coats, scarves, stylized digital artwork, not photorealistic.'
  },
  {
    name: 'ev_mud.png',
    prompt: '2D digital painting noir detective illustration, sepia and gold accents, painterly texture. Wet muddy ground at night with distinct footprints of high heels and boots leading away, stylized digital artwork, not photorealistic.'
  },
  {
    name: 'ev_bones.png',
    prompt: '2D digital painting noir detective illustration, sepia and gold accents, painterly texture. Small animal bones partially uncovered in wet soil next to a rusty metal dog collar with a worn tag reading Buster, stylized digital artwork, not photorealistic.'
  }
];

async function generateAll() {
  const outputDir = path.resolve(__dirname, '../../frontend/public/backgrounds');
  for (const item of items) {
    console.log(`Generating ${item.name}...`);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: item.prompt,
      });

      const candidates = response.candidates;
      if (candidates && candidates[0]?.content?.parts) {
        for (const part of candidates[0].content.parts) {
          if (part.inlineData) {
            const buffer = Buffer.from(part.inlineData.data, 'base64');
            const targetPath = path.join(outputDir, item.name);
            fs.writeFileSync(targetPath, buffer);
            console.log(`Successfully saved ${item.name} to ${targetPath}`);
            break;
          }
        }
      } else {
        console.error(`No candidate image returned for ${item.name}`);
      }
    } catch (err: any) {
      console.error(`Error generating ${item.name}:`, err?.message || err);
    }
  }
}

generateAll();
