// Prompt engineering utilities for mockup generation

export type ProductCategory = 
  | "apparel" 
  | "electronics" 
  | "home" 
  | "beauty" 
  | "food" 
  | "books" 
  | "toys" 
  | "sports" 
  | "automotive" 
  | "jewelry";

export type MockupStyle = 
  | "minimalist" 
  | "modern" 
  | "vintage" 
  | "luxury" 
  | "casual" 
  | "professional" 
  | "artistic" 
  | "industrial";

export type LightingCondition = 
  | "natural" 
  | "studio" 
  | "warm" 
  | "cool" 
  | "dramatic" 
  | "soft";

export type Background = 
  | "white" 
  | "transparent" 
  | "gradient" 
  | "textured" 
  | "environmental" 
  | "minimal";

export function generateMockupPrompt(
  productName: string,
  productDescription: string,
  category: ProductCategory,
  style: MockupStyle,
  lighting?: LightingCondition,
  background?: Background,
  customPrompt?: string
): string {
  if (customPrompt) {
    return customPrompt;
  }

  const basePrompt = `Professional product mockup of ${productName}`;
  
  const categoryPrompts = {
    apparel: "clothing item, fashion photography style",
    electronics: "tech product, sleek and modern",
    home: "home decor item, lifestyle setting",
    beauty: "beauty product, clean and elegant",
    food: "food product, appetizing presentation",
    books: "book cover, literary aesthetic",
    toys: "toy product, playful and colorful",
    sports: "sports equipment, dynamic and energetic",
    automotive: "car accessory, automotive styling",
    jewelry: "jewelry piece, luxury and refined"
  };

  const stylePrompts = {
    minimalist: "minimalist design, clean lines, simple composition",
    modern: "modern aesthetic, contemporary styling",
    vintage: "vintage style, retro aesthetic, aged appearance",
    luxury: "luxury product, premium materials, high-end feel",
    casual: "casual style, relaxed and approachable",
    professional: "professional presentation, business-like",
    artistic: "artistic interpretation, creative composition",
    industrial: "industrial design, functional and robust"
  };

  const lightingPrompts = {
    natural: "natural lighting, soft shadows",
    studio: "studio lighting, professional setup",
    warm: "warm lighting, golden tones",
    cool: "cool lighting, blue-white tones",
    dramatic: "dramatic lighting, strong contrasts",
    soft: "soft lighting, gentle illumination"
  };

  const backgroundPrompts = {
    white: "white background, clean and simple",
    transparent: "transparent background, isolated product",
    gradient: "gradient background, smooth color transition",
    textured: "textured background, interesting surface",
    environmental: "environmental setting, contextual background",
    minimal: "minimal background, subtle and unobtrusive"
  };

  let prompt = basePrompt;
  prompt += `, ${categoryPrompts[category]}`;
  prompt += `, ${stylePrompts[style]}`;
  
  if (lighting) {
    prompt += `, ${lightingPrompts[lighting]}`;
  }
  
  if (background) {
    prompt += `, ${backgroundPrompts[background]}`;
  }

  prompt += `, high quality, professional photography, commercial use`;

  return prompt;
}
