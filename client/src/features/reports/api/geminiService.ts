import { GoogleGenAI, Type } from '@google/genai';
import { Row } from '../types/index.ts';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }); 

export const geminiService = {
  extractTableFromImage: async (file: File): Promise<Partial<Row>[]> => {
    try {
      if (!ai) throw new Error('Gemini API is not configured.');

      // Convert file to base64
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Result is like "data:image/jpeg;base64,/9j/4AAQSkZJR..."
          resolve(result.split(',')[1]); 
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              { text: 'Extract all table rows from this image. Parse the data structurally into a JSON array of objects. Map the properties strictly to these keys: headline, publication, edition, pageNo, date, link. If any data is missing or empty for a column, use an empty string. Convert dates into exactly YYYY-MM-DD wherever reasonably possible. Also include the source of the news if applicable.' },
              {
                inlineData: {
                  data: base64Data,
                  mimeType: file.type,
                }
              }
            ]
          }
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                headline: { type: Type.STRING },
                publication: { type: Type.STRING },
                edition: { type: Type.STRING },
                pageNo: { type: Type.STRING },
                date: { type: Type.STRING },
                link: { type: Type.STRING }
              }
            }
          }
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error('Failed to extract data correctly from image.');
      }

      return JSON.parse(text) as Partial<Row>[];
    } catch (error) {
      console.error('Gemini image extraction error:', error);
      throw new Error('Failed to extract data correctly. Please ensure the image is a clear table of news coverage.');
    }
  }
};
