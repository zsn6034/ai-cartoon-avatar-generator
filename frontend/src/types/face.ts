export type ProviderId = "qwen" | "doubao";
export type InputMode = "image" | "chat";

export const hairValues = [
  "long01",
  "long02",
  "long03",
  "long04",
  "long05",
  "long06",
  "long07",
  "long08",
  "long09",
  "long10",
  "long11",
  "long12",
  "long13",
  "long14",
  "long15",
  "long16",
  "long17",
  "long18",
  "long19",
  "long20",
  "long21",
  "long22",
  "long23",
  "long24",
  "long25",
  "long26",
  "short01",
  "short02",
  "short03",
  "short04",
  "short05",
  "short06",
  "short07",
  "short08",
  "short09",
  "short10",
  "short11",
  "short12",
  "short13",
  "short14",
  "short15",
  "short16",
  "short17",
  "short18",
  "short19"
] as const;

export const eyeValues = [
  "variant01",
  "variant02",
  "variant03",
  "variant04",
  "variant05",
  "variant06",
  "variant07",
  "variant08",
  "variant09",
  "variant10",
  "variant11",
  "variant12",
  "variant13",
  "variant14",
  "variant15",
  "variant16",
  "variant17",
  "variant18",
  "variant19",
  "variant20",
  "variant21",
  "variant22",
  "variant23",
  "variant24",
  "variant25",
  "variant26"
] as const;

export const eyebrowValues = [
  "variant01",
  "variant02",
  "variant03",
  "variant04",
  "variant05",
  "variant06",
  "variant07",
  "variant08",
  "variant09",
  "variant10",
  "variant11",
  "variant12",
  "variant13",
  "variant14",
  "variant15"
] as const;

export const mouthValues = [
  "variant01",
  "variant02",
  "variant03",
  "variant04",
  "variant05",
  "variant06",
  "variant07",
  "variant08",
  "variant09",
  "variant10",
  "variant11",
  "variant12",
  "variant13",
  "variant14",
  "variant15",
  "variant16",
  "variant17",
  "variant18",
  "variant19",
  "variant20",
  "variant21",
  "variant22",
  "variant23",
  "variant24",
  "variant25",
  "variant26",
  "variant27",
  "variant28",
  "variant29",
  "variant30"
] as const;

export const detailValues = ["none", "birthmark", "blush", "freckles", "mustache"] as const;
export const glassesValues = ["none", "variant01", "variant02", "variant03", "variant04", "variant05"] as const;
export const earringsValues = ["none", "variant01", "variant02", "variant03", "variant04", "variant05", "variant06"] as const;

export const hairColorValues = [
  "#0e0e0e",
  "#e5d7a3",
  "#b9a05f",
  "#796a45",
  "#85c2c6",
  "#6a4e35",
  "#562306",
  "#afafaf",
  "#3eac2c",
  "#dba3be",
  "#592454",
  "#ac6511",
  "#cb6820",
  "#ab2a18"
] as const;

export const skinColorValues = ["#f2d3b1", "#ecad80", "#9e5622", "#763900"] as const;

export type HairVariant = (typeof hairValues)[number];
export type EyeVariant = (typeof eyeValues)[number];
export type EyebrowVariant = (typeof eyebrowValues)[number];
export type MouthVariant = (typeof mouthValues)[number];
export type DetailVariant = (typeof detailValues)[number];
export type GlassesVariant = (typeof glassesValues)[number];
export type EarringsVariant = (typeof earringsValues)[number];
export type HairColor = (typeof hairColorValues)[number];
export type SkinColor = (typeof skinColorValues)[number];

export type AvatarFeatures = {
  hair: HairVariant;
  eyes: EyeVariant;
  eyebrows: EyebrowVariant;
  mouth: MouthVariant;
  hairColor: HairColor;
  skinColor: SkinColor;
  details: DetailVariant;
  glasses: GlassesVariant;
  earrings: EarringsVariant;
};

export type PartialAvatarFeatures = Partial<AvatarFeatures>;
export type AvatarFeatureKey = keyof AvatarFeatures;
export type AvatarSelection = AvatarFeatures;

export type ChatMemory = {
  summary: string;
  known_features: PartialAvatarFeatures;
  notes: string[];
};

export type FeatureReason = {
  feature: AvatarFeatureKey | string;
  value: string;
  reason: string;
};

export type AnalysisResponse = {
  status: "ready";
  assistant_message: string;
  features: AvatarFeatures;
  confidence: Partial<Record<AvatarFeatureKey, number>>;
  reasons: FeatureReason[];
  missing_fields: string[];
  defaults_applied: string[];
  provider: ProviderId;
};

export type ChatRememberResponse = {
  assistant_message: string;
  chat_memory: ChatMemory;
  confidence: Partial<Record<AvatarFeatureKey, number>>;
  reasons: FeatureReason[];
  provider: ProviderId;
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type GenerationRecord = {
  id: string;
  createdAt: string;
  sourceMode: InputMode;
  provider: ProviderId;
  uploadedImageDataUrl?: string;
  messages?: ChatMessage[];
  chatMemory?: ChatMemory;
  features: AvatarFeatures;
  generatedSelection: AvatarSelection;
  currentSelection: AvatarSelection;
  analysis: AnalysisResponse;
};
