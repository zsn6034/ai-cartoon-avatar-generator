import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from pydantic import ValidationError

from app.providers.chat_completions import ChatCompletionsAdapter
from app.providers.doubao import DoubaoProvider
from app.providers.openai_compatible import OpenAICompatibleProvider
from app.providers.qwen import QwenProvider
from app.providers.registry import ProviderRuntimeConfig
from app.schemas.face import LLMConfig
from app.services.provider_factory import get_provider, list_providers


class ProviderFactoryTests(unittest.TestCase):
    def make_config(self, provider: str = "qwen", **overrides) -> LLMConfig:
        data = {
            "provider": provider,
            "model": "test-model",
            "api_key": "test-key",
            "base_url": "https://example.test/v1",
        }
        data.update(overrides)
        return LLMConfig.model_validate(data)

    def test_builtin_providers_use_expected_adapters(self):
        qwen = get_provider(self.make_config("qwen"))
        doubao = get_provider(self.make_config("doubao"))
        openai = get_provider(self.make_config("openai"))

        self.assertIsInstance(qwen, QwenProvider)
        self.assertIsInstance(doubao, DoubaoProvider)
        self.assertIsInstance(openai, OpenAICompatibleProvider)
        self.assertIsInstance(qwen, ChatCompletionsAdapter)
        self.assertIsInstance(doubao, ChatCompletionsAdapter)
        self.assertIsInstance(openai, ChatCompletionsAdapter)
        self.assertNotIsInstance(qwen, OpenAICompatibleProvider)
        self.assertNotIsInstance(doubao, OpenAICompatibleProvider)

    def test_providers_do_not_expose_business_workflow_methods(self):
        provider = get_provider(self.make_config("qwen"))

        for method_name in [
            "remember_chat",
            "generate_chat",
            "analyze_image",
            "remember_outfit_chat",
            "generate_outfit_chat",
            "analyze_outfit_image",
        ]:
            self.assertFalse(hasattr(provider, method_name), method_name)

    def test_custom_provider_uses_openai_compatible_adapter_with_display_name(self):
        provider = get_provider(self.make_config("custom", provider_name="siliconflow"))

        self.assertIsInstance(provider, OpenAICompatibleProvider)
        self.assertEqual(provider.provider_id, "custom")
        self.assertEqual(provider.name, "siliconflow")

    def test_unknown_provider_is_rejected_by_schema(self):
        with self.assertRaises(ValidationError):
            self.make_config("siliconflow")

    def test_provider_list_keeps_compatible_shape_and_adds_capabilities(self):
        result = list_providers()

        self.assertIn(result["default_provider"], {"qwen", "doubao", "openai", "custom"})
        self.assertGreaterEqual(len(result["providers"]), 4)
        qwen = next(item for item in result["providers"] if item["id"] == "qwen")
        self.assertEqual(qwen["label"], "Qwen")
        self.assertIn("vision", qwen["capabilities"])
        self.assertTrue(qwen["requires_api_key"])


class OpenAICompatibleAdapterTests(unittest.TestCase):
    def test_adapter_builds_url_headers_and_payload(self):
        runtime_config = ProviderRuntimeConfig.from_llm_config(
            LLMConfig.model_validate(
                {
                    "provider": "openai",
                    "model": "gpt-test",
                    "api_key": "sk-test",
                    "base_url": "https://api.example.test/v1///",
                }
            )
        )
        provider = OpenAICompatibleProvider(runtime_config)
        messages = [{"role": "user", "content": "hello"}]

        self.assertEqual(provider.completion_url(), "https://api.example.test/v1/chat/completions")
        self.assertEqual(
            provider.build_headers(),
            {"Authorization": "Bearer sk-test", "Content-Type": "application/json"},
        )
        self.assertEqual(
            provider.build_payload(messages),
            {
                "model": "gpt-test",
                "messages": messages,
                "temperature": 0.2,
                "max_tokens": 1200,
            },
        )


if __name__ == "__main__":
    unittest.main()
