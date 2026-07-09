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
  bottom: "下装",
  shoes: "鞋子"
};

const hairDescriptions: Record<OutfitFeatures["hair"], string> = {
  hair1: "深黑色短发，厚刘海，两侧下垂发束",
  hair2: "棕色短发，整体圆润包头",
  hair3: "金棕色短发，偏侧分轮廓",
  hair4: "黑蓝色短发，顶部更蓬松",
  hair5: "暗紫色短发，层次感更明显",
  hair6: "深绿色短发，上翘感更强",
  hair7: "橙红色短发，造型更醒目"
};

const topDescriptions: Record<OutfitFeatures["top"], string> = {
  top1: "米白色长袖上衣，针织纹理感，带斜挎带装饰",
  top2: "绿色上衣",
  top3: "砖红色上衣",
  top4: "蓝色上衣",
  top5: "黑色上衣",
  top6: "黄棕色上衣",
  top7: "灰紫色上衣",
  top8: "亮黄色上衣",
  top9: "酒红色上衣"
};

const bottomDescriptions: Record<OutfitFeatures["bottom"], string> = {
  bottom1: "蓝绿色中长裙装轮廓",
  bottom2: "卡其棕色下装",
  bottom3: "深蓝色下装",
  bottom4: "深灰绿色下装",
  bottom5: "棕灰色下装",
  bottom6: "深绿色下装",
  bottom7: "暗紫色下装"
};

const shoesDescriptions: Record<OutfitFeatures["shoes"], string> = {
  shoes1: "黑色鞋，鞋口较高，短靴感",
  shoes2: "米白色浅色鞋",
  shoes3: "棕色鞋",
  shoes4: "深灰色鞋",
  shoes5: "红棕色鞋",
  shoes6: "深蓝色鞋",
  shoes7: "暖红色鞋"
};

function toOption<K extends OutfitFeatureKey>(
  key: K,
  value: OutfitFeatures[K],
  descriptions: Partial<Record<OutfitFeatures[K], string>>
): OutfitOption<K> {
  return {
    value,
    label: String(value),
    description: descriptions[value] ?? ""
  };
}

export const outfitOptions: { [K in OutfitFeatureKey]: Array<OutfitOption<K>> } = {
  hair: outfitHairValues.map((value) => toOption("hair", value, hairDescriptions)),
  top: outfitTopValues.map((value) => toOption("top", value, topDescriptions)),
  bottom: outfitBottomValues.map((value) => toOption("bottom", value, bottomDescriptions)),
  shoes: outfitShoesValues.map((value) => toOption("shoes", value, shoesDescriptions))
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
