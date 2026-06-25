import { slackIntegration } from './slack';
import { gmailIntegration } from './gmail';
import { whatsappIntegration } from './whatsapp';
import { stripeIntegration } from './stripe';
import { jiraIntegration } from './jira';
import { z } from 'zod';

export interface IntegrationAction {
  id: string;
  displayName: string;
  inputSchema: z.ZodObject<z.ZodRawShape>;
  outputSchema: z.ZodObject<z.ZodRawShape>;
}

export interface IntegrationTrigger {
  id: string;
  displayName: string;
}

export interface IntegrationModule {
  id: string;
  displayName: string;
  authType: 'oauth2' | 'apikey' | 'none';
  triggers: IntegrationTrigger[];
  actions: IntegrationAction[];
}

export class IntegrationRegistry {
  private static integrations: Map<string, IntegrationModule> = new Map<string, IntegrationModule>([
    ['slack', slackIntegration],
    ['gmail', gmailIntegration],
    ['whatsapp', whatsappIntegration],
    ['stripe', stripeIntegration],
    ['jira', jiraIntegration],
  ]);

  public static getIntegrations(): IntegrationModule[] {
    return Array.from(this.integrations.values());
  }

  public static getIntegration(id: string): IntegrationModule | undefined {
    return this.integrations.get(id.toLowerCase());
  }

  public static validateAction(
    integrationId: string,
    actionId: string,
    payload: unknown
  ): { valid: boolean; errors: string[] } {
    const integration = this.getIntegration(integrationId);
    if (!integration) {
      return { valid: false, errors: [`Integration "${integrationId}" is not registered.`] };
    }

    const action = integration.actions.find((a) => a.id === actionId);
    if (!action) {
      return { valid: false, errors: [`Action "${actionId}" is not defined for integration "${integrationId}".`] };
    }

    // Because mapping properties could contain template tags (e.g. {{lead.name}}),
    // a literal schema parse will fail if the value is not fully evaluated.
    // In our registry validation, we can check for syntax presence or evaluate literal values when possible,
    // or relax validation when templates are detected.
    if (typeof payload === 'object' && payload !== null) {
      const p = payload as Record<string, unknown>;
      const hasTemplates = Object.values(p).some(val => typeof val === 'string' && (val as string).includes('{{'));
      if (hasTemplates) {
        // Skip Zod schema strict check, verify key presence instead
        const expectedKeys = Object.keys(action.inputSchema.shape);
        const missingKeys: string[] = [];
        expectedKeys.forEach((key) => {
          const fieldSchema = action.inputSchema.shape[key] as unknown as { isOptional: () => boolean };
          const isRequired = !fieldSchema.isOptional();
          if (isRequired && (p[key] === undefined || p[key] === null || p[key] === '')) {
            missingKeys.push(key);
          }
        });
        if (missingKeys.length > 0) {
          return {
            valid: false,
            errors: missingKeys.map(k => `Missing required parameter "${k}" in templated mapping`),
          };
        }
        return { valid: true, errors: [] };
      }
    }

    const parseResult = action.inputSchema.safeParse(payload);
    if (!parseResult.success) {
      return {
        valid: false,
        errors: parseResult.error.issues.map(
          (err: z.ZodIssue) => `Validation Error: "${err.path.join('.')}" - ${err.message}`
        ),
      };
    }

    return { valid: true, errors: [] };
  }
}
