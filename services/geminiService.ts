import { GoogleGenAI } from "@google/genai";
import { GenerationSettings } from "../types";

// Helper to convert File to Base64
const fileToPart = async (file: File) => {
  return new Promise<{ inlineData: { data: string; mimeType: string } }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64String = result.split(',')[1];
      const mimeType = result.split(':')[1].split(';')[0]; // Extract actual mime type
      resolve({
        inlineData: {
          data: base64String,
          mimeType: mimeType || file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const generateHeroBg = async (
  settings: GenerationSettings
): Promise<{ imageUrl: string; finalPrompt: string }> => {
  
  // Use API Key from environment variable
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
- ${!isMockupMode && isLargeGroup ? 'COMPOSIÇÃO DE GRUPO: Organize as pessoas de forma coesa e natural.' : ''}
- ${isMockupMode ? 'PERSPECTIVA 3D: O device deve estar levemente rotacionado (isométrico ou 3/4) para dar profundidade, nunca totalmente chapado (flat). Reflexos realistas na tela.' : ''}
- Adicionar elementos: ${settings.elementsText || 'Nenhum'} e/ou referências visuais das imagens extras.
- Estilo do fundo: gradientes escuros + glows controlados, vidro/acrílico, partículas sutis, shapes 3D flutuantes, UI fragments desfocados.

[IDENTIDADE VISUAL]
${settings.visualIdentity}

[CONTROLES]
- Intensidade do estilo: ${settings.styleStrength}%
- Profundidade/DOF: ${settings.depthOfField}%
- Iluminação: ${settings.lighting}
- Grain: ${settings.grain ? 'On' : 'Off'}

[REGRAS DE QUALIDADE]
- Fotorealismo, render 8k, Octane Render style.
- Sem texto legível (exceto o que estiver dentro da tela do mockup/camiseta).
- Sem marcas d'água.
- Contraste suficiente para tipografia por cima (AAA quando possível).

[NEGATIVE]
${settings.negativePrompt}
+ “no text, no logo, no watermark, no distorted face, no low-res, no busy background at top”
`.trim();

  // Prepare parts
  const parts: any[] = [];

  // 1. Base Image (if performing transformation)
  if (settings.baseImage) {
    try {
        const base64Data = settings.baseImage.split(',')[1];
        const mimeType = settings.baseImage.split(';')[0].split(':')[1];
        parts.push({
            inlineData: { data: base64Data, mimeType: mimeType }
        });
    } catch (e) {
        console.warn("Failed to parse baseImage", e);
    }
  }
  
  // 2. Text Prompt
  parts.push({ text: finalPrompt });

  // 3. Subject Images (Either Person OR Mockup)
  if (isMockupMode && settings.mockupImage) {
      // Send the screenshot/print to be mocked up
      const mockupPart = await fileToPart(settings.mockupImage);
      parts.push(mockupPart);
  } else if (!isMockupMode && settings.personImages.length > 0) {
      // Send person images
      for (const img of settings.personImages) {
          const personPart = await fileToPart(img);
          parts.push(personPart);
      }
  }

  // 4. Element Images
  if (settings.elementImages && settings.elementImages.length > 0) {
    for (const file of settings.elementImages) {
      const elementPart = await fileToPart(file);
      parts.push(elementPart);
    }
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: parts },
      config: {
        imageConfig: {
          aspectRatio: settings.aspectRatio,
          imageSize: settings.quality,
        }
      }
    });

    let imageUrl = '';
    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (!imageUrl) throw new Error("No image generated.");

    return { imageUrl, finalPrompt };

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};