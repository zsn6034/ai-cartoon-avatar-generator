import { RotateCcw, Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getProviders } from "../api/faceAnalysis";
import { analyzeOutfitImage, generateOutfitFromChat, rememberOutfitChat } from "../api/outfitAnalysis";
import { InputPanel } from "../components/InputPanel";
import { LLMConfigPanel } from "../components/LLMConfigPanel";
import { OutfitFeatureEditor } from "../components/outfit/OutfitFeatureEditor";
import { OutfitGenerationHistory } from "../components/outfit/OutfitGenerationHistory";
import { OutfitPreviewPanel } from "../components/outfit/OutfitPreviewPanel";
import { OutfitReasonPanel } from "../components/outfit/OutfitReasonPanel";
import { formatLLMConfigSummary, getLLMConfigError, useLLMConfig } from "../llmConfig";
import { defaultOutfitChatMemory, defaultOutfitFeatures } from "../outfitRegistry/schema";
import { addOutfitGenerationRecord, deleteOutfitGenerationRecord, listOutfitGenerationRecords } from "../storage/outfitDraftDb";
import type {
  ChatMessage,
  InputMode,
  LLMConfig,
  OutfitAction,
  OutfitAnalysisResponse,
  OutfitChatMemory,
  OutfitGenerationRecord,
  OutfitSelection
} from "../types/outfit";
const defaultAction: OutfitAction = "idle";

type Props = {
  onOpenAvatar: () => void;
};

function sortOutfitGenerationRecords(records: OutfitGenerationRecord[]) {
  return [...records].sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
}

