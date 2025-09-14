// Professional mockup prompt engineering system

// Base mockup styles with professional photography techniques
export const MOCKUP_STYLES = {
  studio: {
    name: "Studio Photography",
    description: "Clean, professional studio setup with controlled lighting",
    basePrompt: "professional studio photography, clean white background, soft box lighting, high resolution, commercial quality, product photography",
    negativePrompt: "blurry, low quality, amateur, cluttered background, harsh shadows, overexposed"
  },
  lifestyle: {
    name: "Lifestyle Setting",
    description: "Natural, everyday environment with realistic placement",
    basePrompt: "modern lifestyle setting, natural lighting, elegant placement, realistic environment, contemporary interior, cozy atmosphere",
    negativePrompt: "artificial, staged, unrealistic, cluttered, messy, poor lighting"
  },
  minimal: {
    name: "Minimalist",
    description: "Clean, simple composition with plenty of negative space",
    basePrompt: "minimalist aesthetic, simple composition, negative space, modern design, clean lines, elegant simplicity",
    negativePrompt: "cluttered, busy, complex, ornate, excessive decoration, chaotic"
  },
  dramatic: {
    name: "Dramatic Lighting",
    description: "Bold shadows and highlights for artistic impact",
    basePrompt: "dramatic lighting, shadows and highlights, artistic composition, premium feel, professional photography, cinematic quality",
    negativePrompt: "flat lighting, boring, amateur, low contrast, washed out, dull"
  },
  outdoor: {
    name: "Outdoor Scene",
    description: "Natural outdoor environment with good lighting",
    basePrompt: "outdoor setting, natural daylight, beautiful scenery, fresh air feel, organic environment, natural placement",
    negativePrompt: "indoor, artificial lighting, studio, cramped, enclosed space"
  },
  workspace: {
    name: "Modern Workspace",
    description: "Contemporary office or workspace setting",
    basePrompt: "modern workspace, desk setup, professional environment, clean organization, productivity focused, business setting",
    negativePrompt: "messy desk, unprofessional, cluttered office, poor organization, distracting elements"
  }
} as const;

export type MockupStyle = keyof typeof MOCKUP_STYLES;

// Product categories for context-aware prompting
export const PRODUCT_CATEGORIES = {
  digital: {
    name: "Digital Products",
    contexts: ["laptop screen", "tablet display", "phone mockup", "desktop monitor", "smart tv screen"],
    enhancers: ["high resolution display", "crisp screen quality", "modern device", "sleek design"]
  },
  physical: {
    name: "Physical Products",
    contexts: ["on a table", "in hands", "on shelf", "product placement", "against wall"],
    enhancers: ["tangible object", "real world placement", "physical presence", "dimensional"]
  },
  apparel: {
    name: "Clothing & Apparel",
    contexts: ["worn by model", "laid flat", "hanging display", "fashion shoot", "wardrobe setting"],
    enhancers: ["fashion photography", "textile details", "fabric texture", "clothing presentation"]
  },
  books: {
    name: "Books & Publications",
    contexts: ["book cover display", "stack of books", "open book", "reading setting", "library shelf"],
    enhancers: ["publishing quality", "book design", "print materials", "editorial layout"]
  },
  courses: {
    name: "Online Courses",
    contexts: ["learning environment", "educational setting", "course material", "study space", "online platform"],
    enhancers: ["educational content", "learning focused", "academic quality", "instructional design"]
  },
  branding: {
    name: "Brand Identity",
    contexts: ["brand presentation", "logo showcase", "corporate setting", "business materials", "brand identity"],
    enhancers: ["professional branding", "corporate quality", "brand consistency", "marketing materials"]
  }
} as const;

export type ProductCategory = keyof typeof PRODUCT_CATEGORIES;

// Lighting conditions for different moods
export const LIGHTING_CONDITIONS = {
  soft: "soft diffused lighting, even illumination, no harsh shadows",
  dramatic: "dramatic lighting, strong shadows, high contrast",
  natural: "natural daylight, window lighting, organic feel",
  golden: "golden hour lighting, warm tones, beautiful glow",
  studio: "professional studio lighting, controlled illumination, photography lights",
  ambient: "ambient lighting, atmospheric, mood lighting"
} as const;

export type LightingCondition = keyof typeof LIGHTING_CONDITIONS;

// Background options
export const BACKGROUNDS = {
  white: "clean white background, seamless, professional",
  gradient: "subtle gradient background, modern, elegant",
  textured: "subtle textured background, refined, sophisticated",
  scene: "contextual scene background, realistic environment",
  minimal: "minimal background, simple, unobtrusive",
  transparent: "transparent background, isolated subject"
} as const;

