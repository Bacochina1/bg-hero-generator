import React from 'react';
import { GenerationResult, GenerationSettings } from '../types';

interface PreviewAreaProps {
  isGenerating: boolean;
  currentResult: GenerationResult | null;
  previewSettings: GenerationSettings;
  onGenerateMobile: () => void;
}

export const PreviewArea: React.FC<PreviewAreaProps> = ({ isGenerating, currentResult, previewSettings, onGenerateMobile }) => {
  
  // Aspect Ratio Calculator
  const getAspectRatioClass = (ratio: string) => {
    switch(ratio) {
      case '16:9': return 'aspect-video';
      case '9:16': return 'aspect-[9/16]';
      case '1:1': return 'aspect-square';
      case '4:5': return 'aspect-[4/5]';
      default: return 'aspect-video';
    }
  };

  // Safe Area Overlay Logic
  const getSafeAreaStyles = (position: string): React.CSSProperties => {
    const base: React.CSSProperties = { 
      position: 'absolute', 
      top: '10%', 
      bottom: '10%',
      width: '30%',
      border: '2px dashed rgba(255,255,255,0.3)',
      backgroundColor: 'rgba(0,0,0,0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'rgba(255,255,255,0.7)',
      borderRadius: '8px',
      fontSize: '0.75rem',
      letterSpacing: '0.05em',
      pointerEvents: 'none'
    };

    if (position === 'left') return { ...base, left: '10%' };
    if (position === 'right') return { ...base, right: '10%' };
    return { ...base, left: '35%', width: '30%' }; // Center
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Preview & Results</h2>
        <div className="flex gap-2 text-xs text-gray-500">
           <span>{previewSettings.aspectRatio}</span>
           <span>•</span>
           <span>{previewSettings.resolution}</span>
        </div>
      </div>

      <div className={`relative w-full rounded-xl overflow-hidden bg-[#09090b] border border-zinc-800 shadow-2xl ${getAspectRatioClass(previewSettings.aspectRatio)} transition-all duration-500`}>
        {/* Grid Lines (Rule of Thirds) */}
        <div className="absolute inset-0 grid grid-cols-3 pointer-events-none z-10 opacity-10">
          <div className="border-r border-white/50 h-full"></div>
          <div className="border-r border-white/50 h-full"></div>
          <div className="col-span-1"></div>
        </div>
        <div className="absolute inset-0 grid grid-rows-3 pointer-events-none z-10 opacity-10">
          <div className="border-b border-white/50 w-full"></div>
          <div className="border-b border-white/50 w-full"></div>
          <div className="row-span-1"></div>
        </div>

        {/* Safe Area Overlay */}
        <div style={getSafeAreaStyles(previewSettings.safeArea)} className="z-20 backdrop-blur-[1px]">
          <span className="uppercase font-mono font-bold bg-black/50 px-2 py-1 rounded">Safe Area (Text)</span>
        </div>

        {/* Content */}
        {isGenerating ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 z-30">
             <div className="w-64 h-2 bg-zinc-800 rounded-full overflow-hidden">
               <div className="h-full bg-primary animate-[translateX_1.5s_ease-in-out_infinite] w-1/3 rounded-full relative" style={{ left: '-33%' }}></div>
             </div>
             <p className="mt-4 text-sm text-gray-400 font-mono animate-pulse">Designing Composition...</p>
          </div>
        ) : currentResult ? (
          <img 
            src={currentResult.imageUrl} 
            alt="Generated Hero BG" 
            className="w-full h-full object-cover animate-[fadeIn_0.5s_ease-out]" 
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-700 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black">
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto mb-2 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <p className="text-sm font-medium">Ready to generate</p>
            </div>
          </div>
        )}
      </div>

      {currentResult && !isGenerating && (
        <div className="mt-6 p-5 rounded-xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
           <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                 <span className="text-sm font-medium text-white">Generation Complete</span>
              </div>
              
              <button 
                onClick={() => navigator.clipboard.writeText(currentResult.prompt)}
                className="group flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-white transition-all bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full border border-transparent hover:border-zinc-700"
              >
                <span className="group-hover:hidden">Copy Prompt</span>
                <span className="hidden group-hover:inline">Copy to Clipboard</span>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
              </button>
           </div>
           
           <div className="mb-5 bg-black/40 rounded-lg border border-white/5 p-4 max-h-60 overflow-y-auto custom-scrollbar relative group/prompt">
             <p className="text-xs leading-relaxed font-mono text-zinc-300 whitespace-pre-wrap selection:bg-primary/30 selection:text-white">
               {currentResult.prompt}
             </p>
           </div>

           <div className="flex gap-3">
              <a 
                href={currentResult.imageUrl} 
                download={`hero-bg-${currentResult.id}.png`}
                className="flex-1 bg-white text-black text-center py-3 rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Download HD
              </a>
              {/* Generate Vertical Button */}
              {currentResult.settings.aspectRatio !== '9:16' && (
                 <button 
                   onClick={onGenerateMobile}
                   className="flex-1 bg-zinc-800 text-zinc-200 border border-zinc-700 hover:bg-zinc-700 py-3 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 hover:border-zinc-600"
                 >
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                   Convert to Mobile
                 </button>
              )}
           </div>
        </div>
      )}
    </div>
  );
};