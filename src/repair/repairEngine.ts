import { runStructuralRepair, RepairAttempt } from './strategies/structuralRepair';
import { runFieldRepair } from './strategies/fieldRepair';
import { runConsistencyRepair } from './strategies/consistencyRepair';
import { PipelineValidator } from '../validation/validator';

export interface RepairResult {
  success: boolean;
  repairedContent: string;
  logs: RepairAttempt[];
}

export class RepairEngine {
  public static repair(
    stage: 'intentExtraction' | 'schemaGeneration' | 'appSpecGeneration',
    rawContent: string,
    errorHint: string
  ): RepairResult {
    const logs: RepairAttempt[] = [];
    let currentContent = rawContent;

    // Phase 1: Structural Repair (Broken JSON, truncation)
    // Run if there is a JSON parse error in the error hint or content isn't valid JSON
    let needsStructural = false;
    try {
      JSON.parse(currentContent);
    } catch {
      needsStructural = true;
    }

    if (needsStructural || errorHint.toLowerCase().includes('json') || errorHint.toLowerCase().includes('parse')) {
      const struct = runStructuralRepair(currentContent);
      logs.push({
        strategy: 'structural',
        inputError: errorHint,
        outcome: struct.outcome,
      });

      if (struct.outcome === 'repaired') {
        currentContent = struct.repairedContent;
      } else {
        // structural failed, escalate
        return {
          success: false,
          repairedContent: currentContent,
          logs,
        };
      }
    }

    // Check if valid now after structural fixes
    let valResult = PipelineValidator.validate(stage, JSON.parse(currentContent));
    if (valResult.valid) {
      return { success: true, repairedContent: currentContent, logs };
    }

    // Phase 2: Field Repair (missing fields, invalid types)
    const fieldResult = runFieldRepair(stage, currentContent);
    logs.push({
      strategy: 'field',
      inputError: valResult.errors.join('; '),
      outcome: fieldResult.outcome,
    });

    if (fieldResult.outcome === 'repaired') {
      currentContent = fieldResult.repairedContent;
    }

    // Check if valid now
    valResult = PipelineValidator.validate(stage, JSON.parse(currentContent));
    if (valResult.valid) {
      return { success: true, repairedContent: currentContent, logs };
    }

    // Phase 3: Consistency Repair (page-api links, workflows, invalid integrations)
    if (stage === 'appSpecGeneration') {
      const consistencyResult = runConsistencyRepair(currentContent);
      logs.push({
        strategy: 'consistency',
        inputError: valResult.errors.join('; '),
        outcome: consistencyResult.outcome,
      });

      if (consistencyResult.outcome === 'repaired') {
        currentContent = consistencyResult.repairedContent;
      }
    }

    // Final Validation Check
    valResult = PipelineValidator.validate(stage, JSON.parse(currentContent));
    if (valResult.valid) {
      return {
        success: true,
        repairedContent: currentContent,
        logs,
      };
    } else {
      // Escalated to user or system retry because programmatic fixes couldn't resolve all issues
      logs.push({
        strategy: 'consistency',
        inputError: valResult.errors.join('; '),
        outcome: 'escalated',
      });
      return {
        success: false,
        repairedContent: currentContent,
        logs,
      };
    }
  }
}
