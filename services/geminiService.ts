import { GenerationSettings } from "../types";

// Helper function to generate a procedural mock image locally
// This ensures an image is ALWAYS returned in offline mode, bypassing network issues.
const generateMockImage = (settings: GenerationSettings): string => {
  const canvas = document.createElement('canvas');
  // Determine size based on ratio (scaled down for performance)
  let width = 1280;
  let height = 720;
  
  if (settings.aspectRatio === '9:16') {
    width = 720;
    height = 1280;
  } else if (settings.aspectRatio === '1:1') {
    width = 1080;
    height = 1080;
  } else if (settings.aspectRatio === '4:5') {
    width = 1080;
    height = 1350;
  }

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return '';

  // 1. Background Gradient
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  const identity = settings.visualIdentity.toLowerCase();
  
  if (identity.includes('neon') || identity.includes('lime')) {
    gradient.addColorStop(0, '#0f172a'); // Slate 900
    gradient.addColorStop(1, '#1e1b4b'); // Indigo 950
  } else if (identity.includes('cobalt') || identity.includes('blue')) {
    gradient.addColorStop(0, '#020617'); // Slate 950
    gradient.addColorStop(1, '#172554'); // Blue 950
  } else if (identity.includes('amber') || identity.includes('luxury')) {
    gradient.addColorStop(0, '#1c1917'); // Stone 900
    gradient.addColorStop(1, '#451a03'); // Amber 950
  } else {
    gradient.addColorStop(0, '#18181b'); // Zinc 900
    gradient.addColorStop(1, '#000000'); // Black
  }
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // 2. Abstract Elements (Mocking AI generation)
  ctx.globalCompositeOperation = 'screen';
  
  // Random Glows
  for (let i = 0; i < 3; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const r = (Math.random() * width) / 3;
    
    ctx.beginPath();
    const radial = ctx.createRadialGradient(x, y, 0, x, y, r);
    
    if (identity.includes('neon')) {
      radial.addColorStop(0, 'rgba(163, 230, 53, 0.4)'); // Lime
      radial.addColorStop(1, 'rgba(163, 230, 53, 0)');
    } else if (identity.includes('cobalt')) {
      radial.addColorStop(0, 'rgba(96, 165, 250, 0.4)'); // Blue
      radial.addColorStop(1, 'rgba(96, 165, 250, 0)');
    } else if (identity.includes('amber')) {
      radial.addColorStop(0, 'rgba(251, 191, 36, 0.3)'); // Amber
      radial.addColorStop(1, 'rgba(251, 191, 36, 0)');
    } else {
      radial.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
      radial.addColorStop(1, 'rgba(255, 255, 255, 0)');
    }
    
    ctx.fillStyle = radial;
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Grid / Tech Lines Overlay
  ctx.globalCompositeOperation = 'overlay';
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 2;
  
  const gridSize = width / 10;
  for (let x = 0; x <= width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // 4. Mock Subject Placeholder
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  const subjectX = settings.personPosition === 'left' ? width * 0.2 : settings.personPosition === 'right' ? width * 0.8 : width * 0.5;
  const subjectY = height * 0.6;
  
  ctx.beginPath();
  ctx.arc(subjectX, subjectY, height * 0.25, 0, Math.PI * 2);
  ctx.fill();

  // 5. Watermark / Label
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = `700 ${Math.floor(width/30)}px Inter, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('OFFLINE PREVIEW MODE', width / 2, height / 2);
  
  ctx.font = `400 ${Math.floor(width/60)}px Inter, sans-serif`;
  ctx.fillText('(AI Generation Simulated)', width / 2, height / 2 + (width/25));

  return canvas.toDataURL('image/jpeg', 0.9);
};


export const generateHeroBg = async (
  settings: GenerationSettings
): Promise<{ imageUrl: string; finalPrompt: string }> => {
  
  // --- OFFLINE MOCK MODE ---
  // No API Key required

  // Determine instruction based on whether we are transforming an existing image
  const isTransformation = !!settings.baseImage;
  const isMockupMode = settings.mode === 'mockup';

  // --- PERSON MODE LOGIC ---
  const hasMultiplePeople = settings.personImages.length > 1;
  const isLargeGroup = settings.personImages.length > 2;
  const subjectsTerm = hasMultiplePeople ? "as pessoas" : "a pessoa";
  const subjectsTermUpper = hasMultiplePeople ? "AS PESSOAS" : "A PESSOA";
  const subjectsTermEn = hasMultiplePeople ? "subjects" : "subject";

  let specificInstruction = "";

  if (isMockupMode) {
    // --- MOCKUP MODE PROMPT ---
    const deviceType = settings.aspectRatio === '9:16' ? 'SMARTPHONE 3D (iPhone style) High-End' : 'LAPTOP 3D, TABLET ou GLASS INTERFACE flutuante';
    
    specificInstruction = isTransformation 
      ? `[INSTRUÇÃO: ADAPTAÇÃO MOBILE MOCKUP]
      A imagem base é o estilo. O input é um screenshot.
      TAREFA: Gere um MOCKUP 3D VERTICAL (Smartphone premium) exibindo a tela fornecida.
      POSIÇÃO: O device deve estar ANCORADO NA BASE (Bottom Anchor) ou flutuando no terço inferior.
      SAFE AREA: 80% do topo livre.`
      : `[INSTRUÇÃO: GERAÇÃO DE MOCKUP 3D]
      A imagem fornecida é um SCREENSHOT/PRINT DE UI.
      TAREFA: Crie um background Hero Section integrando um MOCKUP 3D REALISTA (${deviceType}) que exibe esta tela.
      ESTILO DO MOCKUP: Clay render, Matte Black, Vidro Fosco ou Alumínio escovado. Deve parecer um produto premium flutuando na cena.
      POSIÇÃO: O device deve ser o foco, posicionado conforme solicitado (Esq/Dir/Centro), integrado na iluminação.`;
  } else {
    // --- PERSON MODE PROMPT ---
    specificInstruction = isTransformation
      ? `[INSTRUÇÃO: ADAPTAÇÃO PARA MOBILE (VERTICAL 9:16) - EXTREME SAFE AREA]
      A imagem fornecida é a referência de estilo/sujeito (Desktop).
      SUA TAREFA: Recriar em formato VERTICAL (9:16) com layout "Mobile-First".
      REGRAS CRÍTICAS DE LAYOUT (PRIORIDADE MÁXIMA):
      1. SAFE AREA GIGANTE (80% TOPO): Os 80% superiores da imagem DEVEM ser espaço negativo limpo.
      2. POSIÇÃO DOS SUJEITOS (BOTTOM ANCHOR): ${subjectsTermUpper} deve(m) estar ANCORADA(S) NA BASE DA TELA.
      3. PÉS/CORPO: Estenda o corpo se necessário.`
      : `[INSTRUÇÃO: HERO COM PESSOA]
      Crie uma imagem de background para Hero Section. Integre ${subjectsTerm} das imagens de referência como ${subjectsTermEn} principal(is), com recorte limpo e composição realista.`;
  }

  // Construct the prompt
  const finalPrompt = `
${specificInstruction}

[COMPOSIÇÃO]
- Aspect ratio e resolução: ${settings.aspectRatio} (${settings.resolution})
- Qualidade de Render: ${settings.quality} (Ultra Detail)
- Posição ${isMockupMode ? 'do Mockup 3D' : (hasMultiplePeople ? 'dos sujeitos' : 'da pessoa')}: ${isTransformation ? 'BAIXO (BOTTOM/ANCHORED)' : (settings.personPosition === 'left' ? 'Esquerda' : settings.personPosition === 'right' ? 'Direita' : 'Centro')}
- Safe area para texto: ${isTransformation ? 'TOPO (80% da altura livre)' : (settings.safeArea === 'left' ? 'Esquerda' : settings.safeArea === 'right' ? 'Direita' : 'Centro')}
- Use regra dos terços e hierarquia de luz.
- Estilo do fundo: gradientes escuros + glows controlados, vidro/acrílico.

[IDENTIDADE VISUAL]
${settings.visualIdentity}

[CONTROLES]
- Intensidade: ${settings.styleStrength}%
- Iluminação: ${settings.lighting}
`.trim();

  // --- MOCK EXECUTION ---
  console.log("OFFLINE MODE: Simulating Generation...");
  console.log("PROMPT GENERATED:", finalPrompt);

  // Simulate Network Latency (1.5 seconds)
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Generate a local base64 image
  const mockImageUrl = generateMockImage(settings);

  return { 
    imageUrl: mockImageUrl, 
    finalPrompt: finalPrompt 
  };
};