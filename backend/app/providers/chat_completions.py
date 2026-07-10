import logging
import time
from typing import Any, Dict, List

import httpx

from app.core.logging_utils import safe_json, summarize_messages, truncate
from app.providers.base import BaseProvider


logger = logging.getLogger("uvicorn.error")


class ChatCompletionsAdapter(BaseProvider):
    temperature = 0.2
    max_tokens = 1200
    request_timeout_seconds = 45

    def completion_url(self) -> str:
        return f"{self.base_url}/chat/completions"

    def build_headers(self) -> Dict[str, str]:
        return {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}

    def build_payload(self, messages: List[Dict[str, Any]]) -> Dict[str, Any]:
        return {
            "model": self.model,
            "messages": messages,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
        }

    def extract_message_content(self, payload: Dict[str, Any]) -> str:
        return str(payload["choices"][0]["message"]["content"])

    async def _json_completion(self, messages: List[Dict[str, Any]]) -> Dict[str, Any]:
        url = self.completion_url()
        payload = self.build_payload(messages)
        logger.info(
            "[llm.%s] request url=%s model=%s messages=%s",
            self.name,
            url,
            self.model,
            safe_json(summarize_messages(messages), 8000),
        )
        started = time.perf_counter()
        try:
            async with httpx.AsyncClient(timeout=self.request_timeout_seconds) as client:
                response = await client.post(url, headers=self.build_headers(), json=payload)
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
            logger.exception("[llm.%s] http error body=%s", self.name, truncate(response.text, 8000))
            raise

        try:
            response_payload = response.json()
        except ValueError:
            logger.exception("[llm.%s] invalid JSON response body=%s", self.name, truncate(response.text, 12000))
            raise
        logger.info("[llm.%s] response body=%s", self.name, safe_json(response_payload, 12000))
        content = self.extract_message_content(response_payload)
        logger.info("[llm.%s] response content=%s", self.name, truncate(content, 12000))
        try:
            parsed = self._parse_json(content)
        except Exception:
            logger.exception("[llm.%s] failed to parse content as JSON content=%s", self.name, truncate(content, 12000))
            raise
        logger.info("[llm.%s] parsed json=%s", self.name, safe_json(parsed, 12000))
        return parsed
