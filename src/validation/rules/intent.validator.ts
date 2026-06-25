import { AppIntent } from '../../types/appIntent';
import { appIntentSchema } from '../../schemas/appIntent.schema';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateIntent(intent: unknown): ValidationResult {
  const errors: string[] = [];

  if (!intent) {
    return { valid: false, errors: ['Intent payload is empty or null'] };
  }

  // Schema Validation
  const schemaResult = appIntentSchema.safeParse(intent);
  if (!schemaResult.success) {
    schemaResult.error.issues.forEach((err) => {
      errors.push(`Schema Error: ${err.path.join('.') || 'root'} - ${err.message}`);
    });
    return { valid: false, errors };
  }

  const data = schemaResult.data as AppIntent;

  // Custom Business Rules
  if (data.clarification_required && !data.clarification_question) {
    errors.push('Business Error: Clarification is marked as required, but no clarification question was provided.');
  }

  if (data.entities.length === 0 && !data.clarification_required) {
    errors.push('Business Warning: No database entities defined for non-clarification intent.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
