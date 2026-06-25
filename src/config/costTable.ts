export interface ModelCostRate {
  provider: string;
  inputCostPerMillion: number; // in USD
  outputCostPerMillion: number; // in USD
}

export const costTable: Record<string, ModelCostRate> = {
  // OpenAI
  'gpt-4o': { provider: 'openai', inputCostPerMillion: 2.50, outputCostPerMillion: 10.00 },
  'gpt-4o-mini': { provider: 'openai', inputCostPerMillion: 0.15, outputCostPerMillion: 0.60 },
  
  // Anthropic
  'claude-3-5-sonnet-20241022': { provider: 'anthropic', inputCostPerMillion: 3.00, outputCostPerMillion: 15.00 },
  'claude-3-5-haiku-20241022': { provider: 'anthropic', inputCostPerMillion: 0.80, outputCostPerMillion: 4.00 },
  
  // Groq
  'llama3-8b-8192': { provider: 'groq', inputCostPerMillion: 0.05, outputCostPerMillion: 0.08 },
  'mixtral-8x7b-32768': { provider: 'groq', inputCostPerMillion: 0.24, outputCostPerMillion: 0.24 },

  // Gemini
  'gemini-1.5-pro': { provider: 'gemini', inputCostPerMillion: 1.25, outputCostPerMillion: 5.00 },
  'gemini-1.5-flash': { provider: 'gemini', inputCostPerMillion: 0.075, outputCostPerMillion: 0.30 },

  // Deepseek
  'deepseek-chat': { provider: 'deepseek', inputCostPerMillion: 0.14, outputCostPerMillion: 0.28 },

  // Mistral
  'mistral-large-latest': { provider: 'mistral', inputCostPerMillion: 2.00, outputCostPerMillion: 6.00 },

  // OpenRouter
  'meta-llama/llama-3-70b-instruct': { provider: 'openrouter', inputCostPerMillion: 0.70, outputCostPerMillion: 0.90 },
};

export function estimateStageCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const rates = costTable[model];
  if (!rates) {
    // Default low cost if model is not registered
    return (inputTokens * 0.0001 + outputTokens * 0.0003) / 1000;
  }
  const inputCost = (inputTokens / 1_000_000) * rates.inputCostPerMillion;
  const outputCost = (outputTokens / 1_000_000) * rates.outputCostPerMillion;
  return inputCost + outputCost;
}
