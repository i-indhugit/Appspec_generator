import { SimulatorEngine } from './simulator';

export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  timeoutMs: number = 30000,
  retries: number = 3,
  delayMs: number = 1000
): Promise<Response> {
  let attempt = 0;
  while (attempt < retries) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(id);

      if (response.ok) {
        return response;
      }

      // Handle 429 and 5xx status codes with retry
      if (response.status === 429 || (response.status >= 500 && response.status < 600)) {
        attempt++;
        if (attempt >= retries) {
          throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
        }
        // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, delayMs * Math.pow(2, attempt)));
        continue;
      }

      // Other non-ok responses (4xx) are thrown immediately
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    } catch (error) {
      clearTimeout(id);
      if (error instanceof Error && error.name === 'AbortError') {
        attempt++;
        if (attempt >= retries) {
          throw new Error(`Request timeout of ${timeoutMs}ms exceeded`);
        }
        await new Promise((resolve) => setTimeout(resolve, delayMs * Math.pow(2, attempt)));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Unexpected retry termination');
}

export function handleAdapterFallback(
  providerName: string,
  envKeyName: string,
  prompt: string,
  apiCall: () => Promise<string>
): Promise<string> {
  const apiKey = process.env[envKeyName];
  if (!apiKey) {
    // Determine context based on prompt: intent extraction, schema generation or appspec generation
    const isSchema = prompt.includes('EntitySchema') || prompt.includes('DataSchema') || prompt.includes('relations') || prompt.includes('bidirectional');
    const isAppSpec = prompt.includes('PageDefinition') || prompt.includes('AppSpec') || prompt.includes('apiEndpoints');

    if (isAppSpec) {
      // Prompt contains the intent and schema. We parse/simulate it.
      const intent = SimulatorEngine.getAppIntent(prompt);
      const schema = SimulatorEngine.getDataSchema(intent);
      return Promise.resolve(JSON.stringify(SimulatorEngine.getAppSpec(intent, schema), null, 2));
    } else if (isSchema) {
      const intent = SimulatorEngine.getAppIntent(prompt);
      return Promise.resolve(JSON.stringify(SimulatorEngine.getDataSchema(intent), null, 2));
    } else {
      return Promise.resolve(JSON.stringify(SimulatorEngine.getAppIntent(prompt), null, 2));
    }
  }

  return apiCall();
}
