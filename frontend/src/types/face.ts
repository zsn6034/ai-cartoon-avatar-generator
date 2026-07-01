export type ProviderId = "qwen" | "doubao";
export type InputMode = "image" | "chat";

export type FaceFeatures = {
  face_shape: "oval" | "round" | "square" | "heart";
  eye_size: "small" | "medium" | "large";
  eye_lid: "monolid" | "double" | "hooded";
  brow_thickness: "thin" | "medium" | "thick";
  nose_bridge: "low" | "medium" | "high";
  lip_fullness: "thin" | "medium" | "full";
  skin_tone: "fair" | "light" | "medium" | "tan" | "deep";
  hair_length: "short" | "medium" | "long";
  hair_shape: "straight" | "wavy";
  bangs: "yes" | "no";
  expression: "neutral" | "smile" | "cool" | "soft";
  presentation_style: "masculine" | "feminine" | "androgynous";
};

export type PartialFaceFeatures = Partial<FaceFeatures>;
export type FeatureKey = keyof FaceFeatures;

export type FeatureReason = {
  feature: FeatureKey | string;
  value: string;
  reason: string;
};

export type AnalysisResponse = {
  status: "need_more_info" | "ready";
  assistant_message: string;
  features: PartialFaceFeatures;
  confidence: Partial<Record<FeatureKey, number>>;
  reasons: FeatureReason[];
  missing_fields: string[];
  defaults_applied: string[];
  provider: ProviderId;
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AvatarSelection = FaceFeatures;

export type AvatarDraft = {
  inputMode: InputMode;
  chatMessages: ChatMessage[];
  imageDataUrl?: string;
  features: PartialFaceFeatures;
  aiRecommendedSelection: AvatarSelection;
  currentSelection: AvatarSelection;
  analysis?: AnalysisResponse;
  provider: ProviderId;
  updatedAt: string;
};
