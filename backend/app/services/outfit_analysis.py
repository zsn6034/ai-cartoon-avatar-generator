import logging
from typing import Any, Dict, List

from app.core.logging_utils import safe_json
from app.domain import outfit as outfit_domain
from app.providers.base import BaseProvider
from app.schemas.outfit import OutfitAnalysisResponse, OutfitChatMemory, OutfitChatRememberResponse


logger = logging.getLogger("uvicorn.error")


class OutfitAnalysisService:
    def __init__(self, provider: BaseProvider):
        self.provider = provider

    async def remember_chat(
        self, messages: List[Dict[str, str]], current_memory: Dict[str, Any]
    ) -> OutfitChatRememberResponse:
        memory = OutfitChatMemory(**(current_memory or {}))
        logger.info(
            "[service.outfit.remember] local memory update provider=%s messages=%d current_summary=%r",
            self.provider.name,
            len(messages),
            memory.summary,
        )
        result = outfit_domain.remember_locally(memory, messages, self.provider.name)
        logger.info(
            "[service.outfit.remember] local memory result provider=%s summary=%r notes=%d known_features=%s",
            self.provider.name,
            result.chat_memory.summary,
            len(result.chat_memory.notes),
            result.chat_memory.known_features.model_dump(exclude_none=True),
        )
        return result

    async def generate_chat(
        self, messages: List[Dict[str, str]], chat_memory: Dict[str, Any]
    ) -> OutfitAnalysisResponse:
        memory = OutfitChatMemory(**(chat_memory or {}))
        logger.info(
            "[service.outfit.generate] start provider=%s configured=%s messages=%d memory=%s",
            self.provider.name,
            self.provider.configured,
            len(messages),
            safe_json(memory.model_dump(exclude_none=True), 3000),
        )
        if not self.provider.configured:
            logger.warning("[service.outfit.generate] fallback: provider is not configured provider=%s", self.provider.name)
            return outfit_domain.fallback_analysis(
                reason="未配置 API Key，已根据本轮对话记忆使用本地默认 3D 搭配。",
                provider_name=self.provider.name,
                known_features=memory.known_features,
            )

        provider_messages = outfit_domain.build_chat_generation_messages(messages, memory)
        try:
            parsed = await self.provider.json_completion(provider_messages)
            result = outfit_domain.normalize_analysis_response(parsed, self.provider.name)
            logger.info(
                "[service.outfit.generate] success provider=%s features=%s defaults_applied=%s",
                self.provider.name,
                result.features.model_dump(),
                result.defaults_applied,
            )
            return result
        except Exception:
            logger.exception("[service.outfit.generate] fallback after LLM failure provider=%s", self.provider.name)
            return outfit_domain.fallback_analysis(
                reason="模型响应不可用，已根据本轮对话记忆使用本地默认 3D 搭配。",
                provider_name=self.provider.name,
                known_features=memory.known_features,
            )

    async def analyze_image(self, data_url: str) -> OutfitAnalysisResponse:
        logger.info(
            "[service.outfit.image] start provider=%s configured=%s data_url_len=%d",
            self.provider.name,
            self.provider.configured,
            len(data_url),
        )
        if not self.provider.configured:
            logger.warning("[service.outfit.image] fallback: provider is not configured provider=%s", self.provider.name)
            return outfit_domain.fallback_analysis(reason="未配置 API Key，已使用本地默认 3D 搭配。", provider_name=self.provider.name)

        provider_messages = outfit_domain.build_image_analysis_messages(data_url)
        try:
            parsed = await self.provider.json_completion(provider_messages)
            result = outfit_domain.normalize_analysis_response(parsed, self.provider.name)
            logger.info(
                "[service.outfit.image] success provider=%s features=%s defaults_applied=%s",
                self.provider.name,
                result.features.model_dump(),
                result.defaults_applied,
            )
            return result
        except Exception:
            logger.exception("[service.outfit.image] fallback after LLM failure provider=%s", self.provider.name)
            return outfit_domain.fallback_analysis(reason="模型响应不可用，已使用本地默认 3D 搭配。", provider_name=self.provider.name)
