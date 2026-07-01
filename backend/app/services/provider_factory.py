from fastapi import HTTPException

from app.core.config import get_settings
from app.providers.doubao import DoubaoProvider
from app.providers.qwen import QwenProvider


def get_provider(name: str):
    settings = get_settings()
    providers = {
        "qwen": QwenProvider(settings.qwen_api_key, settings.qwen_base_url, settings.qwen_model),
        "doubao": DoubaoProvider(settings.doubao_api_key, settings.doubao_base_url, settings.doubao_model),
    }
    if name not in providers:
        raise HTTPException(status_code=400, detail="Unsupported provider")
    return providers[name]


def list_providers():
    settings = get_settings()
    return {
        "default_provider": settings.default_provider,
        "providers": [
            {"id": "qwen", "label": "Qwen", "model": settings.qwen_model, "configured": bool(settings.qwen_api_key)},
            {"id": "doubao", "label": "Doubao", "model": settings.doubao_model, "configured": bool(settings.doubao_api_key)},
        ],
    }
