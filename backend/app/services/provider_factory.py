from app.core.config import get_settings
from app.providers.doubao import DoubaoProvider
from app.providers.openai_compatible import OpenAICompatibleProvider
from app.providers.qwen import QwenProvider
from app.schemas.face import LLMConfig


def get_provider(config: LLMConfig):
    provider_name = config.provider.strip().lower()
    provider_classes = {
        "qwen": QwenProvider,
        "doubao": DoubaoProvider,
        "openai": OpenAICompatibleProvider,
        "custom": OpenAICompatibleProvider,
    }
    provider_class = provider_classes.get(provider_name, OpenAICompatibleProvider)
    return provider_class(config)


def list_providers():
    settings = get_settings()
    return {
        "default_provider": settings.default_provider,
        "providers": [
            {
                "id": "qwen",
                "label": "Qwen",
                "model": settings.qwen_model,
                "base_url": settings.qwen_base_url,
                "configured": bool(settings.qwen_api_key),
            },
            {
                "id": "doubao",
                "label": "Doubao",
                "model": settings.doubao_model,
                "base_url": settings.doubao_base_url,
                "configured": bool(settings.doubao_api_key),
            },
            {"id": "openai", "label": "OpenAI", "model": "gpt-4o-mini", "base_url": "https://api.openai.com/v1", "configured": False},
            {"id": "custom", "label": "Custom", "model": "", "base_url": "", "configured": False},
        ],
    }
