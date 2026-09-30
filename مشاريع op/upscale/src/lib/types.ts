// Upscale v2 — types shared across the app
export type QualityPreset = "fast" | "balanced" | "high" | "custom";
export type OutputFormat = "png" | "jpeg" | "webp";

export interface EnhanceSettings {
  scaleFactor: number; // 2..6
  preset: QualityPreset;
  sharpness: number; // 0..1 (custom slider)
  usePostProcess: boolean;
}

export const PRESETS: Record<Exclude<QualityPreset, "custom">, { sharpness: number; usePostProcess: boolean }> = {
  fast: { sharpness: 0.4, usePostProcess: false },
  balanced: { sharpness: 0.6, usePostProcess: true },
  high: { sharpness: 0.8, usePostProcess: true },
};

export function resolveSharpness(s: EnhanceSettings): { sharpness: number; usePostProcess: boolean } {
  if (s.preset !== "custom") return PRESETS[s.preset];
  return { sharpness: s.sharpness, usePostProcess: s.usePostProcess };
}
