import type { FaceFeatures, FeatureKey } from "../types/face";

export const featureLabels: Record<FeatureKey, string> = {
  face_shape: "脸型",
  eye_size: "眼睛大小",
  eye_lid: "眼皮",
  brow_thickness: "眉毛粗细",
  nose_bridge: "鼻梁",
  lip_fullness: "嘴唇",
  skin_tone: "肤色",
  hair_length: "头发长度",
  hair_shape: "头发形态",
  bangs: "刘海",
  expression: "表情",
  presentation_style: "整体风格"
};

export const featureOptions: { [K in FeatureKey]: Array<{ value: FaceFeatures[K]; label: string }> } = {
  face_shape: [
    { value: "oval", label: "瓜子脸" },
    { value: "round", label: "圆脸" },
    { value: "square", label: "方脸" },
    { value: "heart", label: "心形脸" }
  ],
  eye_size: [
    { value: "small", label: "小眼" },
    { value: "medium", label: "中等" },
    { value: "large", label: "大眼" }
  ],
  eye_lid: [
    { value: "monolid", label: "单眼皮" },
    { value: "double", label: "双眼皮" },
    { value: "hooded", label: "内双" }
  ],
  brow_thickness: [
    { value: "thin", label: "细眉" },
    { value: "medium", label: "自然眉" },
    { value: "thick", label: "粗眉" }
  ],
  nose_bridge: [
    { value: "low", label: "低鼻梁" },
    { value: "medium", label: "中鼻梁" },
    { value: "high", label: "高鼻梁" }
  ],
  lip_fullness: [
    { value: "thin", label: "薄唇" },
    { value: "medium", label: "中等" },
    { value: "full", label: "丰满" }
  ],
  skin_tone: [
    { value: "fair", label: "白皙" },
    { value: "light", label: "浅肤" },
    { value: "medium", label: "自然" },
    { value: "tan", label: "小麦" },
    { value: "deep", label: "深肤" }
  ],
  hair_length: [
    { value: "short", label: "短发" },
    { value: "medium", label: "中发" },
    { value: "long", label: "长发" }
  ],
  hair_shape: [
    { value: "straight", label: "直发" },
    { value: "wavy", label: "微卷" }
  ],
  bangs: [
    { value: "yes", label: "有刘海" },
    { value: "no", label: "无刘海" }
  ],
  expression: [
    { value: "neutral", label: "自然" },
    { value: "smile", label: "微笑" },
    { value: "cool", label: "冷感" },
    { value: "soft", label: "柔和" }
  ],
  presentation_style: [
    { value: "masculine", label: "硬朗" },
    { value: "feminine", label: "柔和" },
    { value: "androgynous", label: "中性" }
  ]
};

export const defaultFeatures: FaceFeatures = {
  face_shape: "oval",
  eye_size: "medium",
  eye_lid: "double",
  brow_thickness: "medium",
  nose_bridge: "medium",
  lip_fullness: "medium",
  skin_tone: "light",
  hair_length: "medium",
  hair_shape: "straight",
  bangs: "no",
  expression: "neutral",
  presentation_style: "androgynous"
};
