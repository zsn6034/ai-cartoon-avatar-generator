import type { AnalysisResponse, ChatMemory, ChatMessage, ChatRememberResponse, LLMConfig } from "../types/face";

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

function apiUrl(path: string) {
  return `${apiBaseUrl}${path}`;
}

export async function getProviders() {
  const response = await fetch(apiUrl("/api/providers"));
  if (!response.ok) throw new Error("无法获取 Provider 列表");
  return response.json() as Promise<{
    default_provider: string;
    providers: Array<{ id: string; label: string; model: string; base_url: string; configured: boolean }>;
  }>;
}

function toServerConfig(config: LLMConfig) {
  return {
    provider: config.provider,
    model: config.model,
    api_key: config.apiKey,
    base_url: config.baseUrl
  };
}

export async function analyzeImage(llmConfig: LLMConfig, file: File): Promise<AnalysisResponse> {
  const body = new FormData();
  body.append("llm_config", JSON.stringify(toServerConfig(llmConfig)));
  body.append("image", file);
  const response = await fetch(apiUrl("/api/analyze/image"), { method: "POST", body });
  if (!response.ok) {
    const message = response.status === 413 ? "图片超过 5MB 限制" : "图片分析失败";
    throw new Error(message);
  }
  return response.json();
}

export async function rememberChat(
  llmConfig: LLMConfig,
  messages: ChatMessage[],
  currentMemory: ChatMemory
): Promise<ChatRememberResponse> {
  const response = await fetch(apiUrl("/api/chat/remember"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      llm_config: toServerConfig(llmConfig),
      messages,
      current_memory: currentMemory
    })
  });
  if (!response.ok) throw new Error("对话记忆更新失败");
  return response.json();
}

export async function generateFromChat(llmConfig: LLMConfig, messages: ChatMessage[], chatMemory: ChatMemory): Promise<AnalysisResponse> {
  const response = await fetch(apiUrl("/api/chat/generate"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      llm_config: toServerConfig(llmConfig),
      messages,
      chat_memory: chatMemory
    })
  });
  if (!response.ok) throw new Error("头像生成失败");
  return response.json();
}
