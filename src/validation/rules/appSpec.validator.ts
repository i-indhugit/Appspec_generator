import { AppSpec } from '../../types/appSpec';
import { appSpecSchema } from '../../schemas/appSpec.schema';
import { ValidationResult } from './intent.validator';

const SUPPORTED_INTEGRATIONS = new Set(['slack', 'gmail', 'whatsapp', 'stripe', 'jira']);

export function validateAppSpec(spec: unknown): ValidationResult {
  const errors: string[] = [];

  if (!spec) {
    return { valid: false, errors: ['AppSpec payload is empty or null'] };
  }

  // Schema Validation
  const schemaResult = appSpecSchema.safeParse(spec);
  if (!schemaResult.success) {
    schemaResult.error.issues.forEach((err) => {
      errors.push(`Schema Error: ${err.path.join('.') || 'root'} - ${err.message}`);
    });
    return { valid: false, errors };
  }

  const data = schemaResult.data as AppSpec;

  const entityNames = new Set(data.dataSchema.entities.map(e => e.name));
  const definedRoles = new Set(data.authRules.roles);

  // 1. Page-API Consistency Check:
  // "every page must have an API endpoint"
  // We check that for each page, there is at least one API endpoint related to the page's route, title, or components' entities.
  data.pages.forEach((page) => {
    // Collect all entities in the page components
    const pageEntities = new Set<string>();
    page.components.forEach((comp) => {
      if (comp.entity) pageEntities.add(comp.entity);
    });

    if (pageEntities.size === 0) {
      // General page - verify at least one API endpoint matches a path prefix or general query
      const pathSegment = page.route.replace(/^\//, '').split('/')[0];
      const hasEndpoint = data.apiEndpoints.some(
        api => api.path.includes(pathSegment) || api.path === page.route
      );
      if (!hasEndpoint) {
        errors.push(`Page Consistency: Page "${page.title}" (${page.route}) has no matching API endpoints`);
      }
    } else {
      // Entity-bound page - verify at least one API endpoint matches each bound entity
      pageEntities.forEach((entity) => {
        const hasEndpoint = data.apiEndpoints.some(
          api => api.linkedEntity === entity
        );
        if (!hasEndpoint) {
          errors.push(`Page Consistency: Page "${page.title}" uses entity "${entity}" but no API endpoint is linked to "${entity}"`);
        }
      });
    }

    // Verify all entity references in page components actually exist in DataSchema
    pageEntities.forEach((entity) => {
      if (!entityNames.has(entity)) {
        errors.push(`Page Consistency: Page "${page.title}" references undefined entity "${entity}"`);
      }
    });

    // 2. Role validation on pages
    page.allowedRoles.forEach((role) => {
      if (!definedRoles.has(role) && role !== '*') {
        errors.push(`Role Error: Page "${page.title}" allows role "${role}" which is not defined in authRules.roles`);
      }
    });
  });

  // 3. Role validation on API endpoints
  data.apiEndpoints.forEach((api) => {
    api.roles.forEach((role) => {
      if (!definedRoles.has(role) && role !== '*') {
        errors.push(`Role Error: API Endpoint "${api.method} ${api.path}" allows role "${role}" which is not defined in authRules.roles`);
      }
    });

    if (api.linkedEntity && !entityNames.has(api.linkedEntity)) {
      errors.push(`API Error: API Endpoint "${api.method} ${api.path}" links to undefined entity "${api.linkedEntity}"`);
    }
  });

  // 4. Workflow Entity validation:
  // "workflow entities must exist"
  data.workflowStubs.forEach((workflow) => {
    // Check if trigger mentions an entity, e.g., on_lead_created
    entityNames.forEach(() => {
      // If workflow trigger contains entity name, or step config does
      workflow.steps.forEach((step) => {
        const stepEntity = step.config.entity;
        if (stepEntity && typeof stepEntity === 'string' && !entityNames.has(stepEntity)) {
          errors.push(`Workflow Error: Workflow "${workflow.name}" step "${step.id}" references undefined entity "${stepEntity}"`);
        }
      });
    });
  });

  // 5. Integration reference validation
  data.integrationHooks.forEach((hook) => {
    if (!SUPPORTED_INTEGRATIONS.has(hook.integrationId.toLowerCase())) {
      errors.push(`Integration Error: Hook uses unsupported integration ID "${hook.integrationId}"`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