export type Background = keyof typeof BACKGROUNDS;

// Interface for prompt generation input
export interface PromptGenerationInput {
  productName?: string;
  productDescription?: string;
  category: ProductCategory;
  style: MockupStyle;
  lighting?: LightingCondition;
  background?: Background;
  customPrompt?: string;
  includeHands?: boolean;
  angle?: 'front' | 'side' | 'top' | 'angled' | '3quarter';
  mood?: 'professional' | 'casual' | 'luxury' | 'modern' | 'vintage';
}

// Enhanced prompt generation with intelligent composition
export function generateMockupPrompt(input: PromptGenerationInput): {
  prompt: string;
  negativePrompt: string;
  enhancedPrompt: string;
} {
  const style = MOCKUP_STYLES[input.style];
  const category = PRODUCT_CATEGORIES[input.category];
  
  // Start with base style prompt
  const promptParts = [style.basePrompt];
  
  // Add product context
  if (input.productName) {
    promptParts.push(`${input.productName} product`);
  }
  
  // Add category-specific context
  const randomContext = category.contexts[Math.floor(Math.random() * category.contexts.length)];
  promptParts.push(randomContext);
  
  // Add category enhancers
  const randomEnhancer = category.enhancers[Math.floor(Math.random() * category.enhancers.length)];
  promptParts.push(randomEnhancer);
  
  // Add lighting if specified
  if (input.lighting) {
    promptParts.push(LIGHTING_CONDITIONS[input.lighting]);
  }
  
  // Add background if specified
  if (input.background) {
    promptParts.push(BACKGROUNDS[input.background]);
  }
  
  // Add angle specification
  if (input.angle) {
    const angleMap = {
      front: "front view, direct angle",
      side: "side view, profile angle", 
      top: "top view, overhead perspective",
      angled: "angled view, dynamic perspective",
      '3quarter': "three quarter view, professional angle"
    };
    promptParts.push(angleMap[input.angle]);
  }
  
  // Add mood enhancement
  if (input.mood) {
    const moodMap = {
      professional: "professional atmosphere, business quality, corporate standard",
      casual: "casual setting, relaxed atmosphere, everyday feel",
      luxury: "luxury presentation, premium quality, high-end feel",
      modern: "modern aesthetic, contemporary style, current trends",
      vintage: "vintage feel, retro style, classic presentation"
    };
    promptParts.push(moodMap[input.mood]);
  }
  
  // Add hand inclusion if specified
  if (input.includeHands) {
    promptParts.push("hands holding product, human interaction, natural grip");
  }
  
  // Add quality enhancers
  promptParts.push("8K resolution, ultra detailed, sharp focus, professional quality");
  
  // Combine with custom prompt if provided
  if (input.customPrompt) {
    promptParts.push(input.customPrompt);
  }
  
  const basePrompt = promptParts.join(", ");
  
  // Enhanced prompt with additional quality terms
  const enhancementTerms = [
    "masterpiece",
    "best quality", 
    "ultra high res",
    "photorealistic",
    "professional photography",
    "commercial grade",
    "marketing quality"
  ];
  
  const enhancedPrompt = `${enhancementTerms.join(", ")}, ${basePrompt}`;
  
  // Negative prompt combining style and quality negatives
  const negativePrompt = `${style.negativePrompt}, watermark, text overlay, low resolution, pixelated, compressed, artifacts, noise, grain, amateur photography, poor composition, bad lighting, overexposed, underexposed, blurry, out of focus, distorted, deformed, ugly, bad anatomy, bad proportions, extra limbs, extra fingers, missing fingers, fused fingers, bad hands, bad feet, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, username, error, duplicate, mutated, mutation, mutilated, disgusting, duplicate, extra limbs`;
  
  return {
    prompt: basePrompt,
    negativePrompt,
    enhancedPrompt
  };
}

// Generate multiple prompt variations for A/B testing
export function generatePromptVariations(input: PromptGenerationInput, count: number = 3): Array<{
  prompt: string;
  negativePrompt: string;
  enhancedPrompt: string;
  variation: string;
}> {
  const variations = [];
  const category = PRODUCT_CATEGORIES[input.category];
  
  for (let i = 0; i < count; i++) {
    // Create variation by changing context and enhancers
    const variationInput = {
      ...input,
      // Use different context for each variation
      customPrompt: `${input.customPrompt || ''} ${category.contexts[i % category.contexts.length]} ${category.enhancers[i % category.enhancers.length]}`.trim()
    };
    
    const result = generateMockupPrompt(variationInput);
    variations.push({
      ...result,
      variation: `Variation ${i + 1}`
    });
  }
  
  return variations;
}

