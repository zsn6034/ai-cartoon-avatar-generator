import type { ChatMessage, InputMode, LLMConfig } from "./face";

export type { ChatMessage, InputMode, LLMConfig };

export const outfitHairValues = ["hair1", "hair2", "hair3", "hair4", "hair5", "hair6", "hair7"] as const;
export const outfitTopValues = ["top1", "top2", "top3", "top4", "top5", "top6", "top7", "top8", "top9"] as const;
export const outfitBottomValues = ["bottom1", "bottom2", "bottom3", "bottom4", "bottom5", "bottom6", "bottom7"] as const;
export const outfitShoesValues = ["shoes1", "shoes2", "shoes3", "shoes4", "shoes5", "shoes6", "shoes7"] as const;
export const outfitActionValues = ["idle", "run", "sprint", "air", "afk1", "afk2", "afk3"] as const;

export type OutfitHairAsset = (typeof outfitHairValues)[number];
export type OutfitTopAsset = (typeof outfitTopValues)[number];
export type OutfitBottomAsset = (typeof outfitBottomValues)[number];
export type OutfitShoesAsset = (typeof outfitShoesValues)[number];
export type OutfitAction = (typeof outfitActionValues)[number];

export type OutfitFeatures = {
  hair: OutfitHairAsset;
  top: OutfitTopAsset;
  bottom: OutfitBottomAsset;
  shoes: OutfitShoesAsset;
};

export type PartialOutfitFeatures = Partial<OutfitFeatures>;
export type OutfitFeatureKey = keyof OutfitFeatures;
export type OutfitSelection = OutfitFeatures;

export type OutfitChatMemory = {
  summary: string;
  known_features: PartialOutfitFeatures;
  notes: string[];
};

export type OutfitFeatureReason = {
  feature: OutfitFeatureKey | string;
  value: string;
  reason: string;
};

export type OutfitAnalysisResponse = {
  status: "ready";
  assistant_message: string;
  features: OutfitFeatures;
  confidence: Partial<Record<OutfitFeatureKey, number>>;
  reasons: OutfitFeatureReason[];
  missing_fields: string[];
  defaults_applied: string[];
  provider: string;
};

export type OutfitChatRememberResponse = {
  assistant_message: string;
  chat_memory: OutfitChatMemory;
  confidence: Partial<Record<OutfitFeatureKey, number>>;
  reasons: OutfitFeatureReason[];
  provider: string;
};

export type OutfitGenerationRecord = {
  id: string;
  createdAt: string;
  sourceMode: InputMode;
  provider: string;
  uploadedImageDataUrl?: string;
  messages?: ChatMessage[];
  chatMemory?: OutfitChatMemory;
  features: OutfitFeatures;
  generatedSelection: OutfitSelection;
  currentSelection: OutfitSelection;
  action: OutfitAction;
  analysis: OutfitAnalysisResponse;
};
