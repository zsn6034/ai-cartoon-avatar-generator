import { useCallback, useState } from "react";
import type { LLMConfig, ProviderId, ProviderListResponse, ProviderPreset, ProviderPresetResponse } from "./types/face";

export const LLM_CONFIG_STORAGE_KEY = "ai-cartoon-avatar.llm-config";

const providerIds = ["qwen", "doubao", "openai", "custom"] as const satisfies readonly ProviderId[];

export const defaultProviders: ProviderPreset[] = [
  { id: "qwen", label: "Qwen", model: "qwen-vl-plus", baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1", configured: false },
  { id: "doubao", label: "Doubao", model: "doubao-1-5-vision-pro-32k-250115", baseUrl: "https://ark.cn-beijing.volces.com/api/v3", configured: false },
  { id: "openai", label: "OpenAI", model: "gpt-4o-mini", baseUrl: "https://api.openai.com/v1", configured: false },
  { id: "custom", label: "Custom", model: "", baseUrl: "", configured: false }
];

function isProviderId(value: unknown): value is ProviderId {
  return typeof value === "string" && providerIds.includes(value as ProviderId);
}

function normalizeProviderId(value: unknown): ProviderId {
  return isProviderId(value) ? value : "custom";
}

export function normalizeProviderPreset(provider: ProviderPresetResponse): ProviderPreset {
  return {
    id: normalizeProviderId(provider.id),
    label: provider.label,
    model: provider.model,
    baseUrl: provider.base_url ?? "",
    configured: provider.configured,
    capabilities: provider.capabilities,
    requiresApiKey: provider.requires_api_key,
    supportsCustomBaseUrl: provider.supports_custom_base_url
  };
}

export function createConfigFromPreset(providerId: string, presets: ProviderPreset[]): LLMConfig {
  const normalizedProvider = isProviderId(providerId) ? providerId : "qwen";
  const preset = presets.find((item) => item.id === normalizedProvider) ?? presets[0];
  return {
    provider: preset?.id ?? "qwen",
    model: preset?.model ?? "qwen-vl-plus",
    apiKey: "",
    baseUrl: preset?.baseUrl ?? "https://dashscope.aliyuncs.com/compatible-mode/v1"
  };
}

export function readStoredLLMConfig(): LLMConfig | undefined {
  try {
    const raw = localStorage.getItem(LLM_CONFIG_STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (
      typeof parsed.provider !== "string" ||
      typeof parsed.model !== "string" ||
      typeof parsed.apiKey !== "string" ||
      typeof parsed.baseUrl !== "string"
    ) {
      return undefined;
    }

    const rawProvider = parsed.provider;
    const provider = normalizeProviderId(rawProvider);
    const storedProviderName = typeof parsed.providerName === "string" ? parsed.providerName.trim() : "";
    const migratedProviderName = provider === "custom" && !isProviderId(rawProvider) ? rawProvider.trim() : "";

    return {
      provider,
      providerName: storedProviderName || migratedProviderName || undefined,
      model: parsed.model,
      apiKey: parsed.apiKey,
      baseUrl: parsed.baseUrl
    };
  } catch {
    return undefined;
  }
}

export function persistLLMConfig(config: LLMConfig) {
  localStorage.setItem(LLM_CONFIG_STORAGE_KEY, JSON.stringify(config));
}

export function getLLMConfigError(config: LLMConfig) {
  if (!config.provider.trim()) return "请先配置 Provider";
  if (!config.model.trim()) return "请先配置 Model";
  if (!config.apiKey.trim()) return "请先配置 API Key";
  if (!config.baseUrl.trim()) return "请先配置 Base URL";
  return undefined;
}

export function formatLLMConfigSummary(config: LLMConfig) {
  const providerLabel = config.provider === "custom" && config.providerName ? config.providerName : config.provider;
  return `${providerLabel || "未配置"} · ${config.model || "未配置模型"}`;
}

export function useLLMConfig() {
  const [llmConfig, setLlmConfig] = useState<LLMConfig>(() => readStoredLLMConfig() ?? createConfigFromPreset("qwen", defaultProviders));
  const [providers, setProviders] = useState<ProviderPreset[]>(defaultProviders);
  const [configPanelOpen, setConfigPanelOpen] = useState(false);

  const applyProviderResponse = useCallback((result: ProviderListResponse) => {
    const nextProviders = result.providers.map(normalizeProviderPreset);
    setProviders(nextProviders);
    if (!readStoredLLMConfig()) {
      setLlmConfig(createConfigFromPreset(result.default_provider, nextProviders));
    }
  }, []);

  const saveLLMConfig = useCallback((config: LLMConfig) => {
    setLlmConfig(config);
    persistLLMConfig(config);
    setConfigPanelOpen(false);
  }, []);

  return {
    llmConfig,
    providers,
    configPanelOpen,
    setConfigPanelOpen,
    applyProviderResponse,
    saveLLMConfig
  };
}
