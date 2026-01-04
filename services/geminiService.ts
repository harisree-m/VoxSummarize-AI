
import { GoogleGenAI, Type } from "@google/genai";
import { SummaryResponse } from "../types";

export const processVoiceNote = async (audioBase64: string, mimeType: string): Promise<SummaryResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      {
        parts: [
          {
            inlineData: {
              data: audioBase64,
              mimeType: mimeType
            }
          },
          {
            text: "Listen to this audio note carefully. First, transcribe it exactly. Then, provide a concise summary, a catchy title, a list of key points, and a list of specific action items. Format the entire response as a structured JSON object."
          }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "A short, descriptive title for the note" },
          transcription: { type: Type.STRING, description: "The full text transcription of the audio" },
          summary: { type: Type.STRING, description: "A brief summary of the main message" },
          keyPoints: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "List of important takeaways" 
          },
          actionItems: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "List of concrete tasks or follow-ups mentioned" 
          }
        },
        required: ["title", "transcription", "summary", "keyPoints", "actionItems"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  
  return JSON.parse(text) as SummaryResponse;
};

export const generateSpeech = async (text: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Please read this summary aloud clearly: ${text}` }] }],
    config: {
      responseModalities: ['AUDIO' as any], // Cast for SDK versions
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("Failed to generate speech");
  return base64Audio;
};
