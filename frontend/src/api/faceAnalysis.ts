import type { AnalysisResponse, ChatMemory, ChatMessage, ChatRememberResponse, ProviderId } from "../types/face";

export async function getProviders() {
  const response = await fetch("/api/providers");
  if (!response.ok) throw new Error("无法获取 Provider 列表");
  return response.json() as Promise<{
    default_provider: ProviderId;
    providers: Array<{ id: ProviderId; label: string; model: string; configured: boolean }>;
  }>;
}

export async function analyzeImage(provider: ProviderId, file: File): Promise<AnalysisResponse> {
  const body = new FormData();
  body.append("provider", provider);
  body.append("image", file);
  const response = await fetch("/api/analyze/image", { method: "POST", body });
  if (!response.ok) {
    const message = response.status === 413 ? "图片超过 5MB 限制" : "图片分析失败";
    throw new Error(message);
  }
  return response.json();
}

export async function rememberChat(
  provider: ProviderId,
  messages: ChatMessage[],
  currentMemory: ChatMemory
): Promise<ChatRememberResponse> {
  const response = await fetch("/api/chat/remember", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      provider,
      messages,
      current_memory: currentMemory
    })
  });
  if (!response.ok) throw new Error("对话记忆更新失败");
  return response.json();
}

export async function generateFromChat(provider: ProviderId, messages: ChatMessage[], chatMemory: ChatMemory): Promise<AnalysisResponse> {
  const response = await fetch("/api/chat/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      provider,
      messages,
      chat_memory: chatMemory
    })
  });
  if (!response.ok) throw new Error("头像生成失败");
  return response.json();
}
