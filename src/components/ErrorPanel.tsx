import React, { useState } from 'react';

interface ErrorPanelProps {
  jobId: string;
  errorMsg: string | null;
  validationErrors: string[];
  onRepairTriggered: (stage: string, errorHint: string) => void;
  isRepairing: boolean;
}

export const ErrorPanel: React.FC<ErrorPanelProps> = ({
  errorMsg,
  validationErrors,
  onRepairTriggered,
  isRepairing,
}) => {
  const [selectedStage, setSelectedStage] = useState('appSpecGeneration');
  const [customError, setCustomError] = useState('');

  if (!errorMsg && validationErrors.length === 0) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRepairing) return;
    const hint = customError.trim() || validationErrors.join('; ') || errorMsg || 'Consistency check validation mismatch';
    onRepairTriggered(selectedStage, hint);
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-md border border-rose-950/60 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex items-center gap-3">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500/25 border border-rose-500/30 text-rose-400 font-bold text-xs">!</span>
        <h2 className="text-lg font-semibold text-rose-400">Pipeline Errors & Validation Failures</h2>
      </div>

      <div className="space-y-3">
        {errorMsg && (
          <div className="bg-rose-950/20 border border-rose-900/30 rounded-xl p-4 text-xs font-mono text-rose-300">
            <span className="text-rose-400 block font-semibold mb-1">Execution Exception:</span>
            {errorMsg}
          </div>
        )}

        {validationErrors.length > 0 && (
          <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-4 space-y-2">
            <span className="text-xs font-semibold text-slate-400 block">Unresolved Validation Failures ({validationErrors.length})</span>
            <ul className="list-disc pl-4 space-y-1 text-xs text-slate-300 font-sans">
              {validationErrors.map((err, idx) => (
                <li key={idx} className="leading-relaxed">{err}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Manual Repair Form */}
      <div className="border-t border-slate-800/80 pt-5 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-350">Targeted Repair Engine Trigger</h3>
          <p className="text-xs text-slate-500 mt-0.5">Instruct the repair strategies to correct inconsistencies programmatically.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label htmlFor="stageSelect" className="block text-xs font-medium text-slate-500 mb-1.5">Pipeline Stage</label>
              <select
                id="stageSelect"
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 transition duration-150 cursor-pointer"
              >
                <option value="intentExtraction">Stage 1 - Intent Extraction</option>
                <option value="schemaGeneration">Stage 2 - Schema Generation</option>
                <option value="appSpecGeneration">Stage 3 - AppSpec Generation</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="repairHintInput" className="block text-xs font-medium text-slate-500 mb-1.5">Custom Correction Instruction (Optional)</label>
              <input
                id="repairHintInput"
                type="text"
                value={customError}
                onChange={(e) => setCustomError(e.target.value)}
                placeholder="Leave blank to auto-inject the validation log errors above"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 placeholder-slate-650 focus:outline-none focus:border-cyan-500 transition duration-150"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isRepairing}
              className={`px-5 py-2 rounded-xl text-xs font-medium transition duration-150 cursor-pointer ${
                isRepairing
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-850'
                  : 'bg-amber-600/90 text-amber-100 hover:bg-amber-500 border border-amber-600 shadow-md shadow-amber-500/5'
              }`}
            >
              {isRepairing ? 'Repairing Active Specs...' : 'Trigger Programmatic Repair'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
