// Queue management utilities for mockup generation

export type JobType = "generation" | "variation" | "upscale" | "batch";

export function calculateCredits(
  jobType: JobType,
  quality: string,
  variations: number = 1
): number {
  const baseCredits = {
    generation: 10,
    variation: 5,
    upscale: 3,
    batch: 8
  };

  const qualityMultiplier = {
    draft: 0.5,
    standard: 1.0,
    premium: 1.5,
    ultra: 2.0
  };

  const baseCost = baseCredits[jobType] || 10;
  const qualityCost = qualityMultiplier[quality as keyof typeof qualityMultiplier] || 1.0;
  
  return Math.ceil(baseCost * qualityCost * variations);
}

export function validateJobRequirements(
  userId: string,
  creditsRequired: number,
  userCredits: number,
  activeJobs: number,
  maxConcurrentJobs: number
): { valid: boolean; reason?: string } {
  if (userCredits < creditsRequired) {
    return {
      valid: false,
      reason: "Insufficient credits"
    };
  }

  if (activeJobs >= maxConcurrentJobs) {
    return {
      valid: false,
      reason: "Maximum concurrent jobs reached"
    };
  }

  return { valid: true };
}

export function calculateJobPriority(
  jobType: JobType,
  userTier: string,
  queueLength: number
): number {
  const basePriority = {
    generation: 100,
    variation: 80,
    upscale: 60,
    batch: 90
  };

  const tierMultiplier = {
    starter: 1.0,
    growth: 1.2,
    pro: 1.5
  };

  const queueMultiplier = Math.max(0.5, 1.0 - (queueLength * 0.01));

  const base = basePriority[jobType] || 100;
  const tier = tierMultiplier[userTier as keyof typeof tierMultiplier] || 1.0;
  
  return Math.ceil(base * tier * queueMultiplier);
}
