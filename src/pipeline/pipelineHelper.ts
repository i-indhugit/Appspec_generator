import { AIProvider } from '../gateway/provider.interface';
import { OpenAIAdapter } from '../gateway/openai.adapter';
import { AnthropicAdapter } from '../gateway/anthropic.adapter';
import { GroqAdapter } from '../gateway/groq.adapter';
import { GeminiAdapter } from '../gateway/gemini.adapter';
import { DeepSeekAdapter } from '../gateway/deepseek.adapter';
import { MistralAdapter } from '../gateway/mistral.adapter';
import { OpenRouterAdapter } from '../gateway/openrouter.adapter';
import { routingConfig, PipelineStageName } from '../config/routing.config';
import { estimateStageCost } from '../config/costTable';

export function getProviderAdapter(provider: string): AIProvider {
  switch (provider) {
    case 'openai':
      return new OpenAIAdapter();
    case 'anthropic':
      return new AnthropicAdapter();
    case 'groq':
      return new GroqAdapter();
    case 'gemini':
      return new GeminiAdapter();
    case 'deepseek':
      return new DeepSeekAdapter();
    case 'mistral':
      return new MistralAdapter();
    case 'openrouter':
      return new OpenRouterAdapter();
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

export interface StageExecutionResult {
  rawOutput: string;
  modelUsed: string;
  cost: number;
  latencyMs: number;
}

export async function runStageModel(
  stageName: PipelineStageName,
  prompt: string
): Promise<StageExecutionResult> {
  const config = routingConfig[stageName];
  const adapter = getProviderAdapter(config.provider);
  
  const startTime = Date.now();
  let rawOutput = '';
  let modelUsed = config.primaryModel;

  try {
    // Attempt with primary model and timeout threshold
    rawOutput = await adapter.generate(prompt, config.primaryModel, {
      timeoutMs: config.latencyThreshold,
    });
  } catch (error) {
    console.warn(`Primary model ${config.primaryModel} failed for ${stageName}. Trying fallback ${config.fallbackModel}...`, error);
    // Fallback model attempt
    modelUsed = config.fallbackModel;
    rawOutput = await adapter.generate(prompt, config.fallbackModel, {
      timeoutMs: config.latencyThreshold * 1.5,
    });
  }

  const latencyMs = Date.now() - startTime;
  
  // Calculate cost estimation based on character length if tokens are not directly available
  const estimatedInputTokens = Math.ceil(prompt.length / 4);
  const estimatedOutputTokens = Math.ceil(rawOutput.length / 4);
  const cost = estimateStageCost(modelUsed, estimatedInputTokens, estimatedOutputTokens);

  return {
    rawOutput,
    modelUsed,
    cost,
    latencyMs,
  };
}

export function extractJsonFromMarkdown(text: string): string {
  const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
  const match = text.match(jsonRegex);
  if (match && match[1]) {
    return match[1].trim();
  }
  
  // Alternative block matches or raw json detection
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return text.substring(firstBrace, lastBrace + 1).trim();
  }
  
  return text.trim();
}