export function OutfitChangePage({ onOpenAvatar }: Props) {
  const { llmConfig, providers, configPanelOpen, setConfigPanelOpen, applyProviderResponse, saveLLMConfig } = useLLMConfig();
  const [mode, setMode] = useState<InputMode>("image");
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatMemory, setChatMemory] = useState<OutfitChatMemory>(defaultOutfitChatMemory);
  const [analysis, setAnalysis] = useState<OutfitAnalysisResponse | undefined>();
  const [generatedSelection, setGeneratedSelection] = useState<OutfitSelection>(defaultOutfitFeatures);
  const [currentSelection, setCurrentSelection] = useState<OutfitSelection>(defaultOutfitFeatures);
  const [action, setAction] = useState<OutfitAction>(defaultAction);
  const [generationRecords, setGenerationRecords] = useState<OutfitGenerationRecord[]>([]);
  const [busy, setBusy] = useState(false);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const operationIdRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      const [providerResult, recordsResult] = await Promise.allSettled([getProviders(), listOutfitGenerationRecords()]);
      if (cancelled) return;

      if (providerResult.status === "fulfilled") {
        applyProviderResponse(providerResult.value);
      }

      if (recordsResult.status === "fulfilled") {
        setGenerationRecords(recordsResult.value);
      }
    }

    initialize().catch(() => undefined);

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

  function applyAnalysis(result: OutfitAnalysisResponse) {
    setAnalysis(result);
    setGeneratedSelection(result.features);
    setCurrentSelection(result.features);
    return result.features;
  }

  async function persistGenerationRecord(record: OutfitGenerationRecord) {
    setGenerationRecords((records) => [record, ...records.filter((item) => item.id !== record.id)]);
    try {
      await addOutfitGenerationRecord(record);
    } catch (caught) {
      setError(caught instanceof Error ? `生成成功，但记录保存失败：${caught.message}` : "生成成功，但记录保存失败");
    }
  }

  function createGenerationRecord(
    result: OutfitAnalysisResponse,
    selection: OutfitSelection,
    options: {
      sourceMode: InputMode;
      action: OutfitAction;
      uploadedImageDataUrl?: string;
      messages?: ChatMessage[];
      chatMemory?: OutfitChatMemory;
    }
  ): OutfitGenerationRecord {
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
      action: options.action,
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
      const result = await analyzeOutfitImage(llmConfig, file);
      if (!isCurrentOperation(operationId)) return;
      const selection = applyAnalysis(result);
      await persistGenerationRecord(
        createGenerationRecord(result, selection, {
          sourceMode: "image",
          action,
          uploadedImageDataUrl: dataUrl
        })
      );
    } catch (caught) {
      if (!isCurrentOperation(operationId)) return;
      setError(caught instanceof Error ? caught.message : "3D 换装图片分析失败");
      setAnalysis(undefined);
      setGeneratedSelection(defaultOutfitFeatures);
      setCurrentSelection(defaultOutfitFeatures);
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
      const result = await rememberOutfitChat(llmConfig, nextMessages, chatMemory);
      if (!isCurrentOperation(operationId)) return;
      setMessages([...nextMessages, { role: "assistant", content: result.assistant_message }]);
      setChatMemory(result.chat_memory);
    } catch (caught) {
      if (!isCurrentOperation(operationId)) return;
      setError(caught instanceof Error ? caught.message : "3D 换装对话记忆更新失败");
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
      const result = await generateOutfitFromChat(llmConfig, messages, chatMemory);
      if (!isCurrentOperation(operationId)) return;
      const nextMessages: ChatMessage[] = [...messages, { role: "assistant", content: result.assistant_message }];
      setMessages(nextMessages);
      const selection = applyAnalysis(result);
      await persistGenerationRecord(
        createGenerationRecord(result, selection, {
          sourceMode: "chat",
          action,
          messages: nextMessages,
          chatMemory
        })
      );
    } catch (caught) {
      if (!isCurrentOperation(operationId)) return;
      setError(caught instanceof Error ? caught.message : "3D 换装生成失败");
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
    setChatMemory(defaultOutfitChatMemory);
    setAnalysis(undefined);
    setGeneratedSelection(defaultOutfitFeatures);
    setCurrentSelection(defaultOutfitFeatures);
    setAction(defaultAction);
    setError(undefined);
    setBusy(false);
    setPreviewBusy(false);
  }

  function handleRecordSelect(record: OutfitGenerationRecord) {
    beginOperation();
    setMode(record.sourceMode);
    if (record.sourceMode === "image") {
      setImageDataUrl(record.uploadedImageDataUrl);
      setMessages([]);
      setChatMemory(defaultOutfitChatMemory);
    } else {
      setImageDataUrl(undefined);
      setMessages(record.messages ?? []);
      setChatMemory(record.chatMemory ?? defaultOutfitChatMemory);
    }
    setAnalysis(record.analysis);
    setGeneratedSelection(record.generatedSelection);
    setCurrentSelection(record.currentSelection);
    setAction(record.action);
    setError(undefined);
    setBusy(false);
    setPreviewBusy(false);
  }

  async function handleRecordDelete(record: OutfitGenerationRecord) {
    setGenerationRecords((records) => records.filter((item) => item.id !== record.id));
    try {
      await deleteOutfitGenerationRecord(record.id);
    } catch (caught) {
      setGenerationRecords((records) => sortOutfitGenerationRecords([...records, record]));
      setError(caught instanceof Error ? `删除记录失败：${caught.message}` : "删除记录失败");
    }
  }

  function handleLLMConfigSave(config: LLMConfig) {
    saveLLMConfig(config);
    setError(undefined);
  }

  const previewLoadingLabel = mode === "image" ? "分析图片并匹配 3D 资产中..." : "生成 3D 搭配中...";
  const configSummary = formatLLMConfigSummary(llmConfig);

  return (
    <main className="app-shell outfit-shell">
      <header className="app-header">
        <div>
          <h1>AI 3D 换装</h1>
          <p>从照片或自由描述匹配 Messenger 3D 角色资产，并预览骨骼动作。</p>
        </div>
        <div className="header-controls">
          <button className="page-nav-link" type="button" onClick={onOpenAvatar} title="打开 2D 头像生成">
            2D 头像
          </button>
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
        <OutfitPreviewPanel outfit={currentSelection} action={action} loading={previewBusy} loadingLabel={previewLoadingLabel} onActionChange={setAction} />
        <aside className="panel inspector">
          <OutfitGenerationHistory records={generationRecords} onSelect={handleRecordSelect} onDelete={handleRecordDelete} />
          <OutfitFeatureEditor value={currentSelection} aiValue={generatedSelection} confidence={analysis?.confidence ?? {}} onChange={setCurrentSelection} />
          <OutfitReasonPanel analysis={analysis} aiSelection={generatedSelection} currentSelection={currentSelection} />
        </aside>
      </div>
    </main>
  );
}
