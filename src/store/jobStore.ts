import { AppSpec } from '../types/appSpec';
import { RepairAttempt } from '../repair/strategies/structuralRepair';

export interface RepairLogEntry {
  stage: 'intentExtraction' | 'schemaGeneration' | 'appSpecGeneration';
  success?: boolean;
  repairedContent?: string;
  logs: RepairAttempt[];
  timestamp: string;
  manual?: boolean;
}

export interface JobEvent {
  type: 'stage_start' | 'stage_complete' | 'stage_failed' | 'generation_complete' | 'appSpecGeneration';
  stage?: 'intentExtraction' | 'schemaGeneration' | 'appSpecGeneration';
  data?: unknown;
  timestamp: string;
}

export interface JobState {
  jobId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  prompt: string;
  events: JobEvent[];
  repairLogs: RepairLogEntry[];
  costBreakdown: Record<string, number>;
  latency: Record<string, number>;
  finalOutput: AppSpec | null;
  error?: string;
}

// Persist the store globally in hot-reloading Next.js environments
const globalForJobs = globalThis as unknown as {
  jobStoreInstance: Map<string, JobState>;
};

if (!globalForJobs.jobStoreInstance) {
  globalForJobs.jobStoreInstance = new Map<string, JobState>();
}

export class JobStore {
  private static getStore(): Map<string, JobState> {
    return globalForJobs.jobStoreInstance;
  }

  public static createJob(jobId: string, prompt: string): JobState {
    const job: JobState = {
      jobId,
      status: 'pending',
      prompt,
      events: [
        {
          type: 'stage_start',
          stage: 'intentExtraction',
          timestamp: new Date().toISOString(),
        },
      ],
      repairLogs: [],
      costBreakdown: {},
      latency: {},
      finalOutput: null,
    };
    this.getStore().set(jobId, job);
    return job;
  }

  public static getJob(jobId: string): JobState | undefined {
    return this.getStore().get(jobId);
  }

  public static updateJob(jobId: string, updates: Partial<JobState>): JobState | undefined {
    const job = this.getStore().get(jobId);
    if (!job) return undefined;

    const updated = { ...job, ...updates };
    this.getStore().set(jobId, updated);
    return updated;
  }

  public static addEvent(jobId: string, event: Omit<JobEvent, 'timestamp'>): JobEvent | undefined {
    const job = this.getStore().get(jobId);
    if (!job) return undefined;

    const fullEvent: JobEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };
    job.events.push(fullEvent);
    this.getStore().set(jobId, job);
    return fullEvent;
  }

  public static addRepairLog(jobId: string, log: Omit<RepairLogEntry, 'timestamp'>): void {
    const job = this.getStore().get(jobId);
    if (job) {
      job.repairLogs.push({
        ...log,
        timestamp: new Date().toISOString(),
      });
      this.getStore().set(jobId, job);
    }
  }

  public static listJobs(): JobState[] {
    return Array.from(this.getStore().values());
  }
}
