import { AppIntent } from '../../types/appIntent';
import { DataSchema } from '../../types/dataSchema';
import { AppSpec } from '../../types/appSpec';

export function repairIntentFields(intent: unknown): AppIntent {
  const result = { ...(intent as Record<string, unknown>) };
  
  if (typeof result.appName !== 'string' || !result.appName) {
    result.appName = 'CustomApp';
  }
  
  const validTypes = ['crm', 'project_management', 'ecommerce', 'hr_tool', 'inventory', 'content_platform', 'analytics', 'custom'];
  if (typeof result.appType !== 'string' || !validTypes.includes(result.appType)) {
    result.appType = 'custom';
  }
  
  if (!Array.isArray(result.features)) {
    result.features = result.features ? [String(result.features)] : [];
  }
  
  if (!Array.isArray(result.entities)) {
    result.entities = result.entities ? [String(result.entities)] : [];
  }
  
  if (!Array.isArray(result.integrations_requested)) {
    result.integrations_requested = [];
  }
  
  if (!Array.isArray(result.assumptions)) {
    result.assumptions = [];
  }
  
  if (typeof result.clarification_required !== 'boolean') {
    result.clarification_required = false;
  }
  
  if (result.clarification_required && !result.clarification_question) {
    result.clarification_question = 'Could you please specify additional details about your application requirements?';
  } else if (!result.clarification_required) {
    result.clarification_question = null;
  }

  return result as unknown as AppIntent;
}

export function repairSchemaFields(schema: unknown): DataSchema {
  const result = { ...(schema as Record<string, unknown>) };
  
  if (!Array.isArray(result.entities)) {
    result.entities = [];
  }

  result.entities = (result.entities as unknown[]).map((entity) => {
    const ent = entity as Record<string, unknown>;
    const fields = Array.isArray(ent.fields) ? ent.fields : [];
    
    // Ensure all fields have required parameters
    const repairedFields = (fields as unknown[]).map((f) => {
      const repaired = { ...(f as Record<string, unknown>) };
      if (typeof repaired.name !== 'string' || !repaired.name) {
        repaired.name = 'unknownField';
      }
      const validTypes = ['string', 'number', 'boolean', 'date', 'relation'];
      if (typeof repaired.type !== 'string' || !validTypes.includes(repaired.type)) {
        repaired.type = 'string';
      }
      if (typeof repaired.required !== 'boolean') {
        repaired.required = false;
      }
      if (repaired.type === 'relation' && !repaired.relation) {
        repaired.relation = {
          relatedEntity: 'User',
          type: 'many-to-one',
        };
      }
      return repaired;
    });

    // Enforce metadata fields
    const metaFields = ['id', 'tenantId', 'createdAt', 'updatedAt'];
    metaFields.forEach((meta) => {
      if (!repairedFields.some((f) => f.name === meta)) {
        const isId = meta === 'id';
        repairedFields.unshift({
          name: meta,
          type: isId ? 'string' : (meta.endsWith('At') ? 'date' : 'string'),
          required: true,
          isPrimary: isId ? true : undefined,
        });
      }
    });

    return {
      name: typeof ent.name === 'string' && ent.name ? ent.name : 'UnknownEntity',
      fields: repairedFields as unknown as DataSchema['entities'][0]['fields'],
    };
  });

  return result as unknown as DataSchema;
}

export function repairAppSpecFields(spec: unknown): AppSpec {
  const result = { ...(spec as Record<string, unknown>) };
  
  if (typeof result.appName !== 'string') result.appName = 'AppSpecApp';
  if (typeof result.appType !== 'string') result.appType = 'custom';
  
  if (!result.dataSchema) {
    result.dataSchema = { entities: [] };
  } else {
    result.dataSchema = repairSchemaFields(result.dataSchema);
  }
  
  if (!Array.isArray(result.pages)) result.pages = [];
  if (!Array.isArray(result.apiEndpoints)) result.apiEndpoints = [];
  
  if (!result.authRules || typeof result.authRules !== 'object') {
    result.authRules = {
      roles: ['admin', 'user'],
      authProvider: 'clerk',
      rules: [
        { role: 'admin', resource: '*', actions: ['create', 'read', 'update', 'delete'] },
        { role: 'user', resource: '*', actions: ['read'] },
      ],
    };
  } else {
    const auth = result.authRules as Record<string, unknown>;
    if (!Array.isArray(auth.roles)) auth.roles = ['admin', 'user'];
    if (!auth.authProvider) auth.authProvider = 'clerk';
    if (!Array.isArray(auth.rules)) auth.rules = [];
  }
  
  if (!Array.isArray(result.integrationHooks)) result.integrationHooks = [];
  if (!Array.isArray(result.workflowStubs)) result.workflowStubs = [];

  return result as unknown as AppSpec;
}

export function runFieldRepair(stage: string, rawJson: string): { repairedContent: string; outcome: 'repaired' | 'failed' } {
  try {
    const parsed = JSON.parse(rawJson);
    let repaired: unknown;
    
    if (stage === 'intentExtraction') {
      repaired = repairIntentFields(parsed);
    } else if (stage === 'schemaGeneration') {
      repaired = repairSchemaFields(parsed);
    } else if (stage === 'appSpecGeneration') {
      repaired = repairAppSpecFields(parsed);
    } else {
      throw new Error(`Unknown stage for field repair: ${stage}`);
    }

    return {
      repairedContent: JSON.stringify(repaired, null, 2),
      outcome: 'repaired',
    };
  } catch {
    return {
      repairedContent: rawJson,
      outcome: 'failed',
    };
  }
}
