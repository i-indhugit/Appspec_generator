import React, { useState } from 'react';

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
}

const PRESETS = [
  { name: 'Real Estate CRM (WhatsApp)', prompt: 'CRM for a real estate agency with WhatsApp notifications.' },
  { name: 'Task Manager (Slack)', prompt: 'Task manager with Slack alerts.' },
  { name: 'Inventory System (Email)', prompt: 'Inventory system with email alerts.' },
  { name: 'HR Tool (Leave Approval)', prompt: 'HR tool with leave approval notifications.' },
  { name: 'Ecommerce (Stripe & Gmail)', prompt: 'Ecommerce backend with Stripe and Gmail.' },
  { name: 'Notion for Doctors', prompt: 'Build something like Notion for doctors.' },
  { name: 'Mega Platform', prompt: 'Platform with login, payments, roles, chat, files, mobile, analytics and marketplace.' }
];

export const PromptInput: React.FC<PromptInputProps> = ({ onSubmit, isLoading }) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    onSubmit(prompt);
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl">
      <h2 className="text-xl font-semibold text-slate-100 mb-4">Create New Application Spec</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="promptInput" className="block text-sm font-medium text-slate-400 mb-2">
            Describe your application in natural language
          </label>
          <textarea
            id="promptInput"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe database entities, user flows, access controls, and integrations..."
            rows={4}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition duration-200 font-sans resize-none"
            disabled={isLoading}
          />
        </div>

        <div className="flex flex-wrap gap-2 mb-2">
          <span className="text-xs font-semibold text-slate-500 self-center mr-2">Presets:</span>
          {PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => setPrompt(p.prompt)}
              className="bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded-full border border-slate-750 transition duration-150 active:scale-95"
              disabled={isLoading}
            >
              {p.name}
            </button>
          ))}
        </div>

        <div className="flex justify-end border-t border-slate-800/60 pt-4">
          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className={`px-6 py-2.5 rounded-xl font-medium text-sm transition duration-150 flex items-center gap-2 ${
              isLoading || !prompt.trim()
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800'
                : 'bg-cyan-600 text-slate-100 hover:bg-cyan-500 border border-cyan-600 cursor-pointer shadow-lg shadow-cyan-500/10'
            }`}
          >
            {isLoading ? 'Generating Pipeline...' : 'Generate AppSpec'}
          </button>
        </div>
      </form>
    </div>
  );
};
