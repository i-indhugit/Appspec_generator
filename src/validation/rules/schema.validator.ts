import { DataSchema, EntitySchema } from '../../types/dataSchema';
import { dataSchemaSchema } from '../../schemas/dataSchema.schema';
import { ValidationResult } from './intent.validator';

export function validateSchema(schema: unknown): ValidationResult {
  const errors: string[] = [];

  if (!schema) {
    return { valid: false, errors: ['Schema payload is empty or null'] };
  }

  // Schema Validation
  const schemaResult = dataSchemaSchema.safeParse(schema);
  if (!schemaResult.success) {
    schemaResult.error.issues.forEach((err) => {
      errors.push(`Schema Error: ${err.path.join('.') || 'root'} - ${err.message}`);
    });
    return { valid: false, errors };
  }

  const data = schemaResult.data as DataSchema;
  const entityNames = new Set(data.entities.map(e => e.name));

  // Custom Business Rules
  data.entities.forEach((entity: EntitySchema) => {
    const fields = entity.fields || [];

    // 1. Mandatory metadata fields check
    const requiredMetadata = ['id', 'tenantId', 'createdAt', 'updatedAt'];
    requiredMetadata.forEach((meta) => {
      const field = fields.find(f => f.name === meta);
      if (!field) {
        errors.push(`Entity "${entity.name}" is missing required metadata field "${meta}"`);
      }
    });

    // 2. Relation target entity validation
    fields.forEach((field) => {
      if (field.type === 'relation') {
        if (!field.relation) {
          errors.push(`Entity "${entity.name}", field "${field.name}" has type "relation" but no relation configuration is defined`);
        } else {
          const rel = field.relation;
          if (!entityNames.has(rel.relatedEntity)) {
            errors.push(`Entity "${entity.name}", field "${field.name}" references non-existent related entity "${rel.relatedEntity}"`);
          } else {
            // Bidirectional check
            const targetEntity = data.entities.find(e => e.name === rel.relatedEntity);
            if (targetEntity) {
              const invName = rel.inverseFieldName;
              if (invName) {
                const invField = targetEntity.fields.find(f => f.name === invName);
                if (!invField) {
                  errors.push(`Entity "${entity.name}" defines relation on "${field.name}" pointing to "${rel.relatedEntity}" with inverse field "${invName}", but "${invName}" does not exist in "${rel.relatedEntity}"`);
                } else if (invField.type !== 'relation') {
                  errors.push(`Entity "${entity.name}" relation inverse field "${invName}" in "${rel.relatedEntity}" is not of type "relation"`);
                }
              }
            }
          }
        }
      }
    });
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
