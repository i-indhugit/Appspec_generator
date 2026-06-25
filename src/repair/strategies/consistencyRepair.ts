import { AppSpec } from '../../types/appSpec';

const SUPPORTED_INTEGRATIONS = ['slack', 'gmail', 'whatsapp', 'stripe', 'jira'];

export function runConsistencyRepair(specJson: string): { repairedContent: string; outcome: 'repaired' | 'failed' } {
  try {
    const spec = JSON.parse(specJson) as AppSpec;
    if (!spec.dataSchema || !Array.isArray(spec.dataSchema.entities)) {
      return { repairedContent: specJson, outcome: 'failed' };
    }

    const entities = spec.dataSchema.entities;
    const entityNames = new Set(entities.map(e => e.name));
    const entityNamesLower = new Map<string, string>();
    entities.forEach(e => entityNamesLower.set(e.name.toLowerCase(), e.name));

    // 1. Roles alignment
    if (!spec.authRules) {
      spec.authRules = { roles: ['admin', 'user'], authProvider: 'clerk', rules: [] };
    }
    const rolesSet = new Set(spec.authRules.roles || ['admin', 'user']);

    // Ensure all roles specified in pages allowedRoles exist in authRules.roles
    if (Array.isArray(spec.pages)) {
      spec.pages.forEach((page) => {
        if (Array.isArray(page.allowedRoles)) {
          page.allowedRoles.forEach((role) => {
            if (role !== '*' && !rolesSet.has(role)) {
              rolesSet.add(role);
            }
          });
        }
      });
    }

    // Ensure all roles specified in apiEndpoints exist in authRules.roles
    if (Array.isArray(spec.apiEndpoints)) {
      spec.apiEndpoints.forEach((api) => {
        if (Array.isArray(api.roles)) {
          api.roles.forEach((role) => {
            if (role !== '*' && !rolesSet.has(role)) {
              rolesSet.add(role);
            }
          });
        }
      });
    }
    spec.authRules.roles = Array.from(rolesSet);

    // 2. Integration sanitization
    if (Array.isArray(spec.integrationHooks)) {
      spec.integrationHooks = spec.integrationHooks.map((hook) => {
        let intId = hook.integrationId.toLowerCase();
        if (intId === 'google-mail' || intId === 'email' || intId === 'mail') intId = 'gmail';
        if (intId === 'stripe-pay') intId = 'stripe';
        if (intId === 'whats-app') intId = 'whatsapp';
        
        if (!SUPPORTED_INTEGRATIONS.includes(intId)) {
          // Default fallback
          intId = 'slack';
        }
        return {
          ...hook,
          integrationId: intId,
        };
      });
    }

    // 3. Workflow Entity reference repair
    if (Array.isArray(spec.workflowStubs)) {
      spec.workflowStubs.forEach((workflow) => {
        if (Array.isArray(workflow.steps)) {
          workflow.steps.forEach((step) => {
            if (step.config && step.config.entity) {
              const entName = String(step.config.entity);
              if (!entityNames.has(entName)) {
                // Try fuzzy lowercase/plural matches
                const singularLower = entName.toLowerCase().replace(/s$/, '');
                if (entityNamesLower.has(singularLower)) {
                  step.config.entity = entityNamesLower.get(singularLower);
                } else if (entities.length > 0) {
                  // Fallback to first available entity
                  step.config.entity = entities[0].name;
                }
              }
            }
          });
        }
      });
    }

    // 4. Page-API Consistency Repair
    // "every page must have an API endpoint"
    if (Array.isArray(spec.pages) && Array.isArray(spec.apiEndpoints)) {
      spec.pages.forEach((page) => {
        const pageEntities = new Set<string>();
        if (Array.isArray(page.components)) {
          page.components.forEach((comp) => {
            if (comp.entity) pageEntities.add(comp.entity);
          });
        }

        if (pageEntities.size === 0) {
          // General page - make sure there is an endpoint that matches route segment
          const pathSegment = page.route.replace(/^\//, '').split('/')[0];
          const hasEndpoint = spec.apiEndpoints.some(
            api => api.path.includes(pathSegment) || api.path === page.route
          );
          if (!hasEndpoint) {
            // Programmatically inject list API
            spec.apiEndpoints.push({
              path: `/api/${pathSegment || 'general'}`,
              method: 'GET',
              description: `Retrieve details for ${page.title}`,
              authRequired: true,
              roles: ['admin', 'user'],
            });
          }
        } else {
          // Bound entity page - make sure each bound entity has a linked API endpoint
          pageEntities.forEach((entity) => {
            const hasEndpoint = spec.apiEndpoints.some(api => api.linkedEntity === entity);
            if (!hasEndpoint) {
              const lower = entity.toLowerCase();
              spec.apiEndpoints.push(
                {
                  path: `/api/${lower}s`,
                  method: 'GET',
                  description: `Fetch list of ${entity}s`,
                  authRequired: true,
                  roles: ['admin', 'user'],
                  linkedEntity: entity,
                },
                {
                  path: `/api/${lower}s`,
                  method: 'POST',
                  description: `Create new ${entity}`,
                  authRequired: true,
                  roles: ['admin'],
                  linkedEntity: entity,
                }
              );
            }
          });
        }
      });
    }

    return {
      repairedContent: JSON.stringify(spec, null, 2),
      outcome: 'repaired',
    };
  } catch {
    return {
      repairedContent: specJson,
      outcome: 'failed',
    };
  }
}
