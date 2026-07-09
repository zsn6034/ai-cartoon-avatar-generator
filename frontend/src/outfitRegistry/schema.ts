import type { OutfitAction, OutfitFeatureKey, OutfitFeatures, OutfitSelection, OutfitChatMemory } from "../types/outfit";
import { outfitActionValues, outfitBottomValues, outfitHairValues, outfitShoesValues, outfitTopValues } from "../types/outfit";

export type OutfitOption<K extends OutfitFeatureKey = OutfitFeatureKey> = {
  value: OutfitFeatures[K];
  label: string;
  description: string;
};

export const outfitFeatureLabels: Record<OutfitFeatureKey, string> = {
  hair: "发型",
  top: "上衣",
  bottom: "裤子",
  shoes: "鞋子"
};

const hairDescriptions: Record<OutfitFeatures["hair"], string> = {
  hair1: "清爽短发",
  hair2: "圆润短发",
  hair3: "利落侧分",
  hair4: "蓬松短发",
  hair5: "活泼层次",
  hair6: "个性翘发",
  hair7: "潮流轮廓"
};

const topDescriptions: Record<OutfitFeatures["top"], string> = {
  top1: "基础短袖",
  top2: "休闲上衣",
  top3: "轻便 T 恤",
  top4: "运动外套",
  top5: "夹克感上衣",
  top6: "户外层次",
  top7: "利落套装",
  top8: "醒目上装",
  top9: "正式轮廓"
};

const bottomDescriptions: Record<OutfitFeatures["bottom"], string> = {
  bottom1: "休闲短裤",
  bottom2: "轻便下装",
  bottom3: "基础长裤",
  bottom4: "直筒长裤",
  bottom5: "通勤裤装",
  bottom6: "宽松运动",
  bottom7: "户外轮廓"
};

const shoesDescriptions: Record<OutfitFeatures["shoes"], string> = {
  shoes1: "基础休闲鞋",
  shoes2: "轻便运动鞋",
  shoes3: "圆头鞋",
  shoes4: "厚底鞋",
  shoes5: "短靴感",
  shoes6: "运动厚底",
  shoes7: "醒目鞋款"
};

function toOption<K extends OutfitFeatureKey>(
  key: K,
  value: OutfitFeatures[K],
  index: number,
  descriptions: Partial<Record<OutfitFeatures[K], string>>
): OutfitOption<K> {
  return {
    value,
    label: `${outfitFeatureLabels[key]} ${index + 1}`,
    description: descriptions[value] ?? ""
  };
}

export const outfitOptions: { [K in OutfitFeatureKey]: Array<OutfitOption<K>> } = {
  hair: outfitHairValues.map((value, index) => toOption("hair", value, index, hairDescriptions)),
  top: outfitTopValues.map((value, index) => toOption("top", value, index, topDescriptions)),
  bottom: outfitBottomValues.map((value, index) => toOption("bottom", value, index, bottomDescriptions)),
  shoes: outfitShoesValues.map((value, index) => toOption("shoes", value, index, shoesDescriptions))
};

export const outfitFeatureKeys = Object.keys(outfitFeatureLabels) as OutfitFeatureKey[];

export const defaultOutfitFeatures: OutfitSelection = {
  hair: "hair1",
  top: "top1",
  bottom: "bottom1",
  shoes: "shoes1"
};

export const defaultOutfitChatMemory: OutfitChatMemory = {
  summary: "",
  known_features: {},
  notes: []
};

export const actionLabels: Record<OutfitAction, string> = {
  idle: "待机",
  run: "跑步",
  sprint: "冲刺",
  air: "腾空",
  afk1: "休息 1",
  afk2: "休息 2",
  afk3: "休息 3"
};

export const actionOptions = outfitActionValues.map((value) => ({
  value,
  label: actionLabels[value]
}));

export function labelForOutfitFeature<K extends OutfitFeatureKey>(key: K, value: string) {
  const option = outfitOptions[key].find((item) => item.value === value);
  return option ? `${option.label} · ${option.description}` : value;
}
