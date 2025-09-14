import Replicate from "replicate";

// Initialize Replicate client
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// SDXL Model configurations optimized for mockup generation
export const SDXL_MODELS = {
  standard: "stability-ai/sdxl:8beff3369e81422112d93b89ca01426147de542cd4684c244b673b105188fe5f",
  lightning: "lucataco/sdxl-lightning:a45f82a1382bed5c7aeb861dac7c7d191b0fdf74d8d57c4a0e6ed7d4d0bf7d24",
  professional: "stability-ai/stable-diffusion:27b93a2413e7f36cd83da926f3656280b2931564ff050bf9575f1fdf9bcd7478"
} as const;

export type SDXLModel = keyof typeof SDXL_MODELS;

// Generation quality settings
export const GENERATION_SETTINGS = {
  draft: {
    width: 512,
    height: 512,
    num_inference_steps: 20,
    guidance_scale: 7,
    model: "lightning" as SDXLModel
  },
  standard: {
    width: 1024,
    height: 1024,
    num_inference_steps: 30,
    guidance_scale: 7.5,
    model: "standard" as SDXLModel
  },
  premium: {
    width: 1536,
    height: 1536,
    num_inference_steps: 50,
    guidance_scale: 8,
    model: "professional" as SDXLModel
  }
} as const;

export type GenerationQuality = keyof typeof GENERATION_SETTINGS;

// Interface for generation input
export interface GenerationInput {
  prompt: string;
  negative_prompt?: string;
  image?: string | File; // Base64 or File object
  quality: GenerationQuality;
  seed?: number;
  webhook?: string;
  webhook_events_filter?: string[];
}

// Interface for generation result
export interface GenerationResult {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output?: string[];
  error?: string;
  logs?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  urls?: {
    get: string;
    cancel: string;
    stream?: string;
  };
}

// Generate mockup using SDXL
export async function generateMockup(input: GenerationInput): Promise<GenerationResult> {
  try {
    const settings = GENERATION_SETTINGS[input.quality];
    const modelId = SDXL_MODELS[settings.model];

    // Prepare the input for Replicate
    const replicateInput: Record<string, any> = {
      prompt: input.prompt,
      width: settings.width,
      height: settings.height,
      num_inference_steps: settings.num_inference_steps,
      guidance_scale: settings.guidance_scale,
      scheduler: "K_EULER_ANCESTRAL",
      refine: "expert_ensemble_refiner",
      high_noise_frac: 0.8,
      apply_watermark: false,
    };

    // Add negative prompt if provided
    if (input.negative_prompt) {
      replicateInput.negative_prompt = input.negative_prompt;
    }

    // Add image input for img2img if provided
    if (input.image) {
      replicateInput.image = input.image;
      replicateInput.prompt_strength = 0.8; // How much to transform the input image
    }

    // Add seed for reproducibility
    if (input.seed) {
      replicateInput.seed = input.seed;
    }

    // Create prediction
    const prediction = await replicate.predictions.create({
      version: modelId,
      input: replicateInput,
      webhook: input.webhook,
      webhook_events_filter: input.webhook_events_filter || ["start", "output", "logs", "completed"],
    });

    return {
      id: prediction.id,
      status: prediction.status as GenerationResult["status"],
      output: prediction.output as string[],
      error: prediction.error,
      logs: prediction.logs,
      created_at: prediction.created_at,
      started_at: prediction.started_at,
      completed_at: prediction.completed_at,
      urls: prediction.urls,
    };
  } catch (error) {
    console.error("Error generating mockup:", error);
    throw new Error(`Failed to generate mockup: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Get generation status
export async function getGenerationStatus(predictionId: string): Promise<GenerationResult> {
  try {
    const prediction = await replicate.predictions.get(predictionId);
    
    return {
      id: prediction.id,
      status: prediction.status as GenerationResult["status"],
      output: prediction.output as string[],
      error: prediction.error,
      logs: prediction.logs,
      created_at: prediction.created_at,
      started_at: prediction.started_at,
      completed_at: prediction.completed_at,
      urls: prediction.urls,
    };
  } catch (error) {
    console.error("Error getting generation status:", error);
    throw new Error(`Failed to get generation status: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Cancel generation
export async function cancelGeneration(predictionId: string): Promise<void> {
  try {
    await replicate.predictions.cancel(predictionId);
  } catch (error) {
    console.error("Error canceling generation:", error);
    throw new Error(`Failed to cancel generation: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Stream generation progress
export async function* streamGeneration(input: GenerationInput) {
  try {
    const settings = GENERATION_SETTINGS[input.quality];
    const modelId = SDXL_MODELS[settings.model];

    const replicateInput: Record<string, any> = {
      prompt: input.prompt,
      width: settings.width,
      height: settings.height,
      num_inference_steps: settings.num_inference_steps,
      guidance_scale: settings.guidance_scale,
      scheduler: "K_EULER_ANCESTRAL",
      refine: "expert_ensemble_refiner",
      high_noise_frac: 0.8,
      apply_watermark: false,
    };

    if (input.negative_prompt) {
      replicateInput.negative_prompt = input.negative_prompt;
    }

    if (input.image) {
      replicateInput.image = input.image;
      replicateInput.prompt_strength = 0.8;
    }

    if (input.seed) {
      replicateInput.seed = input.seed;
    }

    for await (const event of replicate.stream(modelId, { input: replicateInput })) {
      yield {
        event: event.event,
        data: event.data,
      };
    }
  } catch (error) {
    console.error("Error streaming generation:", error);
    throw new Error(`Failed to stream generation: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// List available models
export async function listAvailableModels() {
  try {
    const models = await replicate.models.list();
    return models.results.filter(model => 
      model.name.includes('sdxl') || 
      model.name.includes('stable-diffusion') ||
      model.description?.toLowerCase().includes('stable diffusion')
    );
  } catch (error) {
    console.error("Error listing models:", error);
    throw new Error(`Failed to list models: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Helper to validate API token
export async function validateReplicateToken(): Promise<boolean> {
  try {
    await replicate.models.list();
    return true;
  } catch (error) {
    console.error("Invalid Replicate token:", error);
    return false;
  }
}

export { replicate };