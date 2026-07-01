import json
import re
from abc import ABC
from typing import Any, Dict, List, Optional

import httpx

from app.schemas.face import AnalysisResponse, DEFAULT_FEATURES, FEATURE_KEYS, FeatureReason, PartialFaceFeatures


SYSTEM_PROMPT = """
You analyze face descriptions for a cartoon avatar generator. Return strict JSON only.
Do not infer sensitive identity. Use presentation_style for visual styling only.
Allowed feature values:
face_shape: oval, round, square, heart
eye_size: small, medium, large
eye_lid: monolid, double, hooded
brow_thickness: thin, medium, thick
nose_bridge: low, medium, high
lip_fullness: thin, medium, full
skin_tone: fair, light, medium, tan, deep
hair_length: short, medium, long
hair_shape: straight, wavy
bangs: yes, no
expression: neutral, smile, cool, soft
presentation_style: masculine, feminine, androgynous
Return shape:
{
  "status": "need_more_info" | "ready",
  "assistant_message": "short Chinese message",
  "features": {},
  "confidence": {"feature": 0.0},
  "reasons": [{"feature": "face_shape", "value": "round", "reason": "Chinese reason"}],
  "missing_fields": [],
  "defaults_applied": []
}
"""


class BaseProvider(ABC):
    name: str

    def __init__(self, api_key: str, base_url: str, model: str):
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.model = model

    @property
    def configured(self) -> bool:
        return bool(self.api_key and self.base_url and self.model)

    async def analyze_chat(self, messages: List[Dict[str, str]], current_features: Dict[str, Any], round_index: int) -> AnalysisResponse:
        if not self.configured:
            return self._fallback_response(round_index=round_index, reason="未配置 API Key，已使用本地默认画像。")

        prompt = (
            f"Round index: {round_index}. Max rounds: 3. "
            f"Current known features: {json.dumps(current_features, ensure_ascii=False)}. "
            "If important fields are missing and round_index < 3, ask one concise follow-up question. "
            "If round_index >= 3, apply defaults and return ready."
        )
        provider_messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        provider_messages.extend({"role": item["role"], "content": item["content"]} for item in messages)
        provider_messages.append({"role": "user", "content": prompt})
        return await self._chat_completion(provider_messages, round_index)

    async def analyze_image(self, data_url: str) -> AnalysisResponse:
        if not self.configured:
            return self._fallback_response(round_index=3, reason="未配置 API Key，已使用本地默认画像。")

        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Analyze this portrait for a young cartoon avatar. Return ready JSON with reasons.",
                    },
                    {"type": "image_url", "image_url": {"url": data_url}},
                ],
            },
        ]
        return await self._chat_completion(messages, round_index=3)

    async def _chat_completion(self, messages: List[Dict[str, Any]], round_index: int) -> AnalysisResponse:
        try:
            async with httpx.AsyncClient(timeout=45) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"},
                    json={
                        "model": self.model,
                        "messages": messages,
                        "temperature": 0.2,
                        "response_format": {"type": "json_object"},
                    },
                )
                response.raise_for_status()
                payload = response.json()
            content = payload["choices"][0]["message"]["content"]
            parsed = self._parse_json(content)
            return self._normalize_response(parsed, round_index)
        except Exception:
            return self._fallback_response(round_index=round_index, reason="模型响应不可用，已使用本地默认画像。")

    def _parse_json(self, content: str) -> Dict[str, Any]:
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            match = re.search(r"\{.*\}", content, flags=re.S)
            if not match:
                raise
            return json.loads(match.group(0))

    def _normalize_response(self, payload: Dict[str, Any], round_index: int) -> AnalysisResponse:
        features_data = payload.get("features") or {}
        defaults_applied = list(payload.get("defaults_applied") or [])

        if round_index >= 3 or payload.get("status") == "ready":
            defaults = DEFAULT_FEATURES.model_dump()
            for key in FEATURE_KEYS:
                if not features_data.get(key):
                    features_data[key] = defaults[key]
                    if key not in defaults_applied:
                        defaults_applied.append(key)
            status = "ready"
            missing_fields: List[str] = []
        else:
            status = "need_more_info"
            missing_fields = [key for key in FEATURE_KEYS if not features_data.get(key)]

        confidence = {
            key: float(value)
            for key, value in (payload.get("confidence") or {}).items()
            if key in FEATURE_KEYS and isinstance(value, (int, float))
        }
        for key in features_data:
            confidence.setdefault(key, 0.68 if key in defaults_applied else 0.78)

        reasons = []
        for item in payload.get("reasons") or []:
            if isinstance(item, dict) and item.get("feature") and item.get("value"):
                reasons.append(
                    FeatureReason(
                        feature=str(item["feature"]),
                        value=str(item["value"]),
                        reason=str(item.get("reason") or "根据输入信息匹配到该特征。"),
                    )
                )

        if not reasons:
            reasons = [
                FeatureReason(feature=key, value=str(value), reason="根据输入信息或默认规则选择。")
                for key, value in features_data.items()
            ]

        return AnalysisResponse(
            status=status,
            assistant_message=str(payload.get("assistant_message") or ("还需要一点描述。" if status == "need_more_info" else "画像特征已生成。")),
            features=PartialFaceFeatures(**features_data),
            confidence=confidence,
            reasons=reasons,
            missing_fields=missing_fields,
            defaults_applied=defaults_applied,
            provider=self.name,  # type: ignore[arg-type]
        )

    def _fallback_response(self, round_index: int, reason: str) -> AnalysisResponse:
        features = DEFAULT_FEATURES.model_dump()
        defaults_applied = FEATURE_KEYS.copy()
        status = "ready" if round_index >= 3 else "need_more_info"
        if status == "need_more_info":
            partial = {key: features[key] for key in ["face_shape", "eye_size", "skin_tone", "hair_length"]}
            missing_fields = [key for key in FEATURE_KEYS if key not in partial]
            feature_payload = partial
            defaults_applied = list(partial.keys())
            assistant_message = "我还需要知道眉毛、鼻梁、嘴唇、发型细节和整体风格。"
        else:
            missing_fields = []
            feature_payload = features
            assistant_message = "画像特征已生成。"

        return AnalysisResponse(
            status=status,
            assistant_message=assistant_message,
            features=PartialFaceFeatures(**feature_payload),
            confidence={key: 0.5 for key in feature_payload},
            reasons=[
                FeatureReason(feature=key, value=str(value), reason=reason)
                for key, value in feature_payload.items()
            ],
            missing_fields=missing_fields,
            defaults_applied=defaults_applied,
            provider=self.name,  # type: ignore[arg-type]
        )
