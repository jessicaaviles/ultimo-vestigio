import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

async function list() {
  try {
    const listResponse: any = await ai.models.list();
    console.log('ALL MODELS:', listResponse.pageInternal?.map((m: any) => m.name));
  } catch (e: any) {
    console.error('Error listing models:', e?.message || e);
  }
}

list();
