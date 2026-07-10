from dataclasses import dataclass
from typing import Any, Dict, Literal, Tuple, cast


ProviderId = Literal["qwen", "doubao", "openai", "custom"]
ProviderCapability = Literal["chat_completions", "vision"]

DEFAULT_CAPABILITIES: Tuple[ProviderCapability, ...] = ("chat_completions", "vision")


@dataclass(frozen=True)
class ProviderDefinition:
    id: ProviderId
    label: str
    default_model: str
    default_base_url: str
    capabilities: Tuple[ProviderCapability, ...] = DEFAULT_CAPABILITIES
    requires_api_key: bool = True
    supports_custom_base_url: bool = True
    model_setting: str | None = None
    base_url_setting: str | None = None
    api_key_setting: str | None = None


@dataclass(frozen=True)
class ProviderPreset:
    id: ProviderId
    label: str
    model: str
    base_url: str
    configured: bool
    capabilities: Tuple[ProviderCapability, ...]
    requires_api_key: bool
    supports_custom_base_url: bool

    def as_api_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "label": self.label,
            "model": self.model,
            "base_url": self.base_url,
            "configured": self.configured,
            "capabilities": list(self.capabilities),
            "requires_api_key": self.requires_api_key,
            "supports_custom_base_url": self.supports_custom_base_url,
        }


@dataclass(frozen=True)
class ProviderRuntimeConfig:
    provider_id: ProviderId
    provider_name: str
    label: str
    model: str
    api_key: str
    base_url: str
    capabilities: Tuple[ProviderCapability, ...]
    supports_custom_base_url: bool

    @classmethod
    def from_llm_config(cls, config: Any) -> "ProviderRuntimeConfig":
        provider_id = normalize_provider_id(config.provider)
        definition = get_provider_definition(provider_id)
        provider_name = str(getattr(config, "provider_name", "") or "").strip()
        display_name = provider_name if provider_id == "custom" and provider_name else provider_id

        return cls(
            provider_id=provider_id,
            provider_name=display_name,
            label=definition.label,
            model=str(config.model).strip(),
            api_key=str(config.api_key).strip(),
            base_url=str(config.base_url).strip().rstrip("/"),
            capabilities=definition.capabilities,
            supports_custom_base_url=definition.supports_custom_base_url,
        )


PROVIDER_DEFINITIONS: Dict[ProviderId, ProviderDefinition] = {
    "qwen": ProviderDefinition(
        id="qwen",
        label="Qwen",
        default_model="qwen-vl-plus",
        default_base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
        model_setting="qwen_model",
        base_url_setting="qwen_base_url",
        api_key_setting="qwen_api_key",
    ),
    "doubao": ProviderDefinition(
        id="doubao",
        label="Doubao",
        default_model="doubao-1-5-vision-pro-32k-250115",
        default_base_url="https://ark.cn-beijing.volces.com/api/v3",
        model_setting="doubao_model",
        base_url_setting="doubao_base_url",
        api_key_setting="doubao_api_key",
    ),
    "openai": ProviderDefinition(
        id="openai",
        label="OpenAI",
        default_model="gpt-4o-mini",
        default_base_url="https://api.openai.com/v1",
    ),
    "custom": ProviderDefinition(
        id="custom",
        label="Custom",
        default_model="",
        default_base_url="",
    ),
}


def normalize_provider_id(value: Any) -> ProviderId:
    provider_id = str(value or "").strip().lower()
    if provider_id not in PROVIDER_DEFINITIONS:
        supported = ", ".join(PROVIDER_DEFINITIONS)
        raise ValueError(f"Unsupported provider '{value}'. Use one of: {supported}.")
    return cast(ProviderId, provider_id)


def get_provider_definition(provider_id: ProviderId) -> ProviderDefinition:
    return PROVIDER_DEFINITIONS[provider_id]


def default_provider_id(value: Any) -> ProviderId:
    try:
        return normalize_provider_id(value)
    except ValueError:
        return "qwen"


def provider_presets_from_settings(settings: Any) -> list[ProviderPreset]:
    presets: list[ProviderPreset] = []
    for definition in PROVIDER_DEFINITIONS.values():
        model = (
            str(getattr(settings, definition.model_setting)).strip()
            if definition.model_setting
            else definition.default_model
        )
        base_url = (
            str(getattr(settings, definition.base_url_setting)).strip()
            if definition.base_url_setting
            else definition.default_base_url
        )
        configured = bool(
            str(getattr(settings, definition.api_key_setting)).strip()
            if definition.api_key_setting
            else False
        )
        presets.append(
            ProviderPreset(
                id=definition.id,
                label=definition.label,
                model=model,
                base_url=base_url,
                configured=configured,
                capabilities=definition.capabilities,
                requires_api_key=definition.requires_api_key,
                supports_custom_base_url=definition.supports_custom_base_url,
            )
        )
    return presets
