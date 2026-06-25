import { z } from 'zod';

export const appIntentSchema = z.object({
  appName: z.string().min(1, 'App name is required'),
  appType: z.enum([
    'crm',
    'project_management',
    'ecommerce',
    'hr_tool',
    'inventory',
    'content_platform',
    'analytics',
    'custom',
  ]),
  features: z.array(z.string()),
  entities: z.array(z.string()),
  integrations_requested: z.array(z.string()),
  assumptions: z.array(z.string()),
  clarification_required: z.boolean(),
  clarification_question: z.string().nullable(),
}).strict();

export type AppIntentSchemaType = z.infer<typeof appIntentSchema>;
