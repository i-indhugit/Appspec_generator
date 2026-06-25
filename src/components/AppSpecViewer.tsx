import React, { useState } from 'react';
import { AppSpec } from '../types/appSpec';
import { RepairLogEntry } from '../store/jobStore';
import { RepairAttempt } from '../repair/strategies/structuralRepair';

interface AppSpecViewerProps {
  spec: AppSpec | null;
  repairLogs: RepairLogEntry[];
  cost?: Record<string, number>;
  latency?: Record<string, number>;
}

type TabType = 'entities' | 'pages' | 'api' | 'workflows' | 'repairs';

export const AppSpecViewer: React.FC<AppSpecViewerProps> = ({ spec, repairLogs, cost, latency }) => {
  const [activeTab, setActiveTab] = useState<TabType>('entities');

  if (!spec) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 shadow-xl">
        No spec configuration generated yet.
      </div>
    );
  }

  const tabs: { id: TabType; label: string }[] = [
    { id: 'entities', label: 'Entities & Fields' },
    { id: 'pages', label: 'Pages & Routing' },
    { id: 'api', label: 'API Endpoints' },
    { id: 'workflows', label: 'Workflows' },
    { id: 'repairs', label: `Repair Logs (${repairLogs.length})` },
  ];

  return (
    <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-4 gap-4">
        <div>
          <span className="text-xs font-semibold text-cyan-400 uppercase tracking-widest">Active Spec</span>
          <h2 className="text-2xl font-bold text-slate-100 mt-1">{spec.appName}</h2>
          <p className="text-xs text-slate-400 mt-0.5">Application Type: <span className="font-mono text-slate-300">{spec.appType}</span></p>
        </div>

        {latency?.total && (
          <div className="flex gap-4 text-xs font-mono text-slate-400">
            <div className="bg-slate-950/60 px-3 py-2 rounded-xl border border-slate-850">
              <span className="text-slate-500 block text-[10px] uppercase">Latency</span>
              <span className="text-cyan-400 font-semibold">{(latency.total / 1000).toFixed(2)}s</span>
            </div>
            <div className="bg-slate-950/60 px-3 py-2 rounded-xl border border-slate-850">
              <span className="text-slate-500 block text-[10px] uppercase">Est. Cost</span>
              <span className="text-emerald-400 font-semibold">
                ${Object.values(cost || {}).reduce((a, b) => a + b, 0).toFixed(4)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap border-b border-slate-800 gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition duration-150 relative ${
              activeTab === tab.id
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-slate-400 hover:text-slate-350 hover:bg-slate-800/20'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Panels */}
      <div className="pt-2">
        {activeTab === 'entities' && (
          <div className="space-y-6">
            {spec.dataSchema?.entities?.map((entity) => (
              <div key={entity.name} className="bg-slate-950/50 border border-slate-850 rounded-xl overflow-hidden shadow-md">
                <div className="bg-slate-900/80 px-4 py-3 border-b border-slate-850 flex items-center justify-between">
                  <h3 className="text-md font-bold text-slate-200">{entity.name}</h3>
                  <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
                    {entity.fields?.length || 0} fields
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-850 text-slate-500 font-semibold text-xs bg-slate-950/20">
                        <th className="px-4 py-2.5">Field Name</th>
                        <th className="px-4 py-2.5">Type</th>
                        <th className="px-4 py-2.5">Required</th>
                        <th className="px-4 py-2.5">Default Value</th>
                        <th className="px-4 py-2.5">Relation Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 text-slate-300">
                      {entity.fields?.map((field) => (
                        <tr key={field.name} className="hover:bg-slate-900/30">
                          <td className="px-4 py-2.5 font-mono text-cyan-400 text-xs">
                            {field.name}
                            {field.isPrimary && (
                              <span className="ml-2 text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded">PK</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 font-mono text-xs">{field.type}</td>
                          <td className="px-4 py-2.5">
                            {field.required ? (
                              <span className="text-xs text-emerald-400">Yes</span>
                            ) : (
                              <span className="text-xs text-slate-500">No</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 font-mono text-xs text-slate-400">
                            {field.defaultValue !== undefined ? String(field.defaultValue) : '-'}
                          </td>
                          <td className="px-4 py-2.5">
                            {field.relation ? (
                              <div className="text-xs space-y-0.5">
                                <span className="text-slate-400 font-semibold">↳ {field.relation.relatedEntity}</span>
                                <span className="text-[10px] text-slate-500 block">
                                  Type: <span className="font-mono text-slate-400">{field.relation.type}</span>
                                  {field.relation.inverseFieldName && `, Inverse: ${field.relation.inverseFieldName}`}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-600">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'pages' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {spec.pages?.map((page) => (
              <div key={page.id} className="bg-slate-950/50 border border-slate-850 rounded-xl p-5 space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-200">{page.title}</h3>
                    <span className="bg-cyan-500/10 text-cyan-400 text-xs px-2 py-0.5 rounded border border-cyan-500/20 uppercase font-mono">
                      {page.layout}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Route: <span className="font-mono text-cyan-400 bg-slate-900 px-1.5 py-0.5 rounded">{page.route}</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Roles: {page.allowedRoles?.map(r => (
                      <span key={r} className="bg-slate-800 text-slate-300 font-mono text-[10px] px-1.5 py-0.5 rounded mr-1">{r}</span>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-850 pt-4 space-y-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Components</span>
                  <div className="space-y-2">
                    {page.components?.map((comp, idx) => (
                      <div key={idx} className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-300 capitalize">{comp.type} Component</span>
                          {comp.entity && (
                            <span className="text-[10px] text-slate-400 bg-slate-850 px-1.5 py-0.5 rounded font-mono">
                              Entity: {comp.entity}
                            </span>
                          )}
                        </div>
                        {comp.fields && (
                          <div className="text-[10px] text-slate-500 flex flex-wrap gap-1 mt-1">
                            <span>Fields:</span>
                            {comp.fields.slice(0, 5).map(f => (
                              <span key={f} className="bg-slate-800 px-1.5 py-0.2 rounded font-mono text-slate-400">{f}</span>
                            ))}
                            {comp.fields.length > 5 && <span>+{comp.fields.length - 5} more</span>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'api' && (
          <div className="bg-slate-950/50 border border-slate-850 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-850 text-slate-500 font-semibold text-xs bg-slate-950/20">
                    <th className="px-4 py-3">Method</th>
                    <th className="px-4 py-3">Path</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Access Security</th>
                    <th className="px-4 py-3">Linked Entity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-300">
                  {spec.apiEndpoints?.map((api, idx) => {
                    let mBg = 'bg-slate-800 text-slate-300';
                    if (api.method === 'GET') mBg = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
                    else if (api.method === 'POST') mBg = 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20';
                    else if (api.method === 'PUT') mBg = 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
                    else if (api.method === 'DELETE') mBg = 'bg-rose-500/10 text-rose-400 border border-rose-500/20';

                    return (
                      <tr key={idx} className="hover:bg-slate-900/30">
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${mBg}`}>
                            {api.method}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-cyan-400 text-xs">{api.path}</td>
                        <td className="px-4 py-3 text-xs text-slate-350">{api.description}</td>
                        <td className="px-4 py-3 text-xs space-y-1">
                          {api.authRequired ? (
                            <span className="inline-block text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.2 rounded mr-1">Auth Required</span>
                          ) : (
                            <span className="inline-block text-[10px] bg-slate-800 text-slate-400 px-2 py-0.2 rounded mr-1">Public</span>
                          )}
                          <span className="text-[10px] text-slate-500">
                            Roles: {api.roles?.join(', ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-400">
                          {api.linkedEntity || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'workflows' && (
          <div className="space-y-6">
            {spec.workflowStubs?.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No custom workflows defined.</p>
            ) : (
              spec.workflowStubs?.map((flow) => (
                <div key={flow.id} className="bg-slate-950/50 border border-slate-850 rounded-xl p-5 space-y-4">
                  <div>
                    <h3 className="text-md font-bold text-slate-200">{flow.name}</h3>
                    <p className="text-xs text-slate-500">Trigger: <span className="font-mono text-cyan-400">{flow.trigger}</span></p>
                  </div>
                  <div className="relative pl-6 border-l-2 border-slate-800 space-y-4">
                    {flow.steps?.map((step, idx) => (
                      <div key={step.id} className="relative">
                        <span className="absolute -left-8 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-slate-400">
                          {idx + 1}
                        </span>
                        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 text-xs space-y-1">
                          <span className="font-semibold text-slate-300 capitalize">{step.type.replace('_', ' ')}</span>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {JSON.stringify(step.config)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'repairs' && (
          <div className="bg-slate-950/50 border border-slate-850 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-850 text-slate-500 font-semibold text-xs bg-slate-950/20">
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Pipeline Stage</th>
                    <th className="px-4 py-3">Strategy</th>
                    <th className="px-4 py-3">Error Context</th>
                    <th className="px-4 py-3">Outcome</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-350">
                  {repairLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500 text-xs">
                        No repair operations logged. Pipeline completed cleanly.
                      </td>
                    </tr>
                  ) : (
                    repairLogs.map((log, idx) => {
                      return (
                        <React.Fragment key={idx}>
                          {log.logs?.map((attempt: RepairAttempt, attIdx: number) => {
                            let outBg = 'bg-slate-800 text-slate-300';
                            if (attempt.outcome === 'repaired') outBg = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
                            else if (attempt.outcome === 'failed') outBg = 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
                            else if (attempt.outcome === 'escalated') outBg = 'bg-amber-500/10 text-amber-400 border border-amber-500/20';

                            return (
                              <tr key={`${idx}-${attIdx}`} className="hover:bg-slate-900/30 text-xs">
                                <td className="px-4 py-2.5 text-slate-500 font-mono text-[10px]">
                                  {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : '-'}
                                </td>
                                <td className="px-4 py-2.5 font-mono text-[10px] text-slate-400">
                                  {log.stage}
                                </td>
                                <td className="px-4 py-2.5 capitalize font-mono text-cyan-400">{attempt.strategy}</td>
                                <td className="px-4 py-2.5 text-slate-400 max-w-xs truncate" title={attempt.inputError}>
                                  {attempt.inputError}
                                </td>
                                <td className="px-4 py-2.5">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${outBg}`}>
                                    {attempt.outcome}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
