import json
import logging
import re
import time
from abc import ABC
from typing import Any, Dict, List, Optional

import httpx

from app.schemas.face import (
    ALLOWED_FEATURE_VALUES,
    AnalysisResponse,
    ChatMemory,
    ChatRememberResponse,
    DEFAULT_FEATURES,
    FEATURE_KEYS,
    FEATURE_VALUE_DESCRIPTIONS,
    FeatureReason,
    LLMConfig,
    PartialAvatarFeatures,
)
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
logger = logging.getLogger("uvicorn.error")
LOG_TEXT_LIMIT = 12000

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


def _truncate(value: Any, limit: int = LOG_TEXT_LIMIT) -> str:
    text = str(value)
    if len(text) <= limit:
        return text
    return f"{text[:limit]}...<truncated {len(text) - limit} chars>"


def _safe_json(value: Any, limit: int = LOG_TEXT_LIMIT) -> str:
    try:
        text = json.dumps(value, ensure_ascii=False, default=str)
    except TypeError:
        text = str(value)
    return _truncate(text, limit)


def _summarize_content(content: Any) -> Any:
    if isinstance(content, str):
        if content.startswith("data:"):
            return f"<data_url len={len(content)}>"
        return _truncate(content, 1200)

    if isinstance(content, list):
        summarized = []
        for item in content:
            if not isinstance(item, dict):
                summarized.append(_truncate(item, 400))
                continue
            cloned = dict(item)
            if isinstance(cloned.get("image_url"), dict):
                url = str(cloned["image_url"].get("url") or "")
                cloned["image_url"] = {"url": f"<image_data_url len={len(url)}>"}
            summarized.append(cloned)
        return summarized

    if isinstance(content, dict):
        return {key: _summarize_content(value) for key, value in content.items()}

    return content


