import json
from typing import Any, Dict, List, Optional

from app.domain.common import normalize_reasons, recent_user_notes
from app.schemas.face import (
    ALLOWED_FEATURE_VALUES,
    AnalysisResponse,
    ChatMemory,
    ChatRememberResponse,
    DEFAULT_FEATURES,
    FEATURE_KEYS,
    FEATURE_VALUE_DESCRIPTIONS,
    PartialAvatarFeatures,
)


FEATURE_OPTIONS_TEXT = json.dumps(
    {
        key: [
            {"value": value, "description": FEATURE_VALUE_DESCRIPTIONS.get(key, {}).get(value, value)}
            for value in sorted(values)
        ]
        for key, values in ALLOWED_FEATURE_VALUES.items()
    },
    ensure_ascii=False,
)

SEMANTIC_FEATURE_GUIDE = """
中文描述到 Adventurer 部件的近似映射：
- 先把输入拆成可见特征：发型长度/刘海/蓬松度/卷直/露额/配饰、发色、眼神、眉毛情绪、嘴巴表情、肤色、脸部细节、眼镜、耳饰。再从上面的候选 description 中选最接近的 value。
- hair 只表示发型轮廓，不表示颜色；黑色、金色、棕色、灰色等必须放到 hairColor。
- 如果用户描述“黑色厚短发，侧分斜刘海”，应选 hair=short01 或最接近的侧分厚短发，同时 hairColor=#0e0e0e。
- skinColor: 黑皮/深色皮肤=#763900；小麦/健康肤色=#ecad80；棕色皮肤=#9e5622；白净/默认=#f2d3b1。
- hairColor: 黑发=#0e0e0e；金发=#e5d7a3 或 #b9a05f；棕发=#6a4e35 或 #796a45；灰发=#afafaf；彩色发按绿色/粉色/紫色/红橙色选择相近色。
- hair: 短发/清爽/帅小伙优先 short01-short19；长发优先 long01-long26；侧分斜刘海优先 short01/short10/long01/long05/long09/long25；齐刘海优先 long07/long08/long11/long15/long21；卷发优先 short03/short08/short17/long06/long22/long24；马尾/丸子/辫子优先 long10-long19、long23；刺发/朋克优先 short15/short16/short18。
- eyes: 先匹配眼睛开闭、眼珠方向和特殊符号；闭眼笑优先 variant19/variant20，眨眼优先 variant21/variant22，星星眼优先 variant23，对眼优先 variant24，侧目优先 variant02/variant03/variant25/variant26，困倦半闭优先 variant04/variant15/variant16/variant17/variant18。
- eyebrows: 严肃/生气/锐利优先 variant01/variant02；担心/委屈优先 variant03/variant07；自然浓眉优先 variant04/variant08；细弯温柔优先 variant06/variant09/variant11/variant12。
- mouth: 默认平静优先 variant09；微笑优先 variant02/variant22/variant23/variant30；大笑优先 variant01/variant05/variant25/variant26/variant27/variant28；惊讶张嘴优先 variant03/variant07/variant15/variant18；吐舌优先 variant12/variant13/variant16/variant24；嘟嘴/亲吻优先 variant10/variant17/variant20/variant21。
- details: 胡子=mustache；雀斑=freckles；大块腮红=blush；单颗痣/胎记=birthmark；没有明确描述用 none。
- glasses: 不戴眼镜=none；墨镜/太阳镜=variant01；圆框眼镜按大小和粗细选 variant02/variant03/variant04/variant05。
- earrings: 不戴耳饰=none；小圆环=variant01；白色圆形耳环=variant02；多个耳钉=variant03/variant04；耳骨夹/上方交叉饰=variant05；单颗黑耳钉=variant06。
- 不要因为编号靠前就选默认值；必须用 description 的语义相似度做选择。无法判断时才使用默认。
名人描述只当作泛化风格线索，不要输出或声称真实相似度。
"""

GENERATE_SYSTEM_PROMPT = f"""
You generate a DiceBear Adventurer avatar from conversation memory.
Return a single strict JSON object only. The first character must be "{{" and the last character must be "}}".
Do not output Markdown, code fences, comments, explanations, or surrounding text.
Do not infer sensitive identity.
Allowed Adventurer values by field:
{FEATURE_OPTIONS_TEXT}
{SEMANTIC_FEATURE_GUIDE}
Return shape:
{{
  "status": "ready",
  "assistant_message": "short Chinese message",
  "features": {{
    "hair": "short01",
    "eyes": "variant01",
    "eyebrows": "variant04",
    "mouth": "variant09",
    "hairColor": "#0e0e0e",
    "skinColor": "#f2d3b1",
    "details": "none",
    "glasses": "none",
    "earrings": "none"
  }},
  "confidence": {{"hair": 0.0}},
  "reasons": [{{"feature": "hair", "value": "short01", "reason": "Chinese reason"}}],
  "missing_fields": [],
  "defaults_applied": []
}}
All features must be present. Use defaults when the conversation does not specify a field.
"""


def merged_user_notes(memory: ChatMemory, messages: Optional[List[Dict[str, str]]]) -> List[str]:
    notes = [str(item) for item in memory.notes if str(item).strip()]
    notes.extend(recent_user_notes(messages))
    return list(dict.fromkeys(notes))[-12:]


def build_chat_generation_messages(messages: List[Dict[str, str]], memory: ChatMemory) -> List[Dict[str, Any]]:
    generation_context = {
        "chat_memory": memory.model_dump(exclude_none=True),
        "user_descriptions": merged_user_notes(memory, messages),
        "default_features": DEFAULT_FEATURES.model_dump(),
    }
    prompt = (
        "请基于以下会话信息选择最终 DiceBear Adventurer 头像部件。"
        "只返回一个 JSON 对象，不要解释，不要输出 Markdown。"
        "输出的第一个字符必须是 {，最后一个字符必须是 }。"
        f"\n{json.dumps(generation_context, ensure_ascii=False)}"
    )
    return [{"role": "system", "content": GENERATE_SYSTEM_PROMPT}, {"role": "user", "content": prompt}]


def build_image_analysis_messages(data_url: str) -> List[Dict[str, Any]]:
    return [
        {"role": "system", "content": GENERATE_SYSTEM_PROMPT},
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Analyze this portrait and choose a complete DiceBear Adventurer avatar. Return ready JSON with reasons.",
                },
                {"type": "image_url", "image_url": {"url": data_url}},
            ],
        },
    ]


def clean_features(data: Dict[str, Any]) -> Dict[str, str]:
    clean: Dict[str, str] = {}
    for key in FEATURE_KEYS:
        value = data.get(key)
        if isinstance(value, str) and value in ALLOWED_FEATURE_VALUES[key]:
            clean[key] = value
    return clean


def normalize_analysis_response(payload: Dict[str, Any], provider_name: str) -> AnalysisResponse:
    raw_features = payload.get("features") or {}
    clean = clean_features(raw_features)
    defaults = DEFAULT_FEATURES.model_dump()
    defaults_applied = list(payload.get("defaults_applied") or [])

    for key in FEATURE_KEYS:
        if not clean.get(key):
            clean[key] = defaults[key]
            if key not in defaults_applied:
                defaults_applied.append(key)

    confidence = {
        key: float(value)
        for key, value in (payload.get("confidence") or {}).items()
        if key in FEATURE_KEYS and isinstance(value, (int, float))
    }
    for key in clean:
        confidence.setdefault(key, 0.68 if key in defaults_applied else 0.82)

    reasons = normalize_reasons(payload.get("reasons") or [], clean, "根据输入信息或默认规则选择。")

    return AnalysisResponse(
        status="ready",
        assistant_message=str(payload.get("assistant_message") or "头像已生成。"),
        features=DEFAULT_FEATURES.__class__(**clean),
        confidence=confidence,
        reasons=reasons,
        missing_fields=[],
        defaults_applied=defaults_applied,
        provider=provider_name,
    )


def remember_locally(
    current_memory: ChatMemory,
    messages: Optional[List[Dict[str, str]]],
    provider_name: str,
) -> ChatRememberResponse:
    known = current_memory.known_features.model_dump(exclude_none=True)
    notes = merged_user_notes(current_memory, messages)
    summary = "；".join(notes[-6:])[:240]
    chat_memory = ChatMemory(summary=summary, known_features=current_memory.known_features, notes=notes)
    assistant_message = "我记下来了。可以继续补充想法；准备好后点击生成头像。"
    return ChatRememberResponse(
        assistant_message=assistant_message,
        chat_memory=chat_memory,
        confidence={key: 0.5 for key in known},
        reasons=[
            normalize_reasons(
                [{"feature": key, "value": str(value), "reason": "已保留本轮对话记忆。"}],
                {key: str(value)},
                "已保留本轮对话记忆。",
            )[0]
            for key, value in known.items()
        ],
        provider=provider_name,
    )


def fallback_analysis(
    reason: str,
    provider_name: str,
    known_features: Optional[PartialAvatarFeatures] = None,
) -> AnalysisResponse:
    features = DEFAULT_FEATURES.model_dump()
    known = known_features.model_dump(exclude_none=True) if known_features else {}
    features.update(clean_features(known))
    defaults_applied = [key for key in FEATURE_KEYS if key not in known]

    return AnalysisResponse(
        status="ready",
        assistant_message="头像已生成。",
        features=DEFAULT_FEATURES.__class__(**features),
        confidence={key: 0.5 for key in features},
        reasons=normalize_reasons([], features, reason),
        missing_fields=[],
        defaults_applied=defaults_applied,
        provider=provider_name,
    )
