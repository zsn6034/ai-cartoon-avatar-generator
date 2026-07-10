import type { ChatMessage, LLMConfig, OutfitAnalysisResponse, OutfitChatMemory, OutfitChatRememberResponse } from "../types/outfit";

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

function apiUrl(path: string) {
  return `${apiBaseUrl}${path}`;
}

function toServerConfig(config: LLMConfig) {
  return {
    provider: config.provider,
    provider_name: config.providerName,
    model: config.model,
    api_key: config.apiKey,
    base_url: config.baseUrl
  };
}

export async function analyzeOutfitImage(llmConfig: LLMConfig, file: File): Promise<OutfitAnalysisResponse> {
  const body = new FormData();
  body.append("llm_config", JSON.stringify(toServerConfig(llmConfig)));
  body.append("image", file);
  const response = await fetch(apiUrl("/api/outfit/analyze/image"), { method: "POST", body });
  if (!response.ok) {
    const message = response.status === 413 ? "图片超过 5MB 限制" : "3D 换装图片分析失败";
    throw new Error(message);
  }
  return response.json();
}

export async function rememberOutfitChat(
  llmConfig: LLMConfig,
  messages: ChatMessage[],
  currentMemory: OutfitChatMemory
): Promise<OutfitChatRememberResponse> {
  const response = await fetch(apiUrl("/api/outfit/chat/remember"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      llm_config: toServerConfig(llmConfig),
      messages,
      current_memory: currentMemory
    })
  });
  if (!response.ok) throw new Error("3D 换装对话记忆更新失败");
  return response.json();
}

export async function generateOutfitFromChat(
  llmConfig: LLMConfig,
  messages: ChatMessage[],
  chatMemory: OutfitChatMemory
): Promise<OutfitAnalysisResponse> {
  const response = await fetch(apiUrl("/api/outfit/chat/generate"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      llm_config: toServerConfig(llmConfig),
      messages,
      chat_memory: chatMemory
    })
  });
  if (!response.ok) throw new Error("3D 换装生成失败");
  return response.json();
}
