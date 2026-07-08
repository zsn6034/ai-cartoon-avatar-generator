import { RotateCcw, Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { analyzeImage, generateFromChat, getProviders, rememberChat } from "./api/faceAnalysis";
import { defaultChatMemory, defaultFeatures } from "./assetsRegistry/schema";
import { completeFeatures } from "./assetsRegistry/mapping";
import { FeatureEditor } from "./components/FeatureEditor";
import { GenerationHistory } from "./components/GenerationHistory";
import { InputPanel } from "./components/InputPanel";
import { LLMConfigPanel } from "./components/LLMConfigPanel";
import { PreviewPanel } from "./components/PreviewPanel";
import { ReasonPanel } from "./components/ReasonPanel";
import { addGenerationRecord, deleteGenerationRecord, listGenerationRecords } from "./storage/avatarDraftDb";
import type { AnalysisResponse, AvatarSelection, ChatMemory, ChatMessage, GenerationRecord, InputMode, LLMConfig, ProviderPreset } from "./types/face";

const LLM_CONFIG_STORAGE_KEY = "ai-cartoon-avatar.llm-config";

const defaultProviders: ProviderPreset[] = [
  { id: "qwen", label: "Qwen", model: "qwen-vl-plus", baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1", configured: false },
  { id: "doubao", label: "Doubao", model: "doubao-1-5-vision-pro-32k-250115", baseUrl: "https://ark.cn-beijing.volces.com/api/v3", configured: false },
  { id: "openai", label: "OpenAI", model: "gpt-4o-mini", baseUrl: "https://api.openai.com/v1", configured: false },
  { id: "custom", label: "Custom", model: "", baseUrl: "", configured: false }
];

function sortGenerationRecords(records: GenerationRecord[]) {
  return [...records].sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
}

function createConfigFromPreset(providerId: string, presets: ProviderPreset[]): LLMConfig {
  const preset = presets.find((item) => item.id === providerId) ?? presets[0];
  return {
    provider: preset?.id ?? "qwen",
    model: preset?.model ?? "qwen-vl-plus",
    apiKey: "",
    baseUrl: preset?.baseUrl ?? "https://dashscope.aliyuncs.com/compatible-mode/v1"
  };
}

function readStoredLLMConfig(): LLMConfig | undefined {
  try {
    const raw = localStorage.getItem(LLM_CONFIG_STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as Partial<LLMConfig>;
    if (
      typeof parsed.provider !== "string" ||
      typeof parsed.model !== "string" ||
      typeof parsed.apiKey !== "string" ||
      typeof parsed.baseUrl !== "string"
    ) {
      return undefined;
    }
    return {
      provider: parsed.provider,
      model: parsed.model,
      apiKey: parsed.apiKey,
      baseUrl: parsed.baseUrl
    };
  } catch {
    return undefined;
  }
}

function persistLLMConfig(config: LLMConfig) {
  localStorage.setItem(LLM_CONFIG_STORAGE_KEY, JSON.stringify(config));
}

function getLLMConfigError(config: LLMConfig) {
  if (!config.provider.trim()) return "请先配置 Provider";
  if (!config.model.trim()) return "请先配置 Model";
  if (!config.apiKey.trim()) return "请先配置 API Key";
  if (!config.baseUrl.trim()) return "请先配置 Base URL";
  return undefined;
}

export default function App() {
  const [llmConfig, setLlmConfig] = useState<LLMConfig>(() => readStoredLLMConfig() ?? createConfigFromPreset("qwen", defaultProviders));
  const [providers, setProviders] = useState<ProviderPreset[]>(defaultProviders);
  const [configPanelOpen, setConfigPanelOpen] = useState(false);
  const [mode, setMode] = useState<InputMode>("image");
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatMemory, setChatMemory] = useState<ChatMemory>(defaultChatMemory);
  const [analysis, setAnalysis] = useState<AnalysisResponse | undefined>();
  const [generatedSelection, setGeneratedSelection] = useState<AvatarSelection>(defaultFeatures);
  const [currentSelection, setCurrentSelection] = useState<AvatarSelection>(defaultFeatures);
  const [generationRecords, setGenerationRecords] = useState<GenerationRecord[]>([]);
  const [busy, setBusy] = useState(false);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const operationIdRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      const [providerResult, recordsResult] = await Promise.allSettled([getProviders(), listGenerationRecords()]);
      if (cancelled) return;

      if (providerResult.status === "fulfilled") {
        const nextProviders = providerResult.value.providers.map((provider) => ({
          ...provider,
          baseUrl: provider.base_url ?? ""
        }));
        setProviders(nextProviders);
        if (!readStoredLLMConfig()) {
          setLlmConfig(createConfigFromPreset(providerResult.value.default_provider, nextProviders));
        }
      }

      if (recordsResult.status === "fulfilled") {
        setGenerationRecords(recordsResult.value);
      }
    }

    initialize().catch(() => {
      if (cancelled) return;
      setProviders(defaultProviders);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  function beginOperation() {
    operationIdRef.current += 1;
    return operationIdRef.current;
  }

  function isCurrentOperation(operationId: number) {
    return operationIdRef.current === operationId;
  }

  function createRecordId() {
    return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function applyAnalysis(result: AnalysisResponse) {
    const nextSelection = completeFeatures(result.features);
    setAnalysis(result);
    setGeneratedSelection(nextSelection);
    setCurrentSelection(nextSelection);
    return nextSelection;
  }

  async function persistGenerationRecord(record: GenerationRecord) {
    setGenerationRecords((records) => [record, ...records.filter((item) => item.id !== record.id)]);
    try {
      await addGenerationRecord(record);
    } catch (caught) {
      setError(caught instanceof Error ? `生成成功，但记录保存失败：${caught.message}` : "生成成功，但记录保存失败");
    }
  }

  function createGenerationRecord(
    result: AnalysisResponse,
    selection: AvatarSelection,
    options: {
      sourceMode: InputMode;
      uploadedImageDataUrl?: string;
      messages?: ChatMessage[];
      chatMemory?: ChatMemory;
    }
  ): GenerationRecord {
    return {
      id: createRecordId(),
      createdAt: new Date().toISOString(),
      sourceMode: options.sourceMode,
      provider: result.provider,
      uploadedImageDataUrl: options.uploadedImageDataUrl,
      messages: options.messages,
      chatMemory: options.chatMemory,
      features: result.features,
      generatedSelection: selection,
      currentSelection: selection,
      analysis: result
    };
  }

  async function handleImageUpload(file: File, dataUrl: string) {
    const configError = getLLMConfigError(llmConfig);
    if (configError) {
      setError(configError);
      setConfigPanelOpen(true);
      return;
    }
    const operationId = beginOperation();
    setBusy(true);
    setPreviewBusy(true);
    setError(undefined);
    setMode("image");
    setImageDataUrl(dataUrl);
    try {
      const result = await analyzeImage(llmConfig, file);
      if (!isCurrentOperation(operationId)) return;
      const selection = applyAnalysis(result);
      await persistGenerationRecord(
        createGenerationRecord(result, selection, {
          sourceMode: "image",
          uploadedImageDataUrl: dataUrl
        })
      );
    } catch (caught) {
      if (!isCurrentOperation(operationId)) return;
      setError(caught instanceof Error ? caught.message : "图片分析失败");
      const fallback = completeFeatures(defaultFeatures);
      setAnalysis(undefined);
      setGeneratedSelection(fallback);
      setCurrentSelection(fallback);
    } finally {
      if (isCurrentOperation(operationId)) {
        setPreviewBusy(false);
        setBusy(false);
      }
    }
  }

  async function handleChatSend(message: string) {
    const configError = getLLMConfigError(llmConfig);
    if (configError) {
      setError(configError);
      setConfigPanelOpen(true);
      return;
    }
    const operationId = beginOperation();
    setBusy(true);
    setError(undefined);
    setMode("chat");
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: message }];
    setMessages(nextMessages);
    try {
      const result = await rememberChat(llmConfig, nextMessages, chatMemory);
      if (!isCurrentOperation(operationId)) return;
      setMessages([...nextMessages, { role: "assistant", content: result.assistant_message }]);
      setChatMemory(result.chat_memory);
    } catch (caught) {
      if (!isCurrentOperation(operationId)) return;
      setError(caught instanceof Error ? caught.message : "对话记忆更新失败");
    } finally {
      if (isCurrentOperation(operationId)) {
        setBusy(false);
      }
    }
  }

  async function handleChatGenerate() {
    if (!messages.some((message) => message.role === "user")) return;
    const configError = getLLMConfigError(llmConfig);
    if (configError) {
      setError(configError);
      setConfigPanelOpen(true);
      return;
    }
    const operationId = beginOperation();
    setBusy(true);
    setPreviewBusy(true);
    setError(undefined);
    setMode("chat");
    try {
      const result = await generateFromChat(llmConfig, messages, chatMemory);
      if (!isCurrentOperation(operationId)) return;
      const nextMessages: ChatMessage[] = [...messages, { role: "assistant", content: result.assistant_message }];
      setMessages(nextMessages);
      const selection = applyAnalysis(result);
      await persistGenerationRecord(
        createGenerationRecord(result, selection, {
          sourceMode: "chat",
          messages: nextMessages,
          chatMemory
        })
      );
    } catch (caught) {
      if (!isCurrentOperation(operationId)) return;
      setError(caught instanceof Error ? caught.message : "头像生成失败");
    } finally {
      if (isCurrentOperation(operationId)) {
        setPreviewBusy(false);
        setBusy(false);
      }
    }
  }

  function handleWorkspaceReset() {
    beginOperation();
    setMode("image");
    setImageDataUrl(undefined);
    setMessages([]);
    setChatMemory(defaultChatMemory);
    setAnalysis(undefined);
    setGeneratedSelection(defaultFeatures);
    setCurrentSelection(defaultFeatures);
    setError(undefined);
    setBusy(false);
    setPreviewBusy(false);
  }

  function handleRecordSelect(record: GenerationRecord) {
    beginOperation();
    setMode(record.sourceMode);
    if (record.sourceMode === "image") {
      setImageDataUrl(record.uploadedImageDataUrl);
      setMessages([]);
      setChatMemory(defaultChatMemory);
    } else {
      setImageDataUrl(undefined);
      setMessages(record.messages ?? []);
      setChatMemory(record.chatMemory ?? defaultChatMemory);
    }
    setAnalysis(record.analysis);
    setGeneratedSelection(record.generatedSelection);
    setCurrentSelection(record.currentSelection);
    setError(undefined);
    setBusy(false);
    setPreviewBusy(false);
  }

  async function handleRecordDelete(record: GenerationRecord) {
    setGenerationRecords((records) => records.filter((item) => item.id !== record.id));
    try {
      await deleteGenerationRecord(record.id);
    } catch (caught) {
      setGenerationRecords((records) => sortGenerationRecords([...records, record]));
      setError(caught instanceof Error ? `删除记录失败：${caught.message}` : "删除记录失败");
    }
  }

  function handleLLMConfigSave(config: LLMConfig) {
    setLlmConfig(config);
    persistLLMConfig(config);
    setConfigPanelOpen(false);
    setError(undefined);
  }

  const previewLoadingLabel = mode === "image" ? "分析图片中..." : "生成头像中...";
  const configSummary = `${llmConfig.provider || "未配置"} · ${llmConfig.model || "未配置模型"}`;

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <h1>AI 卡通头像生成器</h1>
          <p>从照片或自由描述生成 DiceBear Adventurer 风格的 SVG 部件头像。</p>
        </div>
        <div className="header-controls">
          <button className="workspace-reset" type="button" onClick={handleWorkspaceReset} title="重置当前工作区">
            <RotateCcw size={17} />
            重置
          </button>
          <button className="llm-config-trigger" type="button" onClick={() => setConfigPanelOpen(true)} title="配置 LLM">
            <Settings size={17} />
            <span>{configSummary}</span>
          </button>
        </div>
      </header>

      <LLMConfigPanel config={llmConfig} open={configPanelOpen} presets={providers} onClose={() => setConfigPanelOpen(false)} onSave={handleLLMConfigSave} />

      {error && <div className="error-banner">{error}</div>}

      <div className="workspace">
        <InputPanel
          mode={mode}
          imageDataUrl={imageDataUrl}
          messages={messages}
          busy={busy}
          onModeChange={setMode}
          onImageUpload={handleImageUpload}
          onChatSend={handleChatSend}
          onChatGenerate={handleChatGenerate}
          onChatReset={handleWorkspaceReset}
        />
        <PreviewPanel avatar={currentSelection} loading={previewBusy} loadingLabel={previewLoadingLabel} />
        <aside className="panel inspector">
          <GenerationHistory records={generationRecords} onSelect={handleRecordSelect} onDelete={handleRecordDelete} />
          <FeatureEditor value={currentSelection} aiValue={generatedSelection} confidence={analysis?.confidence ?? {}} onChange={setCurrentSelection} />
          <ReasonPanel analysis={analysis} aiSelection={generatedSelection} currentSelection={currentSelection} />
        </aside>
      </div>
    </main>
  );
}
