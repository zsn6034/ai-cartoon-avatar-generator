import type { AvatarFeatureKey, AvatarFeatures, ChatMemory } from "../types/face";
import {
  detailValues,
  earringsValues,
  eyeValues,
  eyebrowValues,
  glassesValues,
  hairColorValues,
  hairValues,
  mouthValues,
  skinColorValues
} from "../types/face";

export type FeatureOption<K extends AvatarFeatureKey = AvatarFeatureKey> = {
  value: AvatarFeatures[K];
  label: string;
  swatch?: string;
};

function numberLabel(prefix: string, value: string) {
  return `${prefix} ${value.replace("variant", "").replace("long", "长发 ").replace("short", "短发 ")}`;
}

const hairLabels = Object.fromEntries(
  hairValues.map((value) => [value, value.startsWith("long") ? numberLabel("", value).trim() : numberLabel("", value).trim()])
) as Record<AvatarFeatures["hair"], string>;

const noneLabel = "无";

export const featureLabels: Record<AvatarFeatureKey, string> = {
  hair: "头发",
  eyes: "眼睛",
  eyebrows: "眉毛",
  mouth: "嘴巴",
  hairColor: "发色",
  skinColor: "肤色",
  details: "脸部细节",
  glasses: "眼镜",
  earrings: "耳饰"
};

export const featureOptions: { [K in AvatarFeatureKey]: Array<FeatureOption<K>> } = {
  hair: hairValues.map((value) => ({ value, label: hairLabels[value] })),
  eyes: eyeValues.map((value) => ({ value, label: numberLabel("眼睛", value) })),
  eyebrows: eyebrowValues.map((value) => ({ value, label: numberLabel("眉毛", value) })),
  mouth: mouthValues.map((value) => ({ value, label: numberLabel("嘴巴", value) })),
  hairColor: hairColorValues.map((value) => ({ value, label: value, swatch: value })),
  skinColor: skinColorValues.map((value) => ({ value, label: value, swatch: value })),
  details: detailValues.map((value) => ({
    value,
    label:
      value === "none"
        ? noneLabel
        : {
            birthmark: "胎记",
            blush: "腮红",
            freckles: "雀斑",
            mustache: "胡子"
          }[value]
  })),
  glasses: glassesValues.map((value) => ({ value, label: value === "none" ? noneLabel : numberLabel("眼镜", value) })),
  earrings: earringsValues.map((value) => ({ value, label: value === "none" ? noneLabel : numberLabel("耳饰", value) }))
};

export const featureKeys = Object.keys(featureLabels) as AvatarFeatureKey[];

export const defaultFeatures: AvatarFeatures = {
  hair: "short01",
  eyes: "variant01",
  eyebrows: "variant04",
  mouth: "variant09",
  hairColor: "#0e0e0e",
  skinColor: "#f2d3b1",
  details: "none",
  glasses: "none",
  earrings: "none"
};

export const defaultChatMemory: ChatMemory = {
  summary: "",
  known_features: {},
  notes: []
};

export function labelForFeature<K extends AvatarFeatureKey>(key: K, value: string) {
  return featureOptions[key].find((option) => option.value === value)?.label ?? value;
}
