import { DataSchema } from './dataSchema';

export interface PageComponent {
  type: 'table' | 'form' | 'chart' | 'card_list' | 'details_view' | 'button' | 'stat_summary';
  entity?: string;
  fields?: string[];
  actions?: string[];
}

export interface PageDefinition {
  id: string;
  title: string;
  route: string;
  layout: 'dashboard' | 'list' | 'detail' | 'form' | 'settings';
  components: PageComponent[];
  allowedRoles: string[];
}

export interface ApiEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  description: string;
  requestBodySchema?: string;
  responseSchema?: string;
  authRequired: boolean;
  roles: string[];
  linkedEntity?: string;
}

export interface AuthRule {
  role: string;
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete')[];
}

export interface AuthRules {
  roles: string[];
  authProvider: 'clerk' | 'next-auth' | 'supabase' | 'custom';
  rules: AuthRule[];
}

export interface IntegrationHook {
  integrationId: string; // e.g., 'slack', 'gmail', etc.
  action: string;        // e.g., 'send_message'
  trigger: string;       // e.g., 'on_entity_created'
  mapping: Record<string, string>; // Maps spec values to integration inputs
}

export interface WorkflowStep {
  id: string;
  type: 'api_call' | 'integration_hook' | 'conditional' | 'data_mutation';
  config: Record<string, unknown>;
}

export interface WorkflowStub {
  id: string;
  name: string;
  trigger: string;
  steps: WorkflowStep[];
}

export interface AppSpec {
  appName: string;
  appType: string;
  dataSchema: DataSchema;
  pages: PageDefinition[];
  apiEndpoints: ApiEndpoint[];
  authRules: AuthRules;
  integrationHooks: IntegrationHook[];
  workflowStubs: WorkflowStub[];
}
