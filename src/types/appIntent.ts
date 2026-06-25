export type AppType =
  | 'crm'
  | 'project_management'
  | 'ecommerce'
  | 'hr_tool'
  | 'inventory'
  | 'content_platform'
  | 'analytics'
  | 'custom';

export interface AppIntent {
  appName: string;
  appType: AppType;
  features: string[];
  entities: string[];
  integrations_requested: string[];
  assumptions: string[];
  clarification_required: boolean;
  clarification_question: string | null;
}
