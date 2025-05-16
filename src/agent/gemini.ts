
import {GoogleGenAI} from '@google/genai';
import {loadOrCreateConfig} from "../config";

const config = loadOrCreateConfig()
const ai = new GoogleGenAI({apiKey: config.config.geminiKey});

const SYSTEM_PROMPT = `
You are helpful assistant to a software engineer
`


export async function generate(prompt) {
    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-001',
        contents: prompt,
        config: {
            systemInstruction: {
                parts: [
                    {
                        text: SYSTEM_PROMPT
                    }
                ]
            }
        }
    });
    return response
}