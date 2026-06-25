import { AIProvider, GenerateOptions } from './provider.interface';
import { fetchWithRetry, handleAdapterFallback } from './adapterHelper';

export class GeminiAdapter implements AIProvider {
  public async generate(prompt: string, model: string, options?: GenerateOptions): Promise<string> {
    return handleAdapterFallback('gemini', 'GEMINI_API_KEY', prompt, async () => {
      const apiKey = process.env.GEMINI_API_KEY;
      const timeoutMs = options?.timeoutMs ?? 30000;

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetchWithRetry(
        url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt }
                ]
              }
            ],
            generationConfig: {
              temperature: options?.temperature ?? 0.1,
            }
          }),
        },
        timeoutMs
      );

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    });
  }
}
