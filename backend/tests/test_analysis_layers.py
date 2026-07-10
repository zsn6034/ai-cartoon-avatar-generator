import asyncio
import logging
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

logging.getLogger("uvicorn.error").disabled = True

from app.domain import avatar as avatar_domain
from app.domain import outfit as outfit_domain
from app.schemas.face import ChatMemory
from app.schemas.outfit import OutfitChatMemory, PartialOutfitFeatures
from app.services.avatar_analysis import AvatarAnalysisService
from app.services.outfit_analysis import OutfitAnalysisService


class FakeProvider:
    def __init__(self, configured=True, payload=None, error: Exception | None = None, name="fake-provider"):
        self.name = name
        self.configured = configured
        self.payload = payload or {}
        self.error = error
        self.calls = []

    async def json_completion(self, messages):
        self.calls.append(messages)
        if self.error:
            raise self.error
        return self.payload


class AvatarDomainTests(unittest.TestCase):
    def test_normalize_response_filters_invalid_values_and_applies_defaults(self):
        result = avatar_domain.normalize_analysis_response(
            {
                "features": {"hair": "bad-hair", "eyes": "variant02"},
                "confidence": {"eyes": 0.9},
            },
            "fake-provider",
        )

        self.assertEqual(result.provider, "fake-provider")
        self.assertEqual(result.features.hair, "short01")
        self.assertEqual(result.features.eyes, "variant02")
        self.assertIn("hair", result.defaults_applied)
        self.assertEqual(result.confidence["eyes"], 0.9)

    def test_memory_notes_are_merged_and_deduped(self):
        memory = ChatMemory(notes=["黑色短发"])
        result = avatar_domain.remember_locally(
            memory,
            [{"role": "user", "content": "黑色短发"}, {"role": "user", "content": "戴圆框眼镜"}],
            "fake-provider",
        )

        self.assertEqual(result.chat_memory.notes, ["黑色短发", "戴圆框眼镜"])
        self.assertIn("戴圆框眼镜", result.chat_memory.summary)


class OutfitDomainTests(unittest.TestCase):
    def test_fallback_preserves_known_outfit_features(self):
        result = outfit_domain.fallback_analysis(
            "fallback reason",
            "fake-provider",
            PartialOutfitFeatures(top="top5"),
        )

        self.assertEqual(result.provider, "fake-provider")
        self.assertEqual(result.features.top, "top5")
        self.assertEqual(result.features.hair, "hair1")
        self.assertNotIn("top", result.defaults_applied)


class AvatarServiceTests(unittest.TestCase):
    def test_remember_chat_does_not_call_model(self):
        provider = FakeProvider()
        service = AvatarAnalysisService(provider)

        result = asyncio.run(service.remember_chat([{"role": "user", "content": "短发"}], {}))

        self.assertEqual(provider.calls, [])
        self.assertEqual(result.provider, "fake-provider")
        self.assertIn("短发", result.chat_memory.notes)

    def test_generate_chat_calls_provider_and_normalizes_result(self):
        provider = FakeProvider(payload={"features": {"hair": "short02"}})
        service = AvatarAnalysisService(provider)

        result = asyncio.run(service.generate_chat([{"role": "user", "content": "短发"}], {}))

        self.assertEqual(len(provider.calls), 1)
        self.assertEqual(provider.calls[0][0]["role"], "system")
        self.assertEqual(result.features.hair, "short02")

    def test_generate_chat_uses_fallback_when_provider_is_not_configured(self):
        provider = FakeProvider(configured=False)
        service = AvatarAnalysisService(provider)

        result = asyncio.run(service.generate_chat([{"role": "user", "content": "短发"}], {}))

        self.assertEqual(provider.calls, [])
        self.assertEqual(result.features.hair, "short01")

    def test_analyze_image_uses_fallback_after_model_error(self):
        provider = FakeProvider(error=RuntimeError("boom"))
        service = AvatarAnalysisService(provider)

        result = asyncio.run(service.analyze_image("data:image/png;base64,abc"))

        self.assertEqual(len(provider.calls), 1)
        self.assertEqual(result.features.hair, "short01")


class OutfitServiceTests(unittest.TestCase):
    def test_remember_chat_does_not_call_model(self):
        provider = FakeProvider()
        service = OutfitAnalysisService(provider)

        result = asyncio.run(service.remember_chat([{"role": "user", "content": "黑色上衣"}], {}))

        self.assertEqual(provider.calls, [])
        self.assertEqual(result.provider, "fake-provider")
        self.assertIn("黑色上衣", result.chat_memory.notes)

    def test_generate_chat_calls_provider_and_normalizes_result(self):
        provider = FakeProvider(payload={"features": {"top": "top5"}})
        service = OutfitAnalysisService(provider)

        result = asyncio.run(service.generate_chat([{"role": "user", "content": "黑色上衣"}], {}))

        self.assertEqual(len(provider.calls), 1)
        self.assertEqual(provider.calls[0][0]["role"], "system")
        self.assertEqual(result.features.top, "top5")

    def test_generate_chat_uses_fallback_when_provider_is_not_configured(self):
        provider = FakeProvider(configured=False)
        service = OutfitAnalysisService(provider)

        result = asyncio.run(service.generate_chat([{"role": "user", "content": "黑色上衣"}], {}))

        self.assertEqual(provider.calls, [])
        self.assertEqual(result.features.top, "top1")

    def test_outfit_memory_notes_are_merged_and_deduped(self):
        memory = OutfitChatMemory(notes=["黑色上衣"])
        result = outfit_domain.remember_locally(
            memory,
            [{"role": "user", "content": "黑色上衣"}, {"role": "user", "content": "深色鞋"}],
            "fake-provider",
        )

        self.assertEqual(result.chat_memory.notes, ["黑色上衣", "深色鞋"])


if __name__ == "__main__":
    unittest.main()
