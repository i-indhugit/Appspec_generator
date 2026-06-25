import { DataSchema } from '../../types/dataSchema';
import { AppSpec } from '../../types/appSpec';
import { runStageModel, extractJsonFromMarkdown, StageExecutionResult } from '../pipelineHelper';
import { appSpecSchema } from '../../schemas/appSpec.schema';

export interface AppSpecStageResult extends StageExecutionResult {
  parsedSpec: AppSpec | null;
  error: string | null;
}

export async function runAppSpecGeneration(appName: string, appType: string, schema: DataSchema): Promise<AppSpecStageResult> {
  const systemPrompt = `You are a systems engineer. Generate a full AppSpec JSON configuration based on the provided DataSchema.
Your response MUST be a single, valid JSON block inside markdown triple-backticks (\`\`\`json ... \`\`\`).
Do NOT include any extra text.

The JSON MUST conform to this typescript structure:
interface AppSpec {
  appName: string;
  appType: string;
  dataSchema: DataSchema; // The provided schema verbatim
  pages: Array<{
    id: string; // e.g. dashboard, task_list, lead_form
    title: string;
    route: string; // e.g. /tasks, /leads/:id
    layout: 'dashboard' | 'list' | 'detail' | 'form' | 'settings';
    components: Array<{
      type: 'table' | 'form' | 'chart' | 'card_list' | 'details_view' | 'button' | 'stat_summary';
      entity?: string; // Target entity name if bound, e.g. Task, Lead
      fields?: string[]; // Array of field names to display/edit
      actions?: string[]; // Array of strings like create, edit, delete, submit
    }>;
    allowedRoles: string[]; // e.g. ['admin', 'user']
  }>;
  apiEndpoints: Array<{
    path: string; // e.g. /api/tasks, /api/tasks/:id
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    description: string;
    requestBodySchema?: string; // Optional description of requested payload
    responseSchema?: string; // Optional description of response payload
    authRequired: boolean;
    roles: string[];
    linkedEntity?: string; // PascalCase entity name, e.g. Task
  }>;
  authRules: {
    roles: string[]; // List of roles like ['admin', 'user', 'manager']
    authProvider: 'clerk' | 'next-auth' | 'supabase' | 'custom';
    rules: Array<{
      role: string;
      resource: string; // '*' or specific entity
      actions: Array<'create' | 'read' | 'update' | 'delete'>;
    }>;
  };
  integrationHooks: Array<{
    integrationId: string; // slack, gmail, whatsapp, stripe, jira
    action: string; // action id matching the registry (e.g. send_message, create_payment_intent)
    trigger: string; // trigger event name, e.g. on_entity_created, on_payment_success
    mapping: Record<string, string>; // maps variables, e.g. { "channel": "#alerts", "text": "New task: {{title}}" }
  }>;
  workflowStubs: Array<{
    id: string;
    name: string;
    trigger: string;
    steps: Array<{
      id: string;
      type: 'api_call' | 'integration_hook' | 'conditional' | 'data_mutation';
      config: Record<string, any>;
    }>;
  }>;
}

Constraints:
1. Every page MUST have at least one associated API endpoint that reads or writes the target entity.
2. Any entity referenced in a workflow step, component, or integration mapping MUST exist in the DataSchema.
3. Keep the mappings clean and simple.

DataSchema:
${JSON.stringify(schema, null, 2)}
`;

  try {
    const execution = await runStageModel('appSpecGeneration', systemPrompt);
    const cleaned = extractJsonFromMarkdown(execution.rawOutput);

    try {
      const parsed = JSON.parse(cleaned) as AppSpec;
      
      // Force injection of appName and appType from context if missing
      parsed.appName = parsed.appName || appName;
      parsed.appType = parsed.appType || appType;
      parsed.dataSchema = schema; // Ensure schema is injected verbatim

      // Programmatic repairs for constraints can be handled here or inside the consistency repair strategy.
      // We will perform basic structural checks and forward to validation/repair engines.

      const validation = appSpecSchema.safeParse(parsed);
      if (validation.success) {
        return {
          ...execution,
          parsedSpec: validation.data as AppSpec,
          error: null,
        };
      } else {
        return {
          ...execution,
          parsedSpec: parsed,
          error: `Zod validation failed: ${validation.error.message}`,
        };
      }
    } catch (parseError) {
      const parseErrorMessage = parseError instanceof Error ? parseError.message : String(parseError);
      return {
        ...execution,
        parsedSpec: null,
        error: `JSON parse error: ${parseErrorMessage}`,
      };
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return {
      rawOutput: '',
      modelUsed: 'failed',
      cost: 0,
      latencyMs: 0,
      parsedSpec: null,
      error: `Execution error: ${errorMessage}`,
    };
  }
}
