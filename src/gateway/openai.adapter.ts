import { AIProvider, GenerateOptions } from './provider.interface';
import { fetchWithRetry, handleAdapterFallback } from './adapterHelper';

export class OpenAIAdapter implements AIProvider {
  public async generate(prompt: string, model: string, options?: GenerateOptions): Promise<string> {
    return handleAdapterFallback('openai', 'OPENAI_API_KEY', prompt, async () => {
      const apiKey = process.env.OPENAI_API_KEY;
      const timeoutMs = options?.timeoutMs ?? 30000;
      
      const response = await fetchWithRetry(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: prompt }],
            temperature: options?.temperature ?? 0.1,
          }),
        },
        timeoutMs
      );

      const data = await response.json();
      return data.choices?.[0]?.message?.content ?? '';
    });
  }
}
