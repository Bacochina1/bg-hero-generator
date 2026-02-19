export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:5';
export type PersonPosition = 'left' | 'right' | 'center';
export type SafeArea = 'left' | 'right' | 'center';
export type LightingStyle = 'Soft studio' | 'Neon glow' | 'Rim light' | 'Cinematic';
export type GenerationMode = 'person' | 'mockup';
export type ImageQuality = '1K' | '2K' | '4K';

export interface GenerationSettings {
  mode: GenerationMode; 
  personImages: File[]; 
  mockupImage: File | null; 
  elementImages: File[];
  elementsText: string;
  visualIdentity: string;
  personPosition: PersonPosition;
  safeArea: SafeArea;
  aspectRatio: AspectRatio;
  resolution: string; 
  quality: ImageQuality; // New field
  generateVertical: boolean;
  styleStrength: number; 
  depthOfField: number; 
  lighting: LightingStyle;
  grain: boolean;
  negativePrompt: string;
  baseImage?: string; 
}

export interface GenerationResult {
  id: string;
  imageUrl: string;
  prompt: string;
  settings: GenerationSettings;
  timestamp: number;
}

export interface Preset {
  name: string;
  description: string;
  visualIdentity: string;
}

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
}