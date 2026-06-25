import fs from 'fs';
import path from 'path';
import { runIntentExtraction } from '../src/pipeline/stages/intentExtraction';
import { runSchemaGeneration } from '../src/pipeline/stages/schemaGeneration';
import { runAppSpecGeneration } from '../src/pipeline/stages/appSpecGeneration';
import { RepairEngine } from '../src/repair/repairEngine';
import { JobStore } from '../src/store/jobStore';
import { AppIntent } from '../src/types/appIntent';
import { IntegrationHook } from '../src/types/appSpec';

const PROMPTS = [
  { id: 1, prompt: 'CRM for a real estate agency with WhatsApp notifications.' },
  { id: 2, prompt: 'Task manager with Slack alerts.' },
  { id: 3, prompt: 'Inventory system with email alerts.' },
  { id: 4, prompt: 'HR tool with leave approval notifications.' },
  { id: 5, prompt: 'Ecommerce backend with Stripe and Gmail.' },
  { id: 6, prompt: 'Event platform with WhatsApp confirmations.' },
  { id: 7, prompt: 'Project tracker with Jira and Google Sheets.' },
  { id: 8, prompt: 'An app.' },
  { id: 9, prompt: 'Build something like Notion for doctors.' },
  { id: 10, prompt: 'Platform with login, payments, roles, chat, files, mobile, analytics and marketplace.' },
  { id: 11, prompt: 'CRM and project manager and invoicing tool.' },
  { id: 12, prompt: 'Task manager but make it smart.' }
];

interface EvalRecord {
  scenarioId: number;
  prompt: string;
  success: boolean;
  failedStage: string | null;
  repairStrategy: string | null;
  retryCount: number;
  latencyMs: number;
  estimatedCost: number;
  integrationsDetected: string[];
}

async function runEvaluationSuite() {
  console.log('Starting AppSpec Pipeline Evaluation Suite...');
  const records: EvalRecord[] = [];

  for (const item of PROMPTS) {
    console.log(`Running Scenario ${item.id}: "${item.prompt}"`);
    const startTime = Date.now();
    
    let success = true;
    let failedStage: string | null = null;
    let repairStrategy: string | null = null;
    let retryCount = 0;
    let totalCost = 0;
    
    const jobId = `eval_${item.id}`;
    JobStore.createJob(jobId, item.prompt);

    let finalIntent: AppIntent | null = null;

    try {
      // 1. Intent Extraction
      const intentRes = await runIntentExtraction(item.prompt);
      totalCost += intentRes.cost;
      
      finalIntent = intentRes.parsedIntent;
      if (intentRes.error) {
        retryCount++;
        const repair = RepairEngine.repair('intentExtraction', intentRes.rawOutput, intentRes.error);
        if (repair.success) {
          finalIntent = JSON.parse(repair.repairedContent);
          repairStrategy = 'field/structural';
        } else {
          success = false;
          failedStage = 'intentExtraction';
        }
      }

      // 2. Schema Generation
      if (success && finalIntent) {
        const schemaRes = await runSchemaGeneration(finalIntent);
        totalCost += schemaRes.cost;
        
        let finalSchema = schemaRes.parsedSchema;
        if (schemaRes.error) {
          retryCount++;
          const repair = RepairEngine.repair('schemaGeneration', schemaRes.rawOutput, schemaRes.error);
          if (repair.success) {
            finalSchema = JSON.parse(repair.repairedContent);
            repairStrategy = 'field/consistency';
          } else {
            success = false;
            failedStage = 'schemaGeneration';
          }
        }

        // 3. AppSpec Generation
        if (success && finalSchema) {
          const specRes = await runAppSpecGeneration(finalIntent.appName, finalIntent.appType, finalSchema);
          totalCost += specRes.cost;
          
          if (specRes.error) {
            retryCount++;
            const repair = RepairEngine.repair('appSpecGeneration', specRes.rawOutput, specRes.error);
            if (repair.success) {
              repairStrategy = 'consistency';
            } else {
              success = false;
              failedStage = 'appSpecGeneration';
            }
          }
        }
      }
    } catch (err) {
      success = false;
      failedStage = failedStage || 'execution';
      console.error(`Error in scenario ${item.id}:`, err);
    }

    const latencyMs = Date.now() - startTime;
    const job = JobStore.getJob(jobId);
    const integrations = job?.finalOutput?.integrationHooks?.map((h: IntegrationHook) => h.integrationId) || 
                          finalIntent?.integrations_requested || [];

    records.push({
      scenarioId: item.id,
      prompt: item.prompt,
      success,
      failedStage,
      repairStrategy,
      retryCount,
      latencyMs,
      estimatedCost: totalCost,
      integrationsDetected: Array.from(new Set(integrations)),
    });
  }

  // Save Results to JSON
  const outputDir = path.join(__dirname, '../evaluation');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'evaluationResults.json');
  fs.writeFileSync(outputPath, JSON.stringify({ results: records }, null, 2));
  console.log(`Evaluation results written to ${outputPath}`);

  // Print Summary Analysis (300-word summary)
  const successCount = records.filter(r => r.success).length;
  const successRate = (successCount / records.length) * 100;
  
  console.log('\n--- EVALUATION SUMMARY ---');
  console.log(`Success Rate: ${successRate.toFixed(2)}% (${successCount}/${records.length} scenarios completed successfully)`);
  console.log('--------------------------\n');
}

runEvaluationSuite().catch((err) => {
  console.error('Fatal error running evaluation:', err);
});
