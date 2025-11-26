import { GoogleGenAI, Type } from "@google/genai";
import { GestureResponse } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are an advanced visual AI expert specializing in Human-Computer Interaction (HCI) and hand gesture recognition. 
Your task is to analyze the provided image frame from a webcam and identify the primary hand gesture being performed.

Recognize common gestures such as:
- "Thumbs Up" (Approval, Good)
- "Thumbs Down" (Disapproval, Bad)
- "Peace Sign" (Victory, Peace)
- "Open Palm" (Stop, Hello)
- "Fist" (Strength, Solidarity, Rock)
- "Pointing" (Direction, Attention)
- "OK Sign" (Okay, Perfect)
- "Heart Hands" (Love, Appreciation)
- "Crossed Fingers" (Luck)

If no clear hand gesture is visible, return "None".
Be precise. If the confidence is low, indicate it.
`;

export const analyzeGesture = async (base64Image: string): Promise<GestureResponse> => {
  try {
    // Strip the data:image/jpeg;base64, prefix if present
    const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64
            }
          },
          {
            text: "Identify the hand gesture in this image."
          }
        ]
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            gesture: { type: Type.STRING, description: "The name of the detected gesture. Use 'None' if no gesture detected." },
            confidence: { type: Type.NUMBER, description: "Confidence score between 0.0 and 1.0" },
            description: { type: Type.STRING, description: "A short, one-sentence description of what the hand is doing." },
            emoji: { type: Type.STRING, description: "A relevant emoji for the gesture (e.g., 👍, ✌️, ✋). Use ❓ for None." },
            actionSuggested: { type: Type.STRING, description: "A suggested UI action based on the gesture (e.g., 'Submit', 'Cancel', 'Scroll')." }
          },
          required: ["gesture", "confidence", "description", "emoji"],
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response text from Gemini");
    }

    return JSON.parse(text) as GestureResponse;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    // Return a safe fallback on error to prevent app crash
    return {
      gesture: "Error",
      confidence: 0,
      description: "Failed to analyze frame.",
      emoji: "⚠️"
    };
  }
};