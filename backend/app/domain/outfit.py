import json
from typing import Any, Dict, List, Optional

from app.domain.common import normalize_reasons, recent_user_notes
from app.schemas.outfit import (
    ALLOWED_OUTFIT_VALUES,
    DEFAULT_OUTFIT_FEATURES,
    OUTFIT_FEATURE_KEYS,
    OUTFIT_VALUE_DESCRIPTIONS,
    OutfitAnalysisResponse,
    OutfitChatMemory,
    OutfitChatRememberResponse,
    PartialOutfitFeatures,
)


OUTFIT_OPTIONS_TEXT = json.dumps(
    {
        key: [
            {"value": value, "description": OUTFIT_VALUE_DESCRIPTIONS.get(key, {}).get(value, value)}
            for value in sorted(values)
        ]
        for key, values in ALLOWED_OUTFIT_VALUES.items()
    },
    ensure_ascii=False,
)

OUTFIT_SEMANTIC_GUIDE = """
中文描述到 Messenger 3D 换装资产的近似映射：
- 先把输入拆成可见资产特征：发色和发型轮廓、上衣颜色/长短/装饰、下装颜色/裙裤轮廓、鞋子颜色/鞋口高低。再从上面的候选 description 中选最接近的 value。
- 这些 Messenger 3D 资产颜色是固定材质色；用户明确描述颜色时，优先匹配 description 中的颜色，不要把黑鞋映射成浅色鞋、把裙装映射成普通裤装。
- hair: 按 description 同时匹配颜色和轮廓。黑色厚短发优先 hair1；棕色圆润短发优先 hair2；金棕/浅棕侧分短发优先 hair3；黑蓝蓬松短发优先 hair4；暗紫层次短发优先 hair5；深绿上翘短发优先 hair6；橙红醒目短发优先 hair7。
- top: 按上衣颜色优先匹配。米白长袖/针织纹理/斜挎带装饰优先 top1；绿色=top2；砖红=top3；蓝色=top4；黑色=top5；黄棕/卡其黄=top6；灰紫=top7；亮黄=top8；酒红/紫红=top9。
- bottom: 字段表示下装，不一定是裤子。蓝绿色中长裙/半身裙优先 bottom1；卡其棕=bottom2；深蓝=bottom3；深灰绿=bottom4；棕灰=bottom5；深绿=bottom6；暗紫=bottom7。
- shoes: 按鞋子颜色优先匹配。黑色高鞋口/短靴感优先 shoes1；米白/浅色=shoes2；棕色=shoes3；深灰=shoes4；红棕=shoes5；深蓝=shoes6；暖红/橙红=shoes7。
- 不要因为编号靠前就选默认值；必须用 description 的语义相似度做选择。无法判断时才使用默认。
资产标签只有粗粒度语义。不要声称精确复刻照片服装，只选择最接近的 3D 资产颜色与轮廓组合。
名人或真实人物描述只当作泛化风格线索，不要输出或声称真实相似度。
"""

OUTFIT_SYSTEM_PROMPT = f"""
You map an uploaded image or conversation into a Messenger-style 3D outfit asset selection.
Return a single strict JSON object only. The first character must be "{{" and the last character must be "}}".
Do not output Markdown, code fences, comments, explanations, or surrounding text.
Do not infer sensitive identity.
Allowed Messenger 3D outfit values by field:
{OUTFIT_OPTIONS_TEXT}
{OUTFIT_SEMANTIC_GUIDE}
Return shape:
{{
  "status": "ready",
  "assistant_message": "short Chinese message",
  "features": {{
    "hair": "hair1",
    "top": "top1",
    "bottom": "bottom1",
    "shoes": "shoes1"
  }},
  "confidence": {{"hair": 0.0}},
  "reasons": [{{"feature": "top", "value": "top1", "reason": "Chinese reason"}}],
  "missing_fields": [],
  "defaults_applied": []
}}
All features must be present. Use defaults when the input does not specify a field.
"""


def merged_user_notes(memory: OutfitChatMemory, messages: Optional[List[Dict[str, str]]]) -> List[str]:
    notes = [str(item) for item in memory.notes if str(item).strip()]
    notes.extend(recent_user_notes(messages))
    return list(dict.fromkeys(notes))[-12:]


def build_chat_generation_messages(messages: List[Dict[str, str]], memory: OutfitChatMemory) -> List[Dict[str, Any]]:
    generation_context = {
        "chat_memory": memory.model_dump(exclude_none=True),
        "user_descriptions": merged_user_notes(memory, messages),
        "default_features": DEFAULT_OUTFIT_FEATURES.model_dump(),
    }
    prompt = (
        "请基于以下会话信息选择最终 Messenger 3D 换装资产。"
        "只返回一个 JSON 对象，不要解释，不要输出 Markdown。"
        "输出的第一个字符必须是 {，最后一个字符必须是 }。"
        f"\n{json.dumps(generation_context, ensure_ascii=False)}"
    )
    return [{"role": "system", "content": OUTFIT_SYSTEM_PROMPT}, {"role": "user", "content": prompt}]


def build_image_analysis_messages(data_url: str) -> List[Dict[str, Any]]:
    return [
        {"role": "system", "content": OUTFIT_SYSTEM_PROMPT},
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Analyze this image and choose a complete Messenger-style 3D outfit asset selection. Return ready JSON with reasons.",
                },
                {"type": "image_url", "image_url": {"url": data_url}},
            ],
        },
    ]


def clean_features(data: Dict[str, Any]) -> Dict[str, str]:
    clean: Dict[str, str] = {}
    for key in OUTFIT_FEATURE_KEYS:
        value = data.get(key)
        if isinstance(value, str) and value in ALLOWED_OUTFIT_VALUES[key]:
            clean[key] = value
    return clean


def normalize_analysis_response(payload: Dict[str, Any], provider_name: str) -> OutfitAnalysisResponse:
    raw_features = payload.get("features") or {}
    clean = clean_features(raw_features)
    defaults = DEFAULT_OUTFIT_FEATURES.model_dump()
    defaults_applied = list(payload.get("defaults_applied") or [])

    for key in OUTFIT_FEATURE_KEYS:
        if not clean.get(key):
            clean[key] = defaults[key]
            if key not in defaults_applied:
                defaults_applied.append(key)

    confidence = {
        key: float(value)
        for key, value in (payload.get("confidence") or {}).items()
        if key in OUTFIT_FEATURE_KEYS and isinstance(value, (int, float))
    }
    for key in clean:
        confidence.setdefault(key, 0.68 if key in defaults_applied else 0.82)

    reasons = normalize_reasons(payload.get("reasons") or [], clean, "根据输入信息或默认规则选择 3D 资产。")

    return OutfitAnalysisResponse(
        status="ready",
        assistant_message=str(payload.get("assistant_message") or "3D 搭配已生成。"),
        features=DEFAULT_OUTFIT_FEATURES.__class__(**clean),
        confidence=confidence,
        reasons=reasons,
        missing_fields=[],
        defaults_applied=defaults_applied,
        provider=provider_name,
    )


def remember_locally(
    current_memory: OutfitChatMemory,
    messages: Optional[List[Dict[str, str]]],
    provider_name: str,
) -> OutfitChatRememberResponse:
    known = current_memory.known_features.model_dump(exclude_none=True)
    notes = merged_user_notes(current_memory, messages)
    summary = "；".join(notes[-6:])[:240]
    chat_memory = OutfitChatMemory(summary=summary, known_features=current_memory.known_features, notes=notes)
    assistant_message = "我记下来了。可以继续补充想法；准备好后点击生成 3D 搭配。"
    return OutfitChatRememberResponse(
        assistant_message=assistant_message,
        chat_memory=chat_memory,
        confidence={key: 0.5 for key in known},
        reasons=[
            normalize_reasons(
                [{"feature": key, "value": str(value), "reason": "已保留本轮 3D 搭配对话记忆。"}],
                {key: str(value)},
                "已保留本轮 3D 搭配对话记忆。",
            )[0]
            for key, value in known.items()
        ],
        provider=provider_name,
    )


def fallback_analysis(
    reason: str,
    provider_name: str,
    known_features: Optional[PartialOutfitFeatures] = None,
) -> OutfitAnalysisResponse:
    features = DEFAULT_OUTFIT_FEATURES.model_dump()
    known = known_features.model_dump(exclude_none=True) if known_features else {}
    features.update(clean_features(known))
    defaults_applied = [key for key in OUTFIT_FEATURE_KEYS if key not in known]

    return OutfitAnalysisResponse(
        status="ready",
        assistant_message="3D 搭配已生成。",
        features=DEFAULT_OUTFIT_FEATURES.__class__(**features),
        confidence={key: 0.5 for key in features},
        reasons=normalize_reasons([], features, reason),
        missing_fields=[],
        defaults_applied=defaults_applied,
        provider=provider_name,
    )
