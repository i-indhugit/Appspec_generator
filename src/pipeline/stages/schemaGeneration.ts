import { AppIntent } from '../../types/appIntent';
import { DataSchema, EntitySchema, FieldSchema } from '../../types/dataSchema';
import { runStageModel, extractJsonFromMarkdown, StageExecutionResult } from '../pipelineHelper';
import { dataSchemaSchema } from '../../schemas/dataSchema.schema';

export interface SchemaStageResult extends StageExecutionResult {
  parsedSchema: DataSchema | null;
  error: string | null;
}

export async function runSchemaGeneration(intent: AppIntent): Promise<SchemaStageResult> {
  const systemPrompt = `You are a database architect. Generate a relational DataSchema based on the provided Application Intent.
Your response MUST be a single, valid JSON block inside markdown triple-backticks (\`\`\`json ... \`\`\`).
Do NOT include any extra text.

The JSON MUST conform to this structure:
interface DataSchema {
  entities: Array<{
    name: string; // The PascalCase name of the entity, e.g. Lead, Customer, Appointment
    fields: Array<{
      name: string; // camelCase field name, e.g. title, email, agentId
      type: 'string' | 'number' | 'boolean' | 'date' | 'relation';
      required: boolean;
      defaultValue?: string | number | boolean;
      isPrimary?: boolean;
      relation?: {
        relatedEntity: string; // PascalCase entity name being referred
        type: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
        inverseFieldName?: string; // Field name on target entity (e.g. leads)
      };
    }>;
  }>;
}

Guidelines:
- Every field that represents a relation must have type = 'relation' and a valid 'relation' object.
- Create clear relationships as specified in the intent features (e.g. Property leads, Viewings to Lead, Task to Project).
- Do not define metadata fields like id, tenantId, createdAt, or updatedAt; these will be automatically injected by the system. Just define domain-specific fields.

Application Intent:
${JSON.stringify(intent, null, 2)}
`;

  try {
    const execution = await runStageModel('schemaGeneration', systemPrompt);
    const cleaned = extractJsonFromMarkdown(execution.rawOutput);

    try {
      const parsed = JSON.parse(cleaned) as DataSchema;
      
      // Post-process: Programmatically inject metadata fields into all entities
      if (parsed && Array.isArray(parsed.entities)) {
        parsed.entities = parsed.entities.map((entity: EntitySchema) => {
          const fields = entity.fields || [];
          
          const metaFields = [
            { name: 'id', type: 'string' as const, required: true, isPrimary: true },
            { name: 'tenantId', type: 'string' as const, required: true },
            { name: 'createdAt', type: 'date' as const, required: true },
            { name: 'updatedAt', type: 'date' as const, required: true },
          ];

          const filteredFields = fields.filter(f => !['id', 'tenantId', 'createdAt', 'updatedAt'].includes(f.name));
          
          return {
            ...entity,
            fields: [...metaFields, ...filteredFields],
          };
        });

        // Post-process: Enforce bidirectional consistency for relations
        parsed.entities = enforceBidirectionalRelations(parsed.entities);
      }

      const validation = dataSchemaSchema.safeParse(parsed);
      if (validation.success) {
        return {
          ...execution,
          parsedSchema: validation.data as DataSchema,
          error: null,
        };
      } else {
        return {
          ...execution,
          parsedSchema: parsed,
          error: `Zod validation failed: ${validation.error.message}`,
        };
      }
    } catch (parseError) {
      const parseErrorMessage = parseError instanceof Error ? parseError.message : String(parseError);
      return {
        ...execution,
        parsedSchema: null,
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
      parsedSchema: null,
      error: `Execution error: ${errorMessage}`,
    };
  }
}

/**
 * Ensures relationship endpoints are bidirectionally consistent.
 * If Entity A has field "bId" of type relation to Entity B,
 * then Entity B should have a corresponding inverse field of type relation to Entity A.
 */
function enforceBidirectionalRelations(entities: EntitySchema[]): EntitySchema[] {
  const entityMap = new Map<string, EntitySchema>();
  entities.forEach(e => entityMap.set(e.name, e));

  const relationsToInject: Array<{
    targetEntity: string;
    field: FieldSchema;
  }> = [];

  entities.forEach((sourceEntity) => {
    sourceEntity.fields.forEach((field) => {
      if (field.type === 'relation' && field.relation) {
        const rel = field.relation;
        const targetEntityName = rel.relatedEntity;
        const target = entityMap.get(targetEntityName);
        
        if (target) {
          const invName = rel.inverseFieldName || `${sourceEntity.name.toLowerCase()}s`;
          // Check if target already has this relation field
          const hasInv = target.fields.some(f => f.name === invName || (f.type === 'relation' && f.relation?.relatedEntity === sourceEntity.name));
          
          if (!hasInv) {
            // Determine inverse relation type
            let invType: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many' = 'one-to-many';
            if (rel.type === 'many-to-one') invType = 'one-to-many';
            else if (rel.type === 'one-to-many') invType = 'many-to-one';
            else if (rel.type === 'one-to-one') invType = 'one-to-one';
            else if (rel.type === 'many-to-many') invType = 'many-to-many';

            relationsToInject.push({
              targetEntity: targetEntityName,
              field: {
                name: invName,
                type: 'relation',
                required: false,
                relation: {
                  relatedEntity: sourceEntity.name,
                  type: invType,
                  inverseFieldName: field.name,
                },
              },
            });
          }
        }
      }
    });
  });

  // Inject computed relations
  relationsToInject.forEach(({ targetEntity, field }) => {
    const entity = entityMap.get(targetEntity);
    if (entity) {
      entity.fields.push(field);
    }
  });

  return Array.from(entityMap.values());
}
