import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Input: React.FC<InputProps> = ({ label, className, ...props }) => (
  <div className="flex flex-col gap-1.5 mb-4">
    <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</label>
    <input
      className={`bg-surfaceHighlight border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${className}`}
      {...props}
    />
  </div>
);

export const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }> = ({ label, className, ...props }) => (
  <div className="flex flex-col gap-1.5 mb-4">
    <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</label>
    <textarea
      className={`bg-surfaceHighlight border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-y min-h-[100px] ${className}`}
      {...props}
    />
  </div>
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }> = ({ label, className, children, ...props }) => (
  <div className="flex flex-col gap-1.5 mb-4">
    <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</label>
    <div className="relative">
      <select
        className={`w-full appearance-none bg-surfaceHighlight border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${className}`}
        {...props}
      >
        {children}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
      </div>
    </div>
  </div>
);

export const Slider: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string; valueDisplay?: string | number }> = ({ label, valueDisplay, ...props }) => (
  <div className="flex flex-col gap-1.5 mb-4">
    <div className="flex justify-between items-center">
      <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</label>
      {valueDisplay !== undefined && <span className="text-xs text-primary font-mono">{valueDisplay}</span>}
    </div>
    <input
      type="range"
      className="w-full h-2 bg-surfaceHighlight rounded-lg appearance-none cursor-pointer accent-primary"
      {...props}
    />
  </div>
);
