export interface StageConfig {
  provider: 'openai' | 'anthropic' | 'groq' | 'gemini' | 'deepseek' | 'mistral' | 'openrouter';
  primaryModel: string;
  fallbackModel: string;
  latencyThreshold: number; // in milliseconds
  costThreshold: number;    // in USD
}

export type PipelineStageName = 'intentExtraction' | 'schemaGeneration' | 'appSpecGeneration';

export const routingConfig: Record<PipelineStageName, StageConfig> = {
  intentExtraction: {
    provider: 'openai',
    primaryModel: 'gpt-4o',
    fallbackModel: 'gpt-4o-mini',
    latencyThreshold: 10000,
    costThreshold: 0.02,
  },
  schemaGeneration: {
    provider: 'anthropic',
    primaryModel: 'claude-3-5-sonnet-20241022',
    fallbackModel: 'claude-3-5-haiku-20241022',
    latencyThreshold: 15000,
    costThreshold: 0.05,
  },
  appSpecGeneration: {
    provider: 'openai',
    primaryModel: 'gpt-4o',
    fallbackModel: 'gpt-4o-mini',
    latencyThreshold: 20000,
    costThreshold: 0.08,
  },
};
