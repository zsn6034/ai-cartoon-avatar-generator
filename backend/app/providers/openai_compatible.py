from app.providers.chat_completions import ChatCompletionsAdapter


class OpenAICompatibleProvider(ChatCompletionsAdapter):
    name = "openai-compatible"
