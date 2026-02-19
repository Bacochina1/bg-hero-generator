import React, { useState, useRef, useEffect } from 'react';
import { generateHeroBg } from './services/geminiService';
import { GenerationSettings, GenerationResult, Preset, GenerationMode } from './types';
import { Input, TextArea, Select, Slider } from './components/ui/Input';
import { Button } from './components/ui/Button';
import { PreviewArea } from './components/PreviewArea';

const PRESETS: Preset[] = [
  {
    name: "Neon Lime Tech",
    description: "Dark + Glow",
    visualIdentity: "Dark minimalist background, matte black surfaces, vivid neon lime green (#a3e635) accents. Geometric 3D primitives (cubes, spheres) floating with motion blur. Cyberpunk tech UI overlays, grid lines, coding fragments in glass cards."
  },
  {
    name: "Cobalt Corporate",
    description: "Trust + Depth",
    visualIdentity: "Deep cobalt blue (#1e3a8a) to midnight blue gradient. Abstract upward-pointing arrows or chevrons built from frosted glass. Clean, reliable B2B aesthetic. Soft studio lighting, very smooth bokeh."
  },
  {
    name: "Amber Luxe",
    description: "Premium Editorial",
    visualIdentity: "Luxury editorial style. Deep warm charcoal background with liquid amber/gold (#d97706) light leaks. High contrast, rim lighting on the subject. Silk-like textures, floating gold dust particles. Elegant and sophisticated."
  }
];

const INITIAL_SETTINGS: GenerationSettings = {
  mode: 'person',
  personImages: [], 
  mockupImage: null,
  elementImages: [],
  elementsText: "",
  visualIdentity: "",
  personPosition: 'right',
  safeArea: 'left',
  aspectRatio: '16:9',
  resolution: '1920x1080',
  quality: '1K',
  generateVertical: false,
  styleStrength: 75,
  depthOfField: 60,
  lighting: 'Cinematic',
  grain: true,
  negativePrompt: ""
};

const MAX_PEOPLE = 5;

