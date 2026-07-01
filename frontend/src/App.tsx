import { useEffect, useState } from "react";
import { analyzeChat, analyzeImage, getProviders } from "./api/faceAnalysis";
import { defaultFeatures } from "./assetsRegistry/schema";
import { mapFeaturesToSelection } from "./assetsRegistry/mapping";
import { FeatureEditor } from "./components/FeatureEditor";
import { InputPanel } from "./components/InputPanel";
import { PreviewPanel } from "./components/PreviewPanel";
import { ProviderSelect } from "./components/ProviderSelect";
import { ReasonPanel } from "./components/ReasonPanel";
import { loadDraft, saveDraft } from "./storage/avatarDraftDb";
import type { AnalysisResponse, AvatarSelection, ChatMessage, InputMode, PartialFaceFeatures, ProviderId } from "./types/face";

const defaultProviders = [
  { id: "qwen" as ProviderId, label: "Qwen", model: "qwen-vl-plus", configured: false },
  { id: "doubao" as ProviderId, label: "Doubao", model: "doubao", configured: false }
];

export default function App() {
  const [provider, setProvider] = useState<ProviderId>("qwen");
  const [providers, setProviders] = useState(defaultProviders);
  const [mode, setMode] = useState<InputMode>("image");
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [features, setFeatures] = useState<PartialFaceFeatures>(defaultFeatures);
  const [analysis, setAnalysis] = useState<AnalysisResponse | undefined>();
  const [aiSelection, setAiSelection] = useState<AvatarSelection>(defaultFeatures);
  const [currentSelection, setCurrentSelection] = useState<AvatarSelection>(defaultFeatures);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    getProviders()
      .then((result) => {
        setProviders(result.providers);
        setProvider(result.default_provider);
      })
      .catch(() => undefined);
    loadDraft()
      .then((draft) => {
        if (!draft) return;
        setProvider(draft.provider);
        setMode(draft.inputMode);
        setImageDataUrl(draft.imageDataUrl);
        setMessages(draft.chatMessages);
        setFeatures(draft.features);
        setAiSelection(draft.aiRecommendedSelection);
        setCurrentSelection(draft.currentSelection);
        setAnalysis(draft.analysis);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    saveDraft({
      inputMode: mode,
      chatMessages: messages,
      imageDataUrl,
      features,
      aiRecommendedSelection: aiSelection,
      currentSelection,
      analysis,
      provider,
      updatedAt: new Date().toISOString()
    }).catch(() => undefined);
  }, [mode, messages, imageDataUrl, features, aiSelection, currentSelection, analysis, provider]);

  function applyAnalysis(result: AnalysisResponse) {
    const nextFeatures = { ...features, ...result.features };
    const nextSelection = mapFeaturesToSelection(nextFeatures);
    setFeatures(nextFeatures);
    setAnalysis(result);
    setAiSelection(nextSelection);
    setCurrentSelection(nextSelection);
  }

  async function handleImageUpload(file: File, dataUrl: string) {
    setBusy(true);
    setError(undefined);
    setMode("image");
    setImageDataUrl(dataUrl);
    try {
      const result = await analyzeImage(provider, file);
      applyAnalysis(result);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "图片分析失败");
      const fallback = mapFeaturesToSelection(defaultFeatures);
      setAiSelection(fallback);
      setCurrentSelection(fallback);
    } finally {
      setBusy(false);
    }
  }

  async function handleChatSend(message: string) {
    setBusy(true);
    setError(undefined);
    setMode("chat");
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: message }];
    const nextRoundIndex = Math.min(3, nextMessages.filter((item) => item.role === "user").length);
    setMessages(nextMessages);
    try {
      const result = await analyzeChat(provider, nextMessages, features, nextRoundIndex);
      setMessages([...nextMessages, { role: "assistant", content: result.assistant_message }]);
      applyAnalysis(result);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "聊天分析失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <h1>AI 卡通头像生成器</h1>
          <p>从照片或自由描述提取脸部特征，用可解释规则组合 2D canvas 头像。</p>
        </div>
        <ProviderSelect value={provider} providers={providers} onChange={setProvider} />
      </header>

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
        />
        <PreviewPanel avatar={currentSelection} />
        <aside className="panel inspector">
          <FeatureEditor value={currentSelection} aiValue={aiSelection} confidence={analysis?.confidence ?? {}} onChange={setCurrentSelection} />
          <ReasonPanel analysis={analysis} aiSelection={aiSelection} currentSelection={currentSelection} />
        </aside>
      </div>
    </main>
  );
}
