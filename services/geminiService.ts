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
  
  // Use API Key from environment variable with fallbacks
  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!API_KEY) {
    throw new Error("An API Key must");
  }
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  // Determine instruction based on whether we are transforming an existing image
  const isTransformation = !!settings.baseImage;

  // --- PERSON MODE LOGIC ---
  const hasMultiplePeople = settings.personImages.length > 1;
  const isLargeGroup = settings.personImages.length > 2;
  const subjectsTerm = hasMultiplePeople ? "as pessoas" : "a pessoa";
  const subjectsTermUpper = hasMultiplePeople ? "AS PESSOAS" : "A PESSOA";

  let specificInstruction = "";

  specificInstruction = isTransformation
    ? `[INSTRUÇÃO: ADAPTAÇÃO PARA MOBILE (VERTICAL 9:16) - EXTREME SAFE AREA]
    A imagem fornecida é a referência de estilo/sujeito (Desktop).
    SUA TAREFA: Recriar em formato VERTICAL (9:16) com layout "Mobile-First".
    REGRAS CRÍTICAS DE LAYOUT (PRIORIDADE MÁXIMA):
    1. SAFE AREA GIGANTE (80% TOPO): Os 80% superiores da imagem DEVEM ser espaço negativo limpo.
    2. POSIÇÃO DOS SUJEITOS (BOTTOM ANCHOR): ${subjectsTermUpper} deve(m) estar ANCORADA(S) NA BASE DA TELA.
    3. PÉS/CORPO: Estenda o corpo se necessário.`
    : `[INSTRUÇÃO: PUBLICIDADE HIGH-END - INTEGRAÇÃO PERFEITA]
    ATUE COMO UM RETOCADOR PROFISSIONAL. Sua tarefa é criar um Hero Background que integre ${subjectsTerm} (INPUT) na cena com PERFEIÇÃO FOTOREALISTA.
    O RESULTADO DEVE PARECER UMA FOTO ÚNICA DE ESTÚDIO, NÃO UMA MONTAGEM.

    MANDATÓRIO PARA INTEGRAÇÃO:
    1. ENQUADRAMENTO (CRÍTICO): CORTE NA CINTURA ("Waist-Up" / "Medium Shot"). As pessoas DEVEM nascer da borda inferior da imagem. NUNCA mostre os pés ou pernas inteiras.
    2. ANCORAGEM: A base da imagem deve cortar o torso/cintura dos sujeitos. Eles não podem flutuar no meio do nada.
    3. ESCALA REALISTA: Os sujeitos devem ocupar uma porção significativa da altura (aprox. 50-70% da altura da imagem), impondo presença.
    4. ILUMINAÇÃO: Use Rim Light para separar o sujeito do fundo escuro.
    5. COLOR MATCH: Unifique a temperatura de cor do sujeito com o ambiente (Color Grading).`;

  // Construct the prompt
  const finalPrompt = `
${specificInstruction}

[COMPOSIÇÃO]
- Aspect ratio e resolução: ${settings.aspectRatio} (${settings.resolution})
- Qualidade de Render: ${settings.quality} (Ultra Detail)
- Posição ${hasMultiplePeople ? 'dos sujeitos' : 'da pessoa'}: ${isTransformation ? 'BAIXO (BOTTOM/ANCHORED)' : (settings.personPosition === 'left' ? 'Esquerda' : settings.personPosition === 'right' ? 'Direita' : 'Centro')}
- Safe area para texto: ${isTransformation ? 'TOPO (80% da altura livre)' : (settings.safeArea === 'left' ? 'Esquerda' : settings.safeArea === 'right' ? 'Direita' : 'Centro')}
- Use regra dos terços e hierarquia de luz.
- ${isLargeGroup ? 'COMPOSIÇÃO DE GRUPO: Organize as pessoas de forma coesa e natural.' : ''}
- Adicionar elementos: ${settings.elementsText || 'Nenhum'} e/ou referências visuais das imagens extras.
- Estilo do fundo: gradientes escuros + glows controlados, vidro/acrílico, partículas sutis, shapes 3D flutuantes, UI fragments desfocados.

[IDENTIDADE VISUAL]
${settings.visualIdentity}

[CONTROLES]
- Intensidade do estilo: ${settings.styleStrength}%
- Profundidade/DOF: ${settings.depthOfField}%
- Iluminação: ${settings.lighting}
- Grain: ${settings.grain ? 'On' : 'Off'}

[ILUMINAÇÃO & AMBIENTAÇÃO - CRÍTICO]
- Setup de Luz: Cinematic Studio Lighting, Softbox Principal + Rim Light Colorida para separar do fundo.
- Atmosfera: Volumetric Fog suave, profundidade de campo (DOF) nas bordas, partículas de poeira/luz.
- INTEGRAÇÃO VISUAL: Color Match obrigatório entre INPUTS e FUNDO. Use Global Illumination.
- HARMONIA DE CENA: Todos os elementos devem compartilhar a mesma FONTE DE LUZ e DIREÇÃO DE SOMBRA.

[REGRAS DE QUALIDADE]
- Estilo: Fotografia Publicitária Premiada (Cannes Lions), 8k, Octane Render, Ray Tracing.
- Sem texto legível (exceto o que estiver dentro da tela do mockup/camiseta).
- Sem marcas d'água.
- Contraste absoluto para tipografia branca sobre o fundo.
- ZERO "STICKER EFFECT" (parecer colado). Use Light Wrap.
- ZERO "GIANT/TINY SYNDROME": Pessoas e objetos devem ter escala realista entre si.

[NEGATIVE]
${settings.negativePrompt}
+ "feet, legs, full body, tiny people, floating people, distorted face, shoes, floor, ground, walking people, no text, no logo, no watermark, no distorted face, no low-res, no busy background at top"
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

  // 3. Subject Images
  if (settings.personImages.length > 0) {
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
      model: 'gemini-3.1-flash-image-preview',
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
