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

const noneLabel = "无";

const hairDescriptions: Record<AvatarFeatures["hair"], string> = {
  long01: "齐肩直发，侧分斜刘海，利落波波头",
  long02: "双侧低马尾，齐碎刘海，头顶小翘发",
  long03: "双侧低马尾，齐碎刘海，花环头饰",
  long04: "中长层次直发，长斜刘海，凌乱发束",
  long05: "齐肩圆润直发，侧分斜刘海，发尾内扣",
  long06: "超蓬松长卷发，两侧大发量卷曲",
  long07: "齐刘海齐肩直发，发尾平齐",
  long08: "齐刘海齐肩直发，花环头饰",
  long09: "侧分披肩发，斜刘海，发尾外扩",
  long10: "高丸子头，碎刘海，两侧短发束",
  long11: "高丸子头，厚齐刘海，后颈短发束",
  long12: "半扎小丸子，中长侧发，碎刘海",
  long13: "双丸子头，额前碎发，两侧短发束",
  long14: "双低马尾，厚刘海，两侧短辫",
  long15: "高双马尾，齐刘海，发尾上翘",
  long16: "单侧长辫，厚刘海，麻花辫",
  long17: "单侧披发或侧马尾，露额",
  long18: "单侧披发或侧马尾，带花朵发饰",
  long19: "高马尾，侧分短刘海，后方发束",
  long20: "中长直发，大片斜刘海遮住一只眼",
  long21: "圆润短波波头，齐刘海，耳侧小发束",
  long22: "蓬松大波浪中长发，左右外扩",
  long23: "双丸子头，露额，两个圆发髻",
  long24: "侧分波浪短中发，一侧蓬松外翘",
  long25: "侧分大斜刘海短中发，一侧刘海下垂",
  long26: "厚重中长直发，碎刘海遮眼，两侧包脸",
  short01: "厚短发，侧分斜刘海，发尾贴头",
  short02: "蓬松短发，齐碎刘海，头顶翘发",
  short03: "圆蓬短卷发，小卷密集",
  short04: "极短侧分发，贴头短发",
  short05: "短发带小顶髻，前额短刘海",
  short06: "长斜刘海遮一只眼，侧边收短",
  short07: "蓬松侧分短发，露额，发尾微翘",
  short08: "短卷发，顶部卷翘，侧边收短",
  short09: "厚碎刘海短发，顶部蓬松",
  short10: "顺滑侧分短发，大片斜刘海",
  short11: "利落短发，侧分发际，顶部微翘",
  short12: "光头或极短发，头顶小发髻",
  short13: "贴头超短发，前额几缕横向发丝",
  short14: "短碎发，前额小翘发，侧边短",
  short15: "夸张尖刺短发，发束向上炸开",
  short16: "大尖刺短发，多束上扬",
  short17: "小卷刺短发，顶部密集短卷",
  short18: "竖立短刺发，发束整体向上",
  short19: "光头或剃光头，头顶无发"
};

const eyeDescriptions: Record<AvatarFeatures["eyes"], string> = {
  variant01: "大圆眼，眼珠朝右，自然睁眼",
  variant02: "大圆眼，双眼向左看",
  variant03: "大圆眼，双眼向右看",
  variant04: "半闭眼，眼皮低垂，困倦冷淡",
  variant05: "半月眼，眼珠向上或侧上看",
  variant06: "细长小眼，横向眯眼",
  variant07: "细长小眼，眼珠偏侧",
  variant08: "螺旋圈圈眼，晕眩惊呆",
  variant09: "大小眼，一只圆眼一只眯眼",
  variant10: "大小眼，一只圆眼一只小眯眼",
  variant11: "眼珠向上看，露出下方眼白",
  variant12: "双眼上翻，呆萌发愣",
  variant13: "一只眯眼一只上翻眼",
  variant14: "细眯眼，双眼向侧边看",
  variant15: "下垂眼，眼皮低，疲惫无辜",
  variant16: "半闭下垂眼，困倦没精神",
  variant17: "半闭方形眼，厌倦无语",
  variant18: "半闭侧目眼，淡漠不耐烦",
  variant19: "闭眼弯弧，开心笑眼",
  variant20: "闭眼弧线，平静安静",
  variant21: "单眼眨眼，wink",
  variant22: "一眼闭一眼睁，俏皮眨眼",
  variant23: "星星高光大眼，星星眼，兴奋闪亮",
  variant24: "圆眼内斜，斗鸡眼对眼",
  variant25: "圆眼侧看，眼珠朝同一侧",
  variant26: "圆眼侧看，眼珠朝另一侧"
};

const eyebrowDescriptions: Record<AvatarFeatures["eyebrows"], string> = {
  variant01: "粗黑下压眉，严肃生气",
  variant02: "粗黑上挑斜眉，愤怒锐利",
  variant03: "短小皱眉，眉心有竖线",
  variant04: "默认浓眉，较粗平直",
  variant05: "短粗椭圆眉，卡通粗眉",
  variant06: "细弯眉，眉尾上扬",
  variant07: "一高一低八字眉，担心委屈",
  variant08: "短粗自然眉，普通短眉",
  variant09: "弯月眉，圆弧上扬",
  variant10: "单侧细弧眉，另一侧被遮挡",
  variant11: "细短弯眉，温柔清淡",
  variant12: "粗弯眉，眉峰明显",
  variant13: "短直粗眉，平直认真",
  variant14: "多条短线眉，刮痕皱褶感",
  variant15: "短粗椭圆眉，左右分离"
};

