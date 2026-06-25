import { AIProvider, GenerateOptions } from './provider.interface';
import { fetchWithRetry, handleAdapterFallback } from './adapterHelper';

export class OpenRouterAdapter implements AIProvider {
  public async generate(prompt: string, model: string, options?: GenerateOptions): Promise<string> {
    return handleAdapterFallback('openrouter', 'OPENROUTER_API_KEY', prompt, async () => {
      const apiKey = process.env.OPENROUTER_API_KEY;
      const timeoutMs = options?.timeoutMs ?? 30000;

      const response = await fetchWithRetry(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://localhost:3000',
            'X-Title': 'AppSpec Pipeline',
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