const App: React.FC = () => {
  const [settings, setSettings] = useState<GenerationSettings>(INITIAL_SETTINGS);
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<GenerationResult[]>([]);
  const [currentResult, setCurrentResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Resolution presets based on aspect ratio
  const getResolutions = (ratio: string) => {
    switch (ratio) {
      case '16:9': return ['1920x1080', '2560x1440'];
      case '9:16': return ['1080x1920', '1440x2560'];
      case '1:1': return ['1080x1080', '2048x2048'];
      case '4:5': return ['1080x1350'];
      default: return ['1920x1080'];
    }
  };

  const executeGeneration = async (config: GenerationSettings) => {
    // Validation
    if (config.mode === 'person' && config.personImages.length === 0) return;
    if (config.mode === 'mockup' && !config.mockupImage) return;
    
    setIsGenerating(true);
    setError(null);
    setCurrentResult(null);

    try {
      const { imageUrl, finalPrompt } = await generateHeroBg(config);
      
      const newResult: GenerationResult = {
        id: Date.now().toString(),
        imageUrl,
        prompt: finalPrompt,
        settings: { ...config },
        timestamp: Date.now()
      };

      setCurrentResult(newResult);
      setHistory(prev => [newResult, ...prev].slice(0, 8));
    } catch (err: any) {
      const errorMessage = err.message || "Failed to generate image.";
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerate = () => {
    const manualSettings = { ...settings, baseImage: undefined };
    setSettings(manualSettings);
    executeGeneration(manualSettings);
  };

  const handleGenerateVertical = () => {
    if (!currentResult) return;
    const mobileSettings: GenerationSettings = {
      ...currentResult.settings,
      aspectRatio: '9:16',
      resolution: '1080x1920',
      safeArea: 'center', 
      personPosition: 'center', 
      baseImage: currentResult.imageUrl 
    };
    setSettings(mobileSettings);
    executeGeneration(mobileSettings);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'personImages' | 'elementImages' | 'mockupImage') => {
    if (e.target.files && e.target.files.length > 0) {
      if (field === 'elementImages') {
        const files = Array.from(e.target.files).slice(0, 6);
        setSettings(prev => ({ ...prev, [field]: files }));
      } else if (field === 'mockupImage') {
        setSettings(prev => ({ ...prev, mockupImage: e.target.files ? e.target.files[0] : null }));
      } else {
        const newFiles = Array.from(e.target.files);
        setSettings(prev => {
          const currentCount = prev.personImages.length;
          const remainingSlots = MAX_PEOPLE - currentCount;
          const filesToAdd = newFiles.slice(0, remainingSlots);
          return { ...prev, personImages: [...prev.personImages, ...filesToAdd] };
        });
        e.target.value = '';
      }
    }
  };

  const removePersonImage = (index: number) => {
    setSettings(prev => ({
      ...prev,
      personImages: prev.personImages.filter((_, i) => i !== index)
    }));
  };

  const canGenerate = settings.mode === 'person' 
    ? settings.personImages.length > 0 
    : !!settings.mockupImage;

  return (
    <div className="min-h-screen bg-background text-zinc-200 selection:bg-primary selection:text-white">
      <header className="border-b border-white/5 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]">H</div>
             <div>
               <h1 className="text-lg font-bold tracking-tight text-white">Hero BG Studio</h1>
               <p className="text-[10px] uppercase tracking-widest text-gray-500 font-medium">NanoBanana3 Powered</p>
             </div>
          </div>
          <a href="https://ai.google.dev/gemini-api/docs" target="_blank" className="text-xs text-zinc-500 hover:text-zinc-300">Docs</a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Column: Controls */}
        <div className="lg:col-span-4 flex flex-col gap-8 h-[calc(100vh-100px)] overflow-y-auto pr-2 pb-20 custom-scrollbar">
          
          {/* Mode Selector */}
          <div className="bg-surfaceHighlight p-1 rounded-lg flex gap-1 border border-zinc-700">
            <button 
              onClick={() => setSettings(s => ({...s, mode: 'person'}))}
              className={`flex-1 py-2 rounded-md text-xs font-semibold uppercase tracking-wide transition-all ${settings.mode === 'person' ? 'bg-zinc-700 text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-zinc-800'}`}
            >
              Person / Team
            </button>
            <button 
              onClick={() => setSettings(s => ({...s, mode: 'mockup'}))}
              className={`flex-1 py-2 rounded-md text-xs font-semibold uppercase tracking-wide transition-all ${settings.mode === 'mockup' ? 'bg-zinc-700 text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-zinc-800'}`}
            >
              3D Mockup
            </button>
          </div>

          {/* Dynamic Section: Person Upload OR Mockup Upload */}
          <section className="animate-[fadeIn_0.3s_ease-out]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-zinc-800 text-xs flex items-center justify-center text-gray-400">1</span>
                {settings.mode === 'person' ? 'Subject(s)' : 'Screen / Print'}
              </h3>
              {settings.mode === 'person' && <span className="text-[10px] text-zinc-500 uppercase">{settings.personImages.length}/{MAX_PEOPLE} People</span>}
            </div>

            {settings.mode === 'person' ? (
              // --- PERSON UPLOAD UI ---
              settings.personImages.length === 0 ? (
                <div className="relative group cursor-pointer border-2 border-dashed border-zinc-700 hover:border-zinc-500 rounded-xl transition-all h-32 flex items-center justify-center bg-zinc-900/50 overflow-hidden">
                   <input type="file" accept="image/*" multiple onChange={(e) => handleFileChange(e, 'personImages')} className="absolute inset-0 opacity-0 cursor-pointer z-10"/>
                   <div className="text-center p-4">
                      <p className="text-zinc-400 text-sm group-hover:text-white">Upload Subject</p>
                      <p className="text-zinc-600 text-xs mt-1">PNG/JPG</p>
                   </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                   {settings.personImages.map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-zinc-700 bg-zinc-900 group">
                         <img src={URL.createObjectURL(img)} className="w-full h-full object-cover"/>
                         <button onClick={() => removePersonImage(idx)} className="absolute top-1 right-1 w-5 h-5 bg-black/70 hover:bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-all">×</button>
                      </div>
                   ))}
                   {settings.personImages.length < MAX_PEOPLE && (
                      <div className="relative aspect-square rounded-lg border-2 border-dashed border-zinc-700 hover:border-zinc-500 bg-zinc-900/30 flex flex-col items-center justify-center cursor-pointer group">
                         <input type="file" accept="image/*" multiple onChange={(e) => handleFileChange(e, 'personImages')} className="absolute inset-0 opacity-0 cursor-pointer z-10"/>
                         <span className="text-2xl text-zinc-500 group-hover:text-white">+</span>
                      </div>
                   )}
                </div>
              )
            ) : (
              // --- MOCKUP UPLOAD UI ---
              <div className="relative group cursor-pointer border-2 border-dashed border-zinc-700 hover:border-zinc-500 rounded-xl transition-all h-32 flex items-center justify-center bg-zinc-900/50 overflow-hidden">
                 <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'mockupImage')} className="absolute inset-0 opacity-0 cursor-pointer z-10"/>
                 {settings.mockupImage ? (
                   <div className="w-full h-full relative">
                      <img src={URL.createObjectURL(settings.mockupImage)} className="w-full h-full object-contain opacity-50 group-hover:opacity-30 transition-opacity" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="bg-black/50 px-2 py-1 rounded text-xs text-white backdrop-blur-sm">Change Image</span>
                      </div>
                   </div>
                 ) : (
                   <div className="text-center p-4">
                      <p className="text-zinc-400 text-sm group-hover:text-white">Upload Screenshot / UI</p>
                      <p className="text-zinc-600 text-xs mt-1">We'll render a 3D device around it</p>
                   </div>
                 )}
              </div>
            )}
          </section>

          {/* Section B: Identity */}
          <section>
             <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-zinc-800 text-xs flex items-center justify-center text-gray-400">2</span>
              Visual Identity
            </h3>
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-none">
              {PRESETS.map(preset => (
                <button key={preset.name} onClick={() => setSettings(s => ({ ...s, visualIdentity: preset.visualIdentity }))} className="whitespace-nowrap px-3 py-1.5 rounded-full border border-zinc-700 bg-zinc-900/50 text-xs text-zinc-300 hover:bg-zinc-800 hover:border-zinc-500 transition-all">
                  <span className="font-medium text-white">{preset.name}</span>
                </button>
              ))}
            </div>
            <TextArea label="Style Description" value={settings.visualIdentity} onChange={(e) => setSettings({...settings, visualIdentity: e.target.value})} className="h-32"/>
            <div className="grid grid-cols-2 gap-4">
              <Slider label="Style Strength" min={0} max={100} value={settings.styleStrength} valueDisplay={`${settings.styleStrength}%`} onChange={(e) => setSettings({...settings, styleStrength: Number(e.target.value)})}/>
              <Slider label="Depth of Field" min={0} max={100} value={settings.depthOfField} valueDisplay={`${settings.depthOfField}%`} onChange={(e) => setSettings({...settings, depthOfField: Number(e.target.value)})}/>
            </div>
             <Select label="Lighting Style" value={settings.lighting} onChange={(e) => setSettings({...settings, lighting: e.target.value as any})}>
              <option value="Soft studio">Soft Studio</option>
              <option value="Neon glow">Neon Glow</option>
              <option value="Rim light">Rim Light</option>
              <option value="Cinematic">Cinematic</option>
            </Select>
             <div className="flex items-center justify-between bg-surfaceHighlight rounded-lg p-3 border border-zinc-700">
               <span className="text-sm text-gray-300">Add Film Grain</span>
               <button onClick={() => setSettings(s => ({ ...s, grain: !s.grain }))} className={`w-10 h-5 rounded-full relative transition-colors ${settings.grain ? 'bg-primary' : 'bg-zinc-600'}`}>
                 <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${settings.grain ? 'translate-x-5' : 'translate-x-0'}`} />
               </button>
             </div>
          </section>

          {/* Section C: Composition */}
          <section>
            <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-zinc-800 text-xs flex items-center justify-center text-gray-400">3</span>
              Composition
            </h3>
            <div className="grid grid-cols-2 gap-4">
               <Select label="Format" value={settings.aspectRatio} onChange={(e) => { const newRatio = e.target.value as any; const defaultRes = getResolutions(newRatio)[0]; setSettings({...settings, aspectRatio: newRatio, resolution: defaultRes }); }}>
                  <option value="16:9">Horizontal (16:9)</option>
                  <option value="9:16">Vertical (9:16)</option>
                  <option value="1:1">Square (1:1)</option>
                </Select>
                <Select label="Quality" value={settings.quality} onChange={(e) => setSettings({...settings, quality: e.target.value as any})}>
                  <option value="1K">Standard (1K)</option>
                  <option value="2K">High (2K)</option>
                  <option value="4K">Ultra (4K)</option>
                </Select>
            </div>
            {/* Separate Resolution Dropdown for Prompt Context */}
            <div className="grid grid-cols-1 gap-4 mt-4">
               <Select label="Target Resolution (Prompt Context)" value={settings.resolution} onChange={(e) => setSettings({...settings, resolution: e.target.value})}>
                  {getResolutions(settings.aspectRatio).map(res => (<option key={res} value={res}>{res}</option>))}
               </Select>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-2">
               <Select label={settings.mode === 'mockup' ? "Mockup Position" : "People Position"} value={settings.personPosition} onChange={(e) => { const pos = e.target.value as any; let safe = settings.safeArea; if(pos === 'left') safe = 'right'; if(pos === 'right') safe = 'left'; setSettings({...settings, personPosition: pos, safeArea: safe }); }}>
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </Select>
                <Select label="Safe Area (Text)" value={settings.safeArea} onChange={(e) => setSettings({...settings, safeArea: e.target.value as any})}>
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </Select>
            </div>
          </section>

          {/* Section D: Extra Elements */}
          <section>
             <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-zinc-800 text-xs flex items-center justify-center text-gray-400">4</span>
              Elements (Optional)
            </h3>
            <Input label="Describe Elements" placeholder="e.g. 3D arrows, floating UI cards" value={settings.elementsText} onChange={(e) => setSettings({...settings, elementsText: e.target.value})} />
            <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-700">
               <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wide font-semibold">Reference Images (Max 6)</label>
               <input type="file" multiple max={6} accept="image/*" onChange={(e) => handleFileChange(e, 'elementImages')} className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-zinc-300 hover:file:bg-zinc-700" />
               <p className="text-[10px] text-zinc-600 mt-2">Used as style/prop reference for elements.</p>
            </div>
          </section>

          <section>
             <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-zinc-800 text-xs flex items-center justify-center text-gray-400">5</span>
              Negative (Optional)
            </h3>
            <Input label="Avoid / Negative" placeholder="e.g. red colors, cartoon style" value={settings.negativePrompt} onChange={(e) => setSettings({...settings, negativePrompt: e.target.value})} />
          </section>

        </div>

        {/* Right Column: Preview */}
        <div className="lg:col-span-8 flex flex-col h-[calc(100vh-40px)] sticky top-24">
           <div className="flex-grow flex flex-col">
              <PreviewArea isGenerating={isGenerating} currentResult={currentResult} previewSettings={settings} onGenerateMobile={handleGenerateVertical} />
           </div>
           <div className="mt-8 flex items-center justify-between gap-4">
              <div className="flex-1">
                 {error && (
                   <div className="text-red-400 text-sm bg-red-900/20 border border-red-900/50 p-2 rounded px-4 flex items-center justify-between">
                     <span>{error}</span>
                   </div>
                 )}
              </div>
              <Button onClick={handleGenerate} isLoading={isGenerating} disabled={!canGenerate} className="w-full md:w-auto md:min-w-[200px] h-12 text-base shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                {canGenerate ? "Generate Hero BG" : (settings.mode === 'person' ? "Upload Subject First" : "Upload Screen First")}
              </Button>
           </div>
           
           {history.length > 0 && (
             <div className="mt-8">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Recent Generations</h4>
                <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-thin">
                   {history.map(item => (
                     <div key={item.id} onClick={() => setCurrentResult(item)} className={`relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${currentResult?.id === item.id ? 'border-primary ring-2 ring-primary/20' : 'border-zinc-800 hover:border-zinc-600'}`}>
                       <img src={item.imageUrl} className="w-full h-full object-cover" />
                     </div>
                   ))}
                </div>
             </div>
           )}
        </div>
      </main>
    </div>
  );
};

export default App;