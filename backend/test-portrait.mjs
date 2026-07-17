import dotenv from 'dotenv';
dotenv.config();
import { generateProfilePortrait } from './src/services/profilePortrait.ts';

// A minimal 1x1 red pixel PNG as test image
const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

try {
  const result = await generateProfilePortrait(testImage);
  console.log('SUCCESS');
  console.log('Result length:', result.length);
  console.log('Starts with:', result.substring(0, 30));
} catch (e) {
  console.error('FAILED:', e.message);
}
