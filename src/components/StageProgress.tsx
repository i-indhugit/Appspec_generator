import React from 'react';

interface StageState {
  name: string;
  label: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'repairing';
  latency?: number;
  cost?: number;
}

interface StageProgressProps {
  stages: StageState[];
  currentStage: string | null;
}

export const StageProgress: React.FC<StageProgressProps> = ({ stages }) => {
  return (
    <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
      <h2 className="text-xl font-semibold text-slate-100 mb-2">Generation Progress</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stages.map((stage) => {
          const isRunning = stage.status === 'running';
          const isRepairing = stage.status === 'repairing';
          const isCompleted = stage.status === 'completed';
          const isFailed = stage.status === 'failed';

          let statusBg = 'bg-slate-950 border-slate-800 text-slate-500';
          let indicatorBg = 'bg-slate-800';
          let statusText = 'Pending';

          if (isRunning) {
            statusBg = 'bg-cyan-950/40 border-cyan-800 text-cyan-400';
            indicatorBg = 'bg-cyan-500';
            statusText = 'In Progress';
          } else if (isRepairing) {
            statusBg = 'bg-amber-950/40 border-amber-800 text-amber-400';
            indicatorBg = 'bg-amber-500';
            statusText = 'Repairing';
          } else if (isCompleted) {
            statusBg = 'bg-emerald-950/40 border-emerald-800 text-emerald-400';
            indicatorBg = 'bg-emerald-500';
            statusText = 'Completed';
          } else if (isFailed) {
            statusBg = 'bg-rose-950/40 border-rose-800 text-rose-400';
            indicatorBg = 'bg-rose-500';
            statusText = 'Failed';
          }

          return (
            <div
              key={stage.name}
              className={`border rounded-xl p-4 transition-all duration-200 ${statusBg}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {stage.label}
                </span>
                <span className="flex h-2.5 w-2.5 rounded-full relative">
                  <span className={`inline-flex rounded-full h-full w-full ${indicatorBg}`}></span>
                </span>
              </div>
              
              <div className="text-lg font-bold text-slate-200 mb-2">
                {statusText}
              </div>

              {(isCompleted || stage.latency || stage.cost) && (
                <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-850 pt-2 text-slate-400">
                  <div>
                    <span className="text-slate-500 block">Latency</span>
                    <span className="font-mono text-slate-300">
                      {stage.latency ? `${(stage.latency / 1000).toFixed(2)}s` : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Cost</span>
                    <span className="font-mono text-slate-300">
                      {stage.cost !== undefined ? `$${stage.cost.toFixed(4)}` : '-'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