def _summarize_messages(messages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    return [
        {"role": item.get("role"), "content": _summarize_content(item.get("content"))}
        for item in messages
    ]


class BaseProvider(ABC):
    name: str

    def __init__(self, config: LLMConfig):
        self.name = config.provider.strip() or self.name
        self.api_key = config.api_key
        self.base_url = config.base_url.rstrip("/")
        self.model = config.model

    @property
    def configured(self) -> bool:
        return bool(self.api_key and self.base_url and self.model)

    async def remember_chat(self, messages: List[Dict[str, str]], current_memory: Dict[str, Any]) -> ChatRememberResponse:
        memory = ChatMemory(**(current_memory or {}))
        logger.info(
            "[provider.%s.remember] local memory update messages=%d current_summary=%r",
            self.name,
            len(messages),
            memory.summary,
        )
        result = self._remember_locally(memory, messages)
        logger.info(
            "[provider.%s.remember] local memory result summary=%r notes=%d known_features=%s",
            self.name,
            result.chat_memory.summary,
            len(result.chat_memory.notes),
            result.chat_memory.known_features.model_dump(exclude_none=True),
        )
        return result

    async def generate_chat(self, messages: List[Dict[str, str]], chat_memory: Dict[str, Any]) -> AnalysisResponse:
        memory = ChatMemory(**(chat_memory or {}))
        logger.info(
            "[provider.%s.generate] start configured=%s messages=%d memory=%s",
            self.name,
            self.configured,
            len(messages),
            _safe_json(memory.model_dump(exclude_none=True), 3000),
        )
        if not self.configured:
            logger.warning("[provider.%s.generate] fallback: provider is not configured", self.name)
            return self._fallback_analysis(reason="未配置 API Key，已根据本轮对话记忆使用本地默认画像。", known_features=memory.known_features)

        user_notes = self._merged_user_notes(memory, messages)
        generation_context = {
            "chat_memory": memory.model_dump(exclude_none=True),
            "user_descriptions": user_notes,
            "default_features": DEFAULT_FEATURES.model_dump(),
        }
        prompt = (
            "请基于以下会话信息选择最终 DiceBear Adventurer 头像部件。"
            "只返回一个 JSON 对象，不要解释，不要输出 Markdown。"
            "输出的第一个字符必须是 {，最后一个字符必须是 }。"
            f"\n{json.dumps(generation_context, ensure_ascii=False)}"
        )
        provider_messages: List[Dict[str, Any]] = [{"role": "system", "content": GENERATE_SYSTEM_PROMPT}]
        provider_messages.append({"role": "user", "content": prompt})

        try:
            parsed = await self._json_completion(provider_messages)
            result = self._normalize_analysis_response(parsed)
            logger.info(
                "[provider.%s.generate] success features=%s defaults_applied=%s",
                self.name,
                result.features.model_dump(),
                result.defaults_applied,
            )
            return result
        except Exception:
            logger.exception("[provider.%s.generate] fallback after LLM failure", self.name)
            return self._fallback_analysis(reason="模型响应不可用，已根据本轮对话记忆使用本地默认画像。", known_features=memory.known_features)

    async def analyze_image(self, data_url: str) -> AnalysisResponse:
        logger.info(
            "[provider.%s.image] start configured=%s data_url_len=%d",
            self.name,
            self.configured,
            len(data_url),
        )
        if not self.configured:
            logger.warning("[provider.%s.image] fallback: provider is not configured", self.name)
            return self._fallback_analysis(reason="未配置 API Key，已使用本地默认画像。")

        messages = [
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
        try:
            parsed = await self._json_completion(messages)
            result = self._normalize_analysis_response(parsed)
            logger.info(
                "[provider.%s.image] success features=%s defaults_applied=%s",
                self.name,
                result.features.model_dump(),
                result.defaults_applied,
            )
            return result
        except Exception:
            logger.exception("[provider.%s.image] fallback after LLM failure", self.name)
            return self._fallback_analysis(reason="模型响应不可用，已使用本地默认画像。")

    async def remember_outfit_chat(
        self, messages: List[Dict[str, str]], current_memory: Dict[str, Any]
    ) -> OutfitChatRememberResponse:
        memory = OutfitChatMemory(**(current_memory or {}))
        logger.info(
            "[provider.%s.outfit.remember] local memory update messages=%d current_summary=%r",
            self.name,
            len(messages),
            memory.summary,
        )
        result = self._remember_outfit_locally(memory, messages)
        logger.info(
            "[provider.%s.outfit.remember] local memory result summary=%r notes=%d known_features=%s",
            self.name,
            result.chat_memory.summary,
            len(result.chat_memory.notes),
            result.chat_memory.known_features.model_dump(exclude_none=True),
        )
        return result

    async def generate_outfit_chat(
        self, messages: List[Dict[str, str]], chat_memory: Dict[str, Any]
    ) -> OutfitAnalysisResponse:
        memory = OutfitChatMemory(**(chat_memory or {}))
        logger.info(
            "[provider.%s.outfit.generate] start configured=%s messages=%d memory=%s",
            self.name,
            self.configured,
            len(messages),
            _safe_json(memory.model_dump(exclude_none=True), 3000),
        )
        if not self.configured:
            logger.warning("[provider.%s.outfit.generate] fallback: provider is not configured", self.name)
            return self._fallback_outfit_analysis(reason="未配置 API Key，已根据本轮对话记忆使用本地默认 3D 搭配。", known_features=memory.known_features)

        user_notes = self._merged_outfit_user_notes(memory, messages)
        generation_context = {
            "chat_memory": memory.model_dump(exclude_none=True),
            "user_descriptions": user_notes,
            "default_features": DEFAULT_OUTFIT_FEATURES.model_dump(),
        }
        prompt = (
            "请基于以下会话信息选择最终 Messenger 3D 换装资产。"
            "只返回一个 JSON 对象，不要解释，不要输出 Markdown。"
            "输出的第一个字符必须是 {，最后一个字符必须是 }。"
            f"\n{json.dumps(generation_context, ensure_ascii=False)}"
        )
        provider_messages: List[Dict[str, Any]] = [{"role": "system", "content": OUTFIT_SYSTEM_PROMPT}]
        provider_messages.append({"role": "user", "content": prompt})

        try:
            parsed = await self._json_completion(provider_messages)
            result = self._normalize_outfit_analysis_response(parsed)
            logger.info(
                "[provider.%s.outfit.generate] success features=%s defaults_applied=%s",
                self.name,
                result.features.model_dump(),
                result.defaults_applied,
            )
            return result
        except Exception:
            logger.exception("[provider.%s.outfit.generate] fallback after LLM failure", self.name)
            return self._fallback_outfit_analysis(reason="模型响应不可用，已根据本轮对话记忆使用本地默认 3D 搭配。", known_features=memory.known_features)

    async def analyze_outfit_image(self, data_url: str) -> OutfitAnalysisResponse:
        logger.info(
            "[provider.%s.outfit.image] start configured=%s data_url_len=%d",
            self.name,
            self.configured,
            len(data_url),
        )
        if not self.configured:
            logger.warning("[provider.%s.outfit.image] fallback: provider is not configured", self.name)
            return self._fallback_outfit_analysis(reason="未配置 API Key，已使用本地默认 3D 搭配。")

        messages = [
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
        try:
            parsed = await self._json_completion(messages)
            result = self._normalize_outfit_analysis_response(parsed)
            logger.info(
                "[provider.%s.outfit.image] success features=%s defaults_applied=%s",
                self.name,
                result.features.model_dump(),
                result.defaults_applied,
            )
            return result
        except Exception:
            logger.exception("[provider.%s.outfit.image] fallback after LLM failure", self.name)
            return self._fallback_outfit_analysis(reason="模型响应不可用，已使用本地默认 3D 搭配。")

    async def _json_completion(self, messages: List[Dict[str, Any]]) -> Dict[str, Any]:
        url = f"{self.base_url}/chat/completions"
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.2,
            "max_tokens": 1200,
        }
        logger.info(
            "[llm.%s] request url=%s model=%s messages=%s",
            self.name,
            url,
            self.model,
            _safe_json(_summarize_messages(messages), 8000),
        )
        started = time.perf_counter()
        try:
            async with httpx.AsyncClient(timeout=45) as client:
                response = await client.post(
                    url,
                    headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"},
                    json=payload,
                )
        except Exception as exc:
            elapsed_ms = (time.perf_counter() - started) * 1000
            logger.exception(
                "[llm.%s] request failed elapsed_ms=%.1f error_type=%s",
                self.name,
                elapsed_ms,
                type(exc).__name__,
            )
            raise

        elapsed_ms = (time.perf_counter() - started) * 1000
        logger.info("[llm.%s] response http_status=%s elapsed_ms=%.1f", self.name, response.status_code, elapsed_ms)
        try:
            response.raise_for_status()
        except httpx.HTTPStatusError:
            logger.exception("[llm.%s] http error body=%s", self.name, _truncate(response.text, 8000))
            raise

        try:
            payload = response.json()
        except ValueError:
            logger.exception("[llm.%s] invalid JSON response body=%s", self.name, _truncate(response.text, 12000))
            raise
        logger.info(
            "[llm.%s] response body=%s",
            self.name,
            _safe_json(payload, 12000),
        )
        content = payload["choices"][0]["message"]["content"]
        logger.info("[llm.%s] response content=%s", self.name, _truncate(content, 12000))
        try:
            parsed = self._parse_json(content)
        except Exception:
            logger.exception("[llm.%s] failed to parse content as JSON content=%s", self.name, _truncate(content, 12000))
            raise
        logger.info("[llm.%s] parsed json=%s", self.name, _safe_json(parsed, 12000))
        return parsed

    def _parse_json(self, content: str) -> Dict[str, Any]:
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            match = re.search(r"\{.*\}", content, flags=re.S)
            if not match:
                raise
            return json.loads(match.group(0))

    def _clean_features(self, data: Dict[str, Any]) -> Dict[str, str]:
        clean: Dict[str, str] = {}
        for key in FEATURE_KEYS:
            value = data.get(key)
            if isinstance(value, str) and value in ALLOWED_FEATURE_VALUES[key]:
                clean[key] = value
        return clean

    def _clean_outfit_features(self, data: Dict[str, Any]) -> Dict[str, str]:
        clean: Dict[str, str] = {}
        for key in OUTFIT_FEATURE_KEYS:
            value = data.get(key)
            if isinstance(value, str) and value in ALLOWED_OUTFIT_VALUES[key]:
                clean[key] = value
        return clean

    def _normalize_analysis_response(self, payload: Dict[str, Any]) -> AnalysisResponse:
        raw_features = payload.get("features") or {}
        clean = self._clean_features(raw_features)
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

        reasons = self._normalize_reasons(payload.get("reasons") or [], clean, "根据输入信息或默认规则选择。")

        return AnalysisResponse(
            status="ready",
            assistant_message=str(payload.get("assistant_message") or "头像已生成。"),
            features=DEFAULT_FEATURES.__class__(**clean),
            confidence=confidence,
            reasons=reasons,
            missing_fields=[],
            defaults_applied=defaults_applied,
            provider=self.name,
        )

    def _normalize_outfit_analysis_response(self, payload: Dict[str, Any]) -> OutfitAnalysisResponse:
        raw_features = payload.get("features") or {}
        clean = self._clean_outfit_features(raw_features)
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

        reasons = self._normalize_reasons(payload.get("reasons") or [], clean, "根据输入信息或默认规则选择 3D 资产。")

        return OutfitAnalysisResponse(
            status="ready",
            assistant_message=str(payload.get("assistant_message") or "3D 搭配已生成。"),
            features=DEFAULT_OUTFIT_FEATURES.__class__(**clean),
            confidence=confidence,
            reasons=reasons,
            missing_fields=[],
            defaults_applied=defaults_applied,
            provider=self.name,
        )

    def _normalize_reasons(self, raw_reasons: Any, features: Dict[str, str], fallback_reason: str) -> List[FeatureReason]:
        reasons: List[FeatureReason] = []
        if isinstance(raw_reasons, list):
            for item in raw_reasons:
                if isinstance(item, dict) and item.get("feature") and item.get("value"):
                    reasons.append(
                        FeatureReason(
                            feature=str(item["feature"]),
                            value=str(item["value"]),
                            reason=str(item.get("reason") or fallback_reason),
                        )
                    )

        if reasons:
            return reasons

        return [FeatureReason(feature=key, value=str(value), reason=fallback_reason) for key, value in features.items()]

    def _recent_user_notes(self, messages: Optional[List[Dict[str, str]]]) -> List[str]:
        notes: List[str] = []
        for item in messages or []:
            if item.get("role") != "user":
                continue
            text = " ".join(str(item.get("content") or "").split())
            if text:
                notes.append(text[:160])
        return notes[-6:]

    def _merged_user_notes(self, memory: ChatMemory, messages: Optional[List[Dict[str, str]]]) -> List[str]:
        notes = [str(item) for item in memory.notes if str(item).strip()]
        notes.extend(self._recent_user_notes(messages))
        return list(dict.fromkeys(notes))[-12:]

    def _merged_outfit_user_notes(
        self, memory: OutfitChatMemory, messages: Optional[List[Dict[str, str]]]
    ) -> List[str]:
        notes = [str(item) for item in memory.notes if str(item).strip()]
        notes.extend(self._recent_user_notes(messages))
        return list(dict.fromkeys(notes))[-12:]

    def _remember_locally(
        self, current_memory: ChatMemory, messages: Optional[List[Dict[str, str]]] = None
    ) -> ChatRememberResponse:
        known = current_memory.known_features.model_dump(exclude_none=True)
        notes = self._merged_user_notes(current_memory, messages)
        summary = "；".join(notes[-6:])[:240]
        chat_memory = ChatMemory(summary=summary, known_features=current_memory.known_features, notes=notes)
        assistant_message = "我记下来了。可以继续补充想法；准备好后点击生成头像。"
        return ChatRememberResponse(
            assistant_message=assistant_message,
            chat_memory=chat_memory,
            confidence={key: 0.5 for key in known},
            reasons=[
                FeatureReason(feature=key, value=str(value), reason="已保留本轮对话记忆。")
                for key, value in known.items()
            ],
            provider=self.name,
        )

    def _fallback_analysis(self, reason: str, known_features: Optional[PartialAvatarFeatures] = None) -> AnalysisResponse:
        features = DEFAULT_FEATURES.model_dump()
        known = known_features.model_dump(exclude_none=True) if known_features else {}
        features.update(self._clean_features(known))
        defaults_applied = [key for key in FEATURE_KEYS if key not in known]

        return AnalysisResponse(
            status="ready",
            assistant_message="头像已生成。",
            features=DEFAULT_FEATURES.__class__(**features),
            confidence={key: 0.5 for key in features},
            reasons=[FeatureReason(feature=key, value=str(value), reason=reason) for key, value in features.items()],
            missing_fields=[],
            defaults_applied=defaults_applied,
            provider=self.name,
        )

    def _remember_outfit_locally(
        self, current_memory: OutfitChatMemory, messages: Optional[List[Dict[str, str]]] = None
    ) -> OutfitChatRememberResponse:
        known = current_memory.known_features.model_dump(exclude_none=True)
        notes = self._merged_outfit_user_notes(current_memory, messages)
        summary = "；".join(notes[-6:])[:240]
        chat_memory = OutfitChatMemory(summary=summary, known_features=current_memory.known_features, notes=notes)
        assistant_message = "我记下来了。可以继续补充想法；准备好后点击生成 3D 搭配。"
        return OutfitChatRememberResponse(
            assistant_message=assistant_message,
            chat_memory=chat_memory,
            confidence={key: 0.5 for key in known},
            reasons=[
                FeatureReason(feature=key, value=str(value), reason="已保留本轮 3D 搭配对话记忆。")
                for key, value in known.items()
            ],
            provider=self.name,
        )

    def _fallback_outfit_analysis(
        self, reason: str, known_features: Optional[PartialOutfitFeatures] = None
    ) -> OutfitAnalysisResponse:
        features = DEFAULT_OUTFIT_FEATURES.model_dump()
        known = known_features.model_dump(exclude_none=True) if known_features else {}
        features.update(self._clean_outfit_features(known))
        defaults_applied = [key for key in OUTFIT_FEATURE_KEYS if key not in known]

        return OutfitAnalysisResponse(
            status="ready",
            assistant_message="3D 搭配已生成。",
            features=DEFAULT_OUTFIT_FEATURES.__class__(**features),
            confidence={key: 0.5 for key in features},
            reasons=[FeatureReason(feature=key, value=str(value), reason=reason) for key, value in features.items()],
            missing_fields=[],
            defaults_applied=defaults_applied,
            provider=self.name,
        )
