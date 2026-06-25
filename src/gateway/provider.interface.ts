export interface GenerateOptions {
  timeoutMs?: number;
  temperature?: number;
}

export interface AIProvider {
  generate(prompt: string, model: string, options?: GenerateOptions): Promise<string>;
}
