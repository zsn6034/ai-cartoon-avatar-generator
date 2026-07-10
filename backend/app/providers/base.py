import json
import re
from abc import ABC, abstractmethod
from typing import Any, Dict, List

from app.providers.registry import ProviderRuntimeConfig


class BaseProvider(ABC):
    name: str

    def __init__(self, runtime_config: ProviderRuntimeConfig):
        self.runtime_config = runtime_config
        self.provider_id = runtime_config.provider_id
        self.name = runtime_config.provider_name
        self.api_key = runtime_config.api_key
        self.base_url = runtime_config.base_url
        self.model = runtime_config.model
        self.capabilities = runtime_config.capabilities

    @property
    def configured(self) -> bool:
        return bool(self.api_key and self.base_url and self.model)

    async def json_completion(self, messages: List[Dict[str, Any]]) -> Dict[str, Any]:
        return await self._json_completion(messages)

    @abstractmethod
    async def _json_completion(self, messages: List[Dict[str, Any]]) -> Dict[str, Any]:
        raise NotImplementedError

    def _parse_json(self, content: str) -> Dict[str, Any]:
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            match = re.search(r"\{.*\}", content, flags=re.S)
            if not match:
                raise
            return json.loads(match.group(0))
