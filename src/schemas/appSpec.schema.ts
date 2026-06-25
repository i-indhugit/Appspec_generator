import { z } from 'zod';
import { dataSchemaSchema } from './dataSchema.schema';

export const pageComponentSchema = z.object({
  type: z.enum(['table', 'form', 'chart', 'card_list', 'details_view', 'button', 'stat_summary']),
  entity: z.string().optional(),
  fields: z.array(z.string()).optional(),
  actions: z.array(z.string()).optional(),
}).strict();

export const pageDefinitionSchema = z.object({
  id: z.string().min(1, 'Page ID is required'),
  title: z.string().min(1, 'Page title is required'),
  route: z.string().min(1, 'Page route is required'),
  layout: z.enum(['dashboard', 'list', 'detail', 'form', 'settings']),
  components: z.array(pageComponentSchema),
  allowedRoles: z.array(z.string()),
}).strict();

export const apiEndpointSchema = z.object({
  path: z.string().min(1, 'API path is required'),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE']),
  description: z.string().min(1, 'API description is required'),
  requestBodySchema: z.string().optional(),
  responseSchema: z.string().optional(),
  authRequired: z.boolean(),
  roles: z.array(z.string()),
  linkedEntity: z.string().optional(),
}).strict();

export const authRuleSchema = z.object({
  role: z.string().min(1, 'Role name is required'),
  resource: z.string().min(1, 'Resource name is required'),
  actions: z.array(z.enum(['create', 'read', 'update', 'delete'])),
}).strict();

export const authRulesSchema = z.object({
  roles: z.array(z.string()),
  authProvider: z.enum(['clerk', 'next-auth', 'supabase', 'custom']),
  rules: z.array(authRuleSchema),
}).strict();

export const integrationHookSchema = z.object({
  integrationId: z.string().min(1, 'Integration ID is required'),
  action: z.string().min(1, 'Action is required'),
  trigger: z.string().min(1, 'Trigger is required'),
  mapping: z.record(z.string(), z.string()),
}).strict();

export const workflowStepSchema = z.object({
  id: z.string().min(1, 'Step ID is required'),
  type: z.enum(['api_call', 'integration_hook', 'conditional', 'data_mutation']),
  config: z.record(z.string(), z.any()),
}).strict();

export const workflowStubSchema = z.object({
  id: z.string().min(1, 'Workflow ID is required'),
  name: z.string().min(1, 'Workflow name is required'),
  trigger: z.string().min(1, 'Trigger is required'),
  steps: z.array(workflowStepSchema),
}).strict();

export const appSpecSchema = z.object({
  appName: z.string().min(1, 'App name is required'),
  appType: z.string().min(1, 'App type is required'),
  dataSchema: dataSchemaSchema,
  pages: z.array(pageDefinitionSchema),
  apiEndpoints: z.array(apiEndpointSchema),
  authRules: authRulesSchema,
  integrationHooks: z.array(integrationHookSchema),
  workflowStubs: z.array(workflowStubSchema),
}).strict();

export type AppSpecSchemaType = z.infer<typeof appSpecSchema>;
export type PageDefinitionSchemaType = z.infer<typeof pageDefinitionSchema>;
export type ApiEndpointSchemaType = z.infer<typeof apiEndpointSchema>;
export type AuthRulesSchemaType = z.infer<typeof authRulesSchema>;
export type IntegrationHookSchemaType = z.infer<typeof integrationHookSchema>;
export type WorkflowStubSchemaType = z.infer<typeof workflowStubSchema>;
export type WorkflowStepSchemaType = z.infer<typeof workflowStepSchema>;
export type PageComponentSchemaType = z.infer<typeof pageComponentSchema>;