// Analyze and suggest improvements for custom prompts
export function analyzePrompt(prompt: string): {
  score: number;
  suggestions: string[];
  missing: string[];
  strengths: string[];
} {
  const qualityKeywords = [
    'professional', 'high resolution', '8k', 'ultra detailed', 'sharp focus',
    'photography', 'commercial', 'studio', 'lighting', 'composition'
  ];
  
  const negativeKeywords = [
    'blurry', 'low quality', 'amateur', 'pixelated', 'compressed', 'noise'
  ];
  
  const score = calculatePromptScore(prompt, qualityKeywords, negativeKeywords);
  const suggestions = generatePromptSuggestions(prompt);
  const missing = findMissingElements(prompt);
  const strengths = findPromptStrengths(prompt, qualityKeywords);
  
  return { score, suggestions, missing, strengths };
}

// Helper functions
function calculatePromptScore(prompt: string, positiveKeywords: string[], negativeKeywords: string[]): number {
  const lowerPrompt = prompt.toLowerCase();
  const positiveScore = positiveKeywords.reduce((score, keyword) => {
    return score + (lowerPrompt.includes(keyword.toLowerCase()) ? 10 : 0);
  }, 0);
  
  const negativeScore = negativeKeywords.reduce((score, keyword) => {
    return score - (lowerPrompt.includes(keyword.toLowerCase()) ? 15 : 0);
  }, 0);
  
  const baseScore = Math.max(0, Math.min(100, 50 + positiveScore + negativeScore));
  return Math.round(baseScore);
}

function generatePromptSuggestions(prompt: string): string[] {
  const suggestions = [];
  const lowerPrompt = prompt.toLowerCase();
  
  if (!lowerPrompt.includes('resolution') && !lowerPrompt.includes('quality')) {
    suggestions.push("Add quality descriptors like '8K resolution' or 'high quality'");
  }
  
  if (!lowerPrompt.includes('lighting')) {
    suggestions.push("Specify lighting conditions for better visual appeal");
  }
  
  if (!lowerPrompt.includes('background')) {
    suggestions.push("Define background style for better composition");
  }
  
  if (!lowerPrompt.includes('professional') && !lowerPrompt.includes('commercial')) {
    suggestions.push("Add professional photography terms");
  }
  
  return suggestions;
}

function findMissingElements(prompt: string): string[] {
  const essentialElements = [
    'quality descriptor',
    'lighting condition', 
    'background type',
    'photography style',
    'composition angle'
  ];
  
  const lowerPrompt = prompt.toLowerCase();
  return essentialElements.filter(element => {
    switch (element) {
      case 'quality descriptor':
        return !lowerPrompt.includes('quality') && !lowerPrompt.includes('resolution') && !lowerPrompt.includes('detailed');
      case 'lighting condition':
        return !lowerPrompt.includes('lighting') && !lowerPrompt.includes('light');
      case 'background type':
        return !lowerPrompt.includes('background');
      case 'photography style':
        return !lowerPrompt.includes('photography') && !lowerPrompt.includes('photo');
      case 'composition angle':
        return !lowerPrompt.includes('view') && !lowerPrompt.includes('angle');
      default:
        return false;
    }
  });
}

function findPromptStrengths(prompt: string, qualityKeywords: string[]): string[] {
  const lowerPrompt = prompt.toLowerCase();
  return qualityKeywords.filter(keyword => 
    lowerPrompt.includes(keyword.toLowerCase())
  ).map(keyword => `Includes '${keyword}'`);
}

// Template-based prompt presets for quick generation
export const PROMPT_PRESETS = {
  ecommerce: {
    name: "E-commerce Product",
    template: generateMockupPrompt({
      category: 'physical',
      style: 'studio',
      background: 'white',
      lighting: 'studio',
      mood: 'professional'
    })
  },
  lifestyle: {
    name: "Lifestyle Marketing", 
    template: generateMockupPrompt({
      category: 'physical',
      style: 'lifestyle',
      background: 'scene',
      lighting: 'natural',
      mood: 'casual'
    })
  },
  tech: {
    name: "Tech Product",
    template: generateMockupPrompt({
      category: 'digital',
      style: 'minimal',
      background: 'gradient',
      lighting: 'soft',
      mood: 'modern'
    })
  },
  luxury: {
    name: "Luxury Brand",
    template: generateMockupPrompt({
      category: 'physical',
      style: 'dramatic',
      background: 'textured',
      lighting: 'dramatic',
      mood: 'luxury'
    })
  }
} as const;

export type PromptPreset = keyof typeof PROMPT_PRESETS;