import { validateIntent, ValidationResult } from './rules/intent.validator';
import { validateSchema } from './rules/schema.validator';
import { validateAppSpec } from './rules/appSpec.validator';

export class PipelineValidator {
  public static validate(stage: 'intentExtraction' | 'schemaGeneration' | 'appSpecGeneration', data: unknown): ValidationResult {
    try {
      switch (stage) {
        case 'intentExtraction':
          return validateIntent(data);
        case 'schemaGeneration':
          return validateSchema(data);
        case 'appSpecGeneration':
          return validateAppSpec(data);
        default:
          return { valid: false, errors: [`Unknown validation stage: ${stage}`] };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      // Gracefully prevent exceptions, return error details instead
      return {
        valid: false,
        errors: [`Unhandled exception during validation: ${errorMessage}`],
      };
    }
  }
}
