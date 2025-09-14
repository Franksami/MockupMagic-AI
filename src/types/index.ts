// import { Doc, Id } from "../../convex/_generated/dataModel";

// Temporary placeholder types until Convex generates the actual types
export type Doc<_T extends string> = Record<string, unknown>;
export type Id<_T extends string> = string;

// User types
export type User = Doc<"users">;
export type UserId = Id<"users">;

// Mockup types
export type Mockup = Doc<"mockups">;
export type MockupId = Id<"mockups">;

// Template types
export type Template = Doc<"templates">;
export type TemplateId = Id<"templates">;

// Project types
export type Project = Doc<"projects">;
export type ProjectId = Id<"projects">;

// Job types
export type GenerationJob = Doc<"generationJobs">;

// Whop integration types
export interface WhopUser {
  id: string;
  email: string;
  username?: string;
  profile_pic_url?: string;
}

export interface WhopProduct {
  id: string;
  title: string;
  type: string;
  visibility: string;
  created_at: string;
}

// AI Generation types
export interface GenerationSettings {
  quality: "draft" | "standard" | "premium";
  resolution: {
    width: number;
    height: number;
  };
  background?: string;
  lighting?: string;
  style?: string;
  colorCorrection?: boolean;
  removeBackground?: boolean;
}

export interface MockupRequest {
  sourceImageId?: Id<"_storage">;
  prompt: string;
  mockupType: string;
  templateId?: TemplateId;
  settings: GenerationSettings;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Upload types
export interface FileUpload {
  file: File;
  progress: number;
  status: "pending" | "uploading" | "completed" | "error";
  storageId?: Id<"_storage">;
}

// Analytics types
export interface AnalyticsEvent {
  event: string;
  category: string;
  action?: string;
  label?: string;
  value?: number;
  mockupId?: MockupId;
  templateId?: TemplateId;
  projectId?: ProjectId;
}