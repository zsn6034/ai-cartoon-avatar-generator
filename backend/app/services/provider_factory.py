from typing import Dict, Type

from app.core.config import get_settings
from app.providers.base import BaseProvider
from app.providers.doubao import DoubaoProvider
from app.providers.openai_compatible import OpenAICompatibleProvider
from app.providers.qwen import QwenProvider
from app.providers.registry import (
    ProviderId,
    ProviderRuntimeConfig,
    default_provider_id,
    provider_presets_from_settings,
)
from app.schemas.face import LLMConfig


PROVIDER_CLASSES: Dict[ProviderId, Type[BaseProvider]] = {
    "qwen": QwenProvider,
    "doubao": DoubaoProvider,
    "openai": OpenAICompatibleProvider,
    "custom": OpenAICompatibleProvider,
}


def get_provider(config: LLMConfig):
    runtime_config = ProviderRuntimeConfig.from_llm_config(config)
    provider_class = PROVIDER_CLASSES[runtime_config.provider_id]
    return provider_class(runtime_config)


def list_providers():
    settings = get_settings()
    presets = provider_presets_from_settings(settings)
    return {
        "default_provider": default_provider_id(settings.default_provider),
        "providers": [preset.as_api_dict() for preset in presets],
    }
