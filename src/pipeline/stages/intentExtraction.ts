import { AppIntent } from '../../types/appIntent';
import { runStageModel, extractJsonFromMarkdown, StageExecutionResult } from '../pipelineHelper';
import { appIntentSchema } from '../../schemas/appIntent.schema';

export interface IntentStageResult extends StageExecutionResult {
  parsedIntent: AppIntent | null;
  error: string | null;
}

export async function runIntentExtraction(prompt: string): Promise<IntentStageResult> {
  const systemPrompt = `You are an AI system analyst. Extract the user's application intent from the following natural language request.
Your response MUST be a single, valid JSON block inside markdown triple-backticks (\`\`\`json ... \`\`\`).
Do NOT include any extra conversational text outside the JSON block.

The JSON MUST conform to this typescript structure:
interface AppIntent {
  appName: string; // The proposed name of the app
  appType: 'crm' | 'project_management' | 'ecommerce' | 'hr_tool' | 'inventory' | 'content_platform' | 'analytics' | 'custom';
  features: string[]; // List of core features requested
  entities: string[]; // List of database entities or tables needed (e.g. Lead, Property, Task)
  integrations_requested: string[]; // Slack, Gmail, WhatsApp, Stripe, Jira, etc.
  assumptions: string[]; // Assumptions made due to vague requirements
  clarification_required: boolean; // Set to true if the request is too vague or needs input to continue
  clarification_question: string | null; // Question for the user if clarification_required is true
}

User request:
"${prompt}"
`;

  try {
    const execution = await runStageModel('intentExtraction', systemPrompt);
    const cleaned = extractJsonFromMarkdown(execution.rawOutput);
    
    try {
      const parsed = JSON.parse(cleaned);
      // Validate schema format
      const validation = appIntentSchema.safeParse(parsed);
      if (validation.success) {
        return {
          ...execution,
          parsedIntent: validation.data as AppIntent,
          error: null,
        };
      } else {
        return {
          ...execution,
          parsedIntent: parsed as unknown as AppIntent, // Hand off to repair engine
          error: `Zod validation failed: ${validation.error.message}`,
        };
      }
    } catch (parseError) {
      const parseErrorMessage = parseError instanceof Error ? parseError.message : String(parseError);
      return {
        ...execution,
        parsedIntent: null,
        error: `JSON parse error: ${parseErrorMessage}. Raw output length: ${cleaned.length}`,
      };
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return {
      rawOutput: '',
      modelUsed: 'failed',
      cost: 0,
      latencyMs: 0,
      parsedIntent: null,
      error: `Execution error: ${errorMessage}`,
    };
  }
}
