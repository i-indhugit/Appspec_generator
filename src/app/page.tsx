'use client';

import React, { useState, useEffect } from 'react';
import { PromptInput } from '../components/PromptInput';
import { StageProgress } from '../components/StageProgress';
import { AppSpecViewer } from '../components/AppSpecViewer';
import { ErrorPanel } from '../components/ErrorPanel';
import { IntegrationPanel } from '../components/IntegrationPanel';
import { AppSpec } from '../types/appSpec';
import { RepairAttempt } from '../repair/strategies/structuralRepair';
import { IntegrationModule } from '../components/IntegrationPanel';
import { RepairLogEntry } from '../store/jobStore';

export default function Home() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);
  
  interface StageState {
    name: string;
    label: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'repairing';
    latency?: number;
    cost?: number;
  }

  // Pipeline stage tracking
  const [stages, setStages] = useState<StageState[]>([
    { name: 'intentExtraction', label: '1. Intent Extraction', status: 'pending', latency: undefined, cost: undefined },
    { name: 'schemaGeneration', label: '2. Schema Generation', status: 'pending', latency: undefined, cost: undefined },
    { name: 'appSpecGeneration', label: '3. AppSpec Generation', status: 'pending', latency: undefined, cost: undefined },
  ]);

  const [spec, setSpec] = useState<AppSpec | null>(null);
  const [repairLogs, setRepairLogs] = useState<RepairLogEntry[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [costBreakdown, setCostBreakdown] = useState<Record<string, number>>({});
  const [latency, setLatency] = useState<Record<string, number>>({});
  const [integrationsRegistry, setIntegrationsRegistry] = useState<IntegrationModule[]>([]);

  // Fetch Integrations Registry on mount
  useEffect(() => {
    async function loadRegistry() {
      try {
        const res = await fetch('/api/integrations');
        const data = await res.json();
        if (data.integrations) {
          setIntegrationsRegistry(data.integrations);
        }
      } catch (err) {
        console.error('Failed to load integration registry:', err);
      }
    }
    loadRegistry();
  }, []);

  // Submit Prompt to Start Generation Job
  const handlePromptSubmit = async (promptText: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    setValidationErrors([]);
    setSpec(null);
    setRepairLogs([]);
    setJobId(null);
    
    // Reset stages to pending
    setStages(prev => prev.map(s => ({ ...s, status: 'pending', latency: undefined, cost: undefined })));

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText }),
      });
      const data = await res.json();
      
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Server error');
      }

      setJobId(data.jobId);
      startSSEStream(data.jobId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setErrorMsg(errorMessage || 'Failed to start generation pipeline');
      setIsLoading(false);
    }
  };

  // Connect to SSE Stream
  const startSSEStream = (activeJobId: string) => {
    const url = `/api/generate/${activeJobId}/stream`;
    const eventSource = new EventSource(url);

    const updateStageStatus = (stageName: string, status: StageState['status'], data?: Partial<StageState>) => {
      setStages(prev => prev.map(s => {
        if (s.name === stageName) {
          return { ...s, status, ...data };
        }
        return s;
      }));
    };

    eventSource.addEventListener('stage_start', (event) => {
      const me = event as MessageEvent;
      const payload = JSON.parse(me.data);
      updateStageStatus(payload.stage, payload.data?.status || 'running');
    });

    eventSource.addEventListener('stage_complete', (event) => {
      const me = event as MessageEvent;
      const payload = JSON.parse(me.data);
      updateStageStatus(payload.stage, 'completed');
      
      // Update intermediate output or spec if final
      if (payload.stage === 'appSpecGeneration' && payload.data?.data) {
        setSpec(payload.data.data);
      }
    });

    eventSource.addEventListener('stage_failed', (event) => {
      const me = event as MessageEvent;
      const payload = JSON.parse(me.data);
      updateStageStatus(payload.stage, 'failed');
      if (payload.data?.error) {
        setValidationErrors(prev => [...prev, `${payload.stage}: ${payload.data.error}`]);
      }
    });

    eventSource.addEventListener('generation_complete', (event) => {
      const me = event as MessageEvent;
      const payload = JSON.parse(me.data);
      setSpec(payload.data);
      setIsLoading(false);
      eventSource.close();
      
      // Fetch full metrics once completed
      fetchJobMetrics(activeJobId);
    });

    eventSource.onerror = (err) => {
      console.warn('SSE connection closed or lost. Attempting sync...', err);
      eventSource.close();
      setIsLoading(false);
      // Fallback: Poll for status
      fetchJobMetrics(activeJobId);
    };
  };

  // Sync / Retrieve job metrics
  const fetchJobMetrics = async (activeJobId: string) => {
    try {
      const res = await fetch(`/api/generate/${activeJobId}`);
      const data = await res.json();
      if (!res.ok || data.error) return;

      setRepairLogs(data.repairLogs || []);
      setCostBreakdown(data.costBreakdown || {});
      setLatency(data.latency || {});
      
      if (data.status === 'completed') {
        setSpec(data.AppSpec);
        setStages(prev => prev.map(s => ({
          ...s,
          status: 'completed',
          cost: data.costBreakdown?.[s.name],
          latency: data.latency?.[s.name],
        })));
        setIsLoading(false);
      } else if (data.status === 'failed') {
        setErrorMsg(data.error || 'Pipeline generation failed');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Failed to sync job metrics:', err);
    }
  };

  // Targeted repair trigger
  const handleRepairTriggered = async (stage: string, errorHint: string) => {
    if (!jobId || isRepairing) return;
    setIsRepairing(true);
    setErrorMsg(null);
    setValidationErrors([]);

    try {
      const res = await fetch(`/api/generate/${jobId}/repair`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage, errorHint }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Repair command error');
      }

      if (data.success) {
        // Success
        await fetchJobMetrics(jobId);
      } else {
        setErrorMsg('Programmatic repair engine could not resolve consistency rules. Refine requirements.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setErrorMsg(`Repair Failed: ${errorMessage}`);
    } finally {
      setIsRepairing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 flex flex-col antialiased">
      {/* Header Banner */}
      <header className="bg-slate-900/40 border-b border-slate-800/80 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-cyan-500/10 text-cyan-400 font-mono font-bold text-sm tracking-tighter px-2.5 py-1 rounded border border-cyan-500/20">
              SPEC-AI
            </span>
            <span className="text-slate-400 font-medium text-xs">/ Pipeline Architect</span>
          </div>
          <div className="text-slate-500 text-xs font-semibold">Next.js 15 AppRouter</div>
        </div>
      </header>

      {/* Main dashboard space */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-6 py-8 space-y-6">
        {/* Banner Hero */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900 border border-slate-800/60 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 space-y-2">
            <span className="text-[10px] font-bold tracking-widest text-cyan-400 uppercase">Production Engine</span>
            <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-slate-100 to-indigo-300">
              Natural Language AppSpec Pipeline
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Design relational models, security filters, endpoints, and micro-workflows directly from speech descriptions.
              Programmatic validation enforces schemas and targeted corrections without failures.
            </p>
          </div>
        </div>

        {/* Input & Progress grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <PromptInput onSubmit={handlePromptSubmit} isLoading={isLoading} />
          </div>
          <div className="lg:col-span-5">
            <StageProgress stages={stages} currentStage={null} />
          </div>
        </div>

        {/* Error/Warning logs if any */}
        {(errorMsg || validationErrors.length > 0) && (
          <ErrorPanel
            jobId={jobId || ''}
            errorMsg={errorMsg}
            validationErrors={validationErrors}
            onRepairTriggered={handleRepairTriggered}
            isRepairing={isRepairing}
          />
        )}

        {/* Visual spec layout panel */}
        <AppSpecViewer
          spec={spec}
          repairLogs={repairLogs}
          cost={costBreakdown}
          latency={latency}
        />

        {/* Third-party connections panel */}
        <IntegrationPanel integrations={integrationsRegistry} />
      </main>

      {/* Page Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-6 text-center text-xs text-slate-600">
        &copy; {new Date().getFullYear()} Antigravity Systems. Custom TypeScript Clean Architecture.
      </footer>
    </div>
  );
}