const mouthDescriptions: Record<AvatarFeatures["mouth"], string> = {
  variant01: "张嘴微笑，露红色口腔",
  variant02: "小弧线微笑，闭嘴浅笑",
  variant03: "小圆张嘴，惊讶发愣",
  variant04: "歪斜下撇嘴，不满委屈",
  variant05: "红唇露齿大笑",
  variant06: "小红唇微笑",
  variant07: "小张嘴露牙，惊讶紧张",
  variant08: "红色小歪嘴，不悦撇嘴",
  variant09: "短平线嘴，中性默认",
  variant10: "嘟嘴侧撇，亲吻傲娇",
  variant11: "横向小牙齿，咬牙紧张",
  variant12: "吐舌头小表情",
  variant13: "张嘴吐舌并流口水",
  variant14: "张嘴露牙下弯，害怕担心",
  variant15: "大圆张嘴，惊叫震惊",
  variant16: "伸舌头，调皮",
  variant17: "亲吻嘟嘴",
  variant18: "小黑圆嘴，惊讶哦",
  variant19: "卷曲小胡子嘴，滑稽猫嘴",
  variant20: "小爱心嘴，亲吻可爱",
  variant21: "小爱心嘴，甜美可爱",
  variant22: "露齿弯笑，咧嘴笑",
  variant23: "大露齿笑，灿烂爽朗",
  variant24: "张嘴吐舌，搞怪顽皮",
  variant25: "大露齿笑，红唇边",
  variant26: "夸张张嘴大笑，露牙和舌头",
  variant27: "大张嘴笑，露舌欢呼",
  variant28: "三角张嘴笑，露牙和舌头",
  variant29: "V 形小嘴，猫嘴尖嘴",
  variant30: "小三角张嘴，说话开心"
};

const hairColorDescriptions: Record<AvatarFeatures["hairColor"], string> = {
  "#0e0e0e": "黑发 / 深黑",
  "#e5d7a3": "浅金发 / 米金色",
  "#b9a05f": "暗金发 / 蜂蜜金",
  "#796a45": "灰棕发 / 暗棕",
  "#85c2c6": "蓝绿色 / 青色",
  "#6a4e35": "自然棕 / 深棕",
  "#562306": "深褐色 / 黑棕",
  "#afafaf": "灰发 / 银灰",
  "#3eac2c": "绿色发",
  "#dba3be": "粉色发 / 玫瑰粉",
  "#592454": "紫色发 / 深紫",
  "#ac6511": "铜棕发 / 焦糖色",
  "#cb6820": "橙棕发 / 姜黄色",
  "#ab2a18": "红发 / 酒红"
};

const skinColorDescriptions: Record<AvatarFeatures["skinColor"], string> = {
  "#f2d3b1": "白皙 / 浅肤色",
  "#ecad80": "小麦色 / 健康肤色",
  "#9e5622": "棕色皮肤 / 古铜色",
  "#763900": "深色皮肤 / 黑皮"
};

const detailDescriptions: Record<AvatarFeatures["details"], string> = {
  none: noneLabel,
  birthmark: "右脸单颗黑痣 / 胎记",
  blush: "双颊大块粉色腮红",
  freckles: "两侧脸颊多颗雀斑",
  mustache: "鼻下黑色卷翘小胡子"
};

const glassesDescriptions: Record<AvatarFeatures["glasses"], string> = {
  none: noneLabel,
  variant01: "黑色墨镜 / 深色太阳镜",
  variant02: "大圆框眼镜 / 透明镜片",
  variant03: "小圆框眼镜 / 细框",
  variant04: "中等圆框眼镜 / 细黑框",
  variant05: "厚框圆眼镜 / 深色框"
};

const earringsDescriptions: Record<AvatarFeatures["earrings"], string> = {
  none: noneLabel,
  variant01: "小圆环耳环",
  variant02: "白色圆形耳环 / 耳钉",
  variant03: "多颗小耳钉 / 耳骨钉",
  variant04: "一上一下两个耳饰",
  variant05: "耳朵上方交叉小耳饰",
  variant06: "单颗黑色小耳钉"
};

function describedLabel(value: string, description: string) {
  return `${value} · ${description}`;
}

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
  hair: hairValues.map((value) => ({ value, label: describedLabel(value, hairDescriptions[value]) })),
  eyes: eyeValues.map((value) => ({ value, label: `${numberLabel("眼睛", value)} · ${eyeDescriptions[value]}` })),
  eyebrows: eyebrowValues.map((value) => ({ value, label: `${numberLabel("眉毛", value)} · ${eyebrowDescriptions[value]}` })),
  mouth: mouthValues.map((value) => ({ value, label: `${numberLabel("嘴巴", value)} · ${mouthDescriptions[value]}` })),
  hairColor: hairColorValues.map((value) => ({ value, label: describedLabel(value, hairColorDescriptions[value]), swatch: value })),
  skinColor: skinColorValues.map((value) => ({ value, label: describedLabel(value, skinColorDescriptions[value]), swatch: value })),
  details: detailValues.map((value) => ({ value, label: detailDescriptions[value] })),
  glasses: glassesValues.map((value) => ({ value, label: value === "none" ? noneLabel : `${numberLabel("眼镜", value)} · ${glassesDescriptions[value]}` })),
  earrings: earringsValues.map((value) => ({ value, label: value === "none" ? noneLabel : `${numberLabel("耳饰", value)} · ${earringsDescriptions[value]}` }))
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
