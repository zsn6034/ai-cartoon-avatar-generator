import logging
from typing import Any, Dict, List

from app.core.logging_utils import safe_json
from app.domain import avatar as avatar_domain
from app.providers.base import BaseProvider
from app.schemas.face import AnalysisResponse, ChatMemory, ChatRememberResponse


logger = logging.getLogger("uvicorn.error")


class AvatarAnalysisService:
    def __init__(self, provider: BaseProvider):
        self.provider = provider

    async def remember_chat(self, messages: List[Dict[str, str]], current_memory: Dict[str, Any]) -> ChatRememberResponse:
        memory = ChatMemory(**(current_memory or {}))
        logger.info(
            "[service.avatar.remember] local memory update provider=%s messages=%d current_summary=%r",
            self.provider.name,
            len(messages),
            memory.summary,
        )
        result = avatar_domain.remember_locally(memory, messages, self.provider.name)
        logger.info(
            "[service.avatar.remember] local memory result provider=%s summary=%r notes=%d known_features=%s",
            self.provider.name,
            result.chat_memory.summary,
            len(result.chat_memory.notes),
            result.chat_memory.known_features.model_dump(exclude_none=True),
        )
        return result

    async def generate_chat(self, messages: List[Dict[str, str]], chat_memory: Dict[str, Any]) -> AnalysisResponse:
        memory = ChatMemory(**(chat_memory or {}))
        logger.info(
            "[service.avatar.generate] start provider=%s configured=%s messages=%d memory=%s",
            self.provider.name,
            self.provider.configured,
            len(messages),
            safe_json(memory.model_dump(exclude_none=True), 3000),
        )
        if not self.provider.configured:
            logger.warning("[service.avatar.generate] fallback: provider is not configured provider=%s", self.provider.name)
            return avatar_domain.fallback_analysis(
                reason="未配置 API Key，已根据本轮对话记忆使用本地默认画像。",
                provider_name=self.provider.name,
                known_features=memory.known_features,
            )

        provider_messages = avatar_domain.build_chat_generation_messages(messages, memory)
        try:
            parsed = await self.provider.json_completion(provider_messages)
            result = avatar_domain.normalize_analysis_response(parsed, self.provider.name)
            logger.info(
                "[service.avatar.generate] success provider=%s features=%s defaults_applied=%s",
                self.provider.name,
                result.features.model_dump(),
                result.defaults_applied,
            )
            return result
        except Exception:
            logger.exception("[service.avatar.generate] fallback after LLM failure provider=%s", self.provider.name)
            return avatar_domain.fallback_analysis(
                reason="模型响应不可用，已根据本轮对话记忆使用本地默认画像。",
                provider_name=self.provider.name,
                known_features=memory.known_features,
            )

    async def analyze_image(self, data_url: str) -> AnalysisResponse:
        logger.info(
            "[service.avatar.image] start provider=%s configured=%s data_url_len=%d",
            self.provider.name,
            self.provider.configured,
            len(data_url),
        )
        if not self.provider.configured:
            logger.warning("[service.avatar.image] fallback: provider is not configured provider=%s", self.provider.name)
            return avatar_domain.fallback_analysis(reason="未配置 API Key，已使用本地默认画像。", provider_name=self.provider.name)

        provider_messages = avatar_domain.build_image_analysis_messages(data_url)
        try:
            parsed = await self.provider.json_completion(provider_messages)
            result = avatar_domain.normalize_analysis_response(parsed, self.provider.name)
            logger.info(
                "[service.avatar.image] success provider=%s features=%s defaults_applied=%s",
                self.provider.name,
                result.features.model_dump(),
                result.defaults_applied,
            )
            return result
        except Exception:
            logger.exception("[service.avatar.image] fallback after LLM failure provider=%s", self.provider.name)
            return avatar_domain.fallback_analysis(reason="模型响应不可用，已使用本地默认画像。", provider_name=self.provider.name)
