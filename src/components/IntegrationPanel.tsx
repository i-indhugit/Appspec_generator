import React from 'react';

interface ParameterDef {
  name: string;
  type: string;
  required: boolean;
}

export interface IntegrationAction {
  id: string;
  displayName: string;
  inputParameters: ParameterDef[];
  outputParameters: ParameterDef[];
}

export interface IntegrationTrigger {
  id: string;
  displayName: string;
}

export interface IntegrationModule {
  id: string;
  displayName: string;
  authType: string;
  triggers: IntegrationTrigger[];
  actions: IntegrationAction[];
}

interface IntegrationPanelProps {
  integrations: IntegrationModule[];
}

export const IntegrationPanel: React.FC<IntegrationPanelProps> = ({ integrations }) => {
  return (
    <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-100">Integration Registry</h2>
        <p className="text-xs text-slate-500 mt-0.5">Supported third-party hooks and background trigger actions.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrations.map((intg) => (
          <div key={intg.id} className="bg-slate-950/60 border border-slate-850 rounded-xl p-4 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                <span className="font-bold text-slate-200 text-sm">{intg.displayName}</span>
                <span className="text-[9px] bg-slate-800 text-slate-400 font-mono uppercase px-2 py-0.5 rounded border border-slate-750">
                  {intg.authType}
                </span>
              </div>

              {/* Triggers */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-semibold text-slate-500 block">Triggers</span>
                {intg.triggers.length === 0 ? (
                  <span className="text-xs text-slate-650">-</span>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {intg.triggers.map(t => (
                      <span key={t.id} className="bg-slate-900 text-slate-400 font-mono text-[9px] px-1.5 py-0.5 rounded" title={t.displayName}>
                        {t.id}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-1">
                <span className="text-[10px] uppercase font-semibold text-slate-500 block">Actions & Schemas</span>
                <div className="space-y-2">
                  {intg.actions.map((act) => (
                    <div key={act.id} className="bg-slate-900/60 rounded-lg p-2 text-xs border border-slate-850">
                      <span className="font-semibold text-slate-300 block">{act.displayName}</span>
                      <span className="text-[10px] text-slate-500 font-mono block mb-1">Action: {act.id}</span>
                      
                      <div className="space-y-1 mt-1.5 border-t border-slate-850 pt-1 text-[9px] text-slate-400">
                        <span className="text-slate-500 font-semibold block uppercase tracking-tight">Inputs:</span>
                        <div className="grid grid-cols-1 gap-0.5">
                          {act.inputParameters.map(p => (
                            <div key={p.name} className="flex justify-between">
                              <span className="font-mono text-cyan-400">{p.name} {p.required && <span className="text-red-500">*</span>}</span>
                              <span className="text-slate-550">({p.type})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
