import { AIProvider, GenerateOptions } from './provider.interface';
import { fetchWithRetry, handleAdapterFallback } from './adapterHelper';

export class AnthropicAdapter implements AIProvider {
  public async generate(prompt: string, model: string, options?: GenerateOptions): Promise<string> {
    return handleAdapterFallback('anthropic', 'ANTHROPIC_API_KEY', prompt, async () => {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      const timeoutMs = options?.timeoutMs ?? 30000;

      const response = await fetchWithRetry(
        'https://api.anthropic.com/v1/messages',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': `${apiKey}`,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 4000,
            temperature: options?.temperature ?? 0.1,
          }),
        },
        timeoutMs
      );

      const data = await response.json();
      return data.content?.[0]?.text ?? '';
    });
  }
}
