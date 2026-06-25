import { JobStore, JobEvent } from '../store/jobStore';
import { runIntentExtraction } from './stages/intentExtraction';
import { runSchemaGeneration } from './stages/schemaGeneration';
import { runAppSpecGeneration } from './stages/appSpecGeneration';
import { RepairEngine } from '../repair/repairEngine';

// Global listeners registry for SSE stream connections
const sseListeners = new Map<string, Array<(eventData: string) => void>>();

export function addSseListener(jobId: string, listener: (eventData: string) => void) {
  if (!sseListeners.has(jobId)) {
    sseListeners.set(jobId, []);
  }
  sseListeners.get(jobId)!.push(listener);
}

export function removeSseListener(jobId: string, listener: (eventData: string) => void) {
  const list = sseListeners.get(jobId);
  if (list) {
    sseListeners.set(jobId, list.filter(l => l !== listener));
  }
}

function broadcastEvent(
  jobId: string,
  type: JobEvent['type'],
  stage?: JobEvent['stage'],
  data?: JobEvent['data']
) {
  const eventObj = {
    type,
    stage,
    data,
    timestamp: new Date().toISOString(),
  };

  // Add event to JobStore
  JobStore.addEvent(jobId, { type, stage, data });

  // Broadcast to active SSE listeners
  const list = sseListeners.get(jobId);
  if (list) {
    const sseFormatted = `event: ${type}\ndata: ${JSON.stringify(eventObj)}\n\n`;
    list.forEach(listener => listener(sseFormatted));
  }
}

export async function runGenerationPipeline(jobId: string, prompt: string): Promise<void> {
  const startTime = Date.now();
  JobStore.updateJob(jobId, { status: 'running' });

  try {
    // --- STAGE 1: INTENT EXTRACTION ---
    broadcastEvent(jobId, 'stage_start', 'intentExtraction');
    
    const intentResult = await runIntentExtraction(prompt);
    let finalIntent = intentResult.parsedIntent;

    if (intentResult.error) {
      broadcastEvent(jobId, 'stage_failed', 'intentExtraction', { error: intentResult.error });
      
      // Invoke repair engine
      broadcastEvent(jobId, 'stage_start', 'intentExtraction', { status: 'repairing' });
      const repair = RepairEngine.repair('intentExtraction', intentResult.rawOutput, intentResult.error);
      
      JobStore.addRepairLog(jobId, {
        stage: 'intentExtraction',
        logs: repair.logs,
      });

      if (repair.success) {
        finalIntent = JSON.parse(repair.repairedContent);
        broadcastEvent(jobId, 'stage_complete', 'intentExtraction', { repaired: true, data: finalIntent });
      } else {
        broadcastEvent(jobId, 'stage_failed', 'intentExtraction', { error: 'Repair engine failed structural/field corrections' });
        JobStore.updateJob(jobId, { status: 'failed', error: 'Stage 1 Intent Extraction failed' });
        return;
      }
    } else {
      broadcastEvent(jobId, 'stage_complete', 'intentExtraction', { data: finalIntent });
    }

    // Save logs and stats
    JobStore.updateJob(jobId, {
      costBreakdown: { intentExtraction: intentResult.cost },
      latency: { intentExtraction: intentResult.latencyMs },
    });

    if (!finalIntent) {
      throw new Error('Pipeline error: Extracted intent is empty');
    }

    // --- STAGE 2: SCHEMA GENERATION ---
    broadcastEvent(jobId, 'stage_start', 'schemaGeneration');
    
    const schemaResult = await runSchemaGeneration(finalIntent);
    let finalSchema = schemaResult.parsedSchema;

    if (schemaResult.error) {
      broadcastEvent(jobId, 'stage_failed', 'schemaGeneration', { error: schemaResult.error });
      
      broadcastEvent(jobId, 'stage_start', 'schemaGeneration', { status: 'repairing' });
      const repair = RepairEngine.repair('schemaGeneration', schemaResult.rawOutput, schemaResult.error);
      
      JobStore.addRepairLog(jobId, {
        stage: 'schemaGeneration',
        logs: repair.logs,
      });

      if (repair.success) {
        finalSchema = JSON.parse(repair.repairedContent);
        broadcastEvent(jobId, 'stage_complete', 'schemaGeneration', { repaired: true, data: finalSchema });
      } else {
        broadcastEvent(jobId, 'stage_failed', 'schemaGeneration', { error: 'Repair engine failed schema schema corrections' });
        JobStore.updateJob(jobId, { status: 'failed', error: 'Stage 2 Schema Generation failed' });
        return;
      }
    } else {
      broadcastEvent(jobId, 'stage_complete', 'schemaGeneration', { data: finalSchema });
    }

    const currentJob = JobStore.getJob(jobId);
    JobStore.updateJob(jobId, {
      costBreakdown: { ...currentJob?.costBreakdown, schemaGeneration: schemaResult.cost },
      latency: { ...currentJob?.latency, schemaGeneration: schemaResult.latencyMs },
    });

    if (!finalSchema) {
      throw new Error('Pipeline error: Generated schema is empty');
    }

    // --- STAGE 3: APPSPEC GENERATION ---
    broadcastEvent(jobId, 'appSpecGeneration', 'appSpecGeneration'); // Emits stage transition
    broadcastEvent(jobId, 'stage_start', 'appSpecGeneration');

    const specResult = await runAppSpecGeneration(finalIntent.appName, finalIntent.appType, finalSchema);
    let finalSpec = specResult.parsedSpec;

    if (specResult.error) {
      broadcastEvent(jobId, 'stage_failed', 'appSpecGeneration', { error: specResult.error });
      
      broadcastEvent(jobId, 'stage_start', 'appSpecGeneration', { status: 'repairing' });
      const repair = RepairEngine.repair('appSpecGeneration', specResult.rawOutput, specResult.error);
      
      JobStore.addRepairLog(jobId, {
        stage: 'appSpecGeneration',
        logs: repair.logs,
      });

      if (repair.success) {
        finalSpec = JSON.parse(repair.repairedContent);
        broadcastEvent(jobId, 'stage_complete', 'appSpecGeneration', { repaired: true, data: finalSpec });
      } else {
        broadcastEvent(jobId, 'stage_failed', 'appSpecGeneration', { error: 'Repair engine failed spec consistency corrections' });
        JobStore.updateJob(jobId, { status: 'failed', error: 'Stage 3 AppSpec Generation failed' });
        return;
      }
    } else {
      broadcastEvent(jobId, 'stage_complete', 'appSpecGeneration', { data: finalSpec });
    }

    const finalJob = JobStore.getJob(jobId);
    const totalLatency = Date.now() - startTime;

    JobStore.updateJob(jobId, {
      status: 'completed',
      costBreakdown: { ...finalJob?.costBreakdown, appSpecGeneration: specResult.cost },
      latency: { ...finalJob?.latency, appSpecGeneration: specResult.latencyMs, total: totalLatency },
      finalOutput: finalSpec,
    });

    broadcastEvent(jobId, 'generation_complete', undefined, finalSpec);

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('Fatal generation error in pipeline runner:', err);
    broadcastEvent(jobId, 'stage_failed', 'appSpecGeneration', { error: errorMessage });
    JobStore.updateJob(jobId, {
      status: 'failed',
      error: errorMessage,
    });
  }
}
