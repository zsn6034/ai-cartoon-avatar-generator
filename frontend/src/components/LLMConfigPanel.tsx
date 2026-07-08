import { Settings, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { LLMConfig, ProviderPreset } from "../types/face";

type Props = {
  config: LLMConfig;
  open: boolean;
  presets: ProviderPreset[];
  onClose: () => void;
  onSave: (config: LLMConfig) => void;
};

function normalizeConfig(config: LLMConfig): LLMConfig {
  return {
    provider: config.provider.trim(),
    model: config.model.trim(),
    apiKey: config.apiKey.trim(),
    baseUrl: config.baseUrl.trim().replace(/\/+$/, "")
  };
}

export function LLMConfigPanel({ config, open, presets, onClose, onSave }: Props) {
  const [draft, setDraft] = useState<LLMConfig>(config);

  useEffect(() => {
    if (open) setDraft(config);
  }, [config, open]);

  if (!open) return null;

  const selectedPreset = presets.find((preset) => preset.id === draft.provider);
  const selectedId = selectedPreset ? selectedPreset.id : "custom";

  function applyPreset(providerId: string) {
    const preset = presets.find((item) => item.id === providerId);
    if (!preset || providerId === "custom") {
      setDraft((current) => ({ ...current, provider: providerId === "custom" ? "" : providerId }));
      return;
    }
    setDraft((current) => ({
      ...current,
      provider: preset.id,
      model: preset.model,
      baseUrl: preset.baseUrl
    }));
  }

  function save() {
    onSave(normalizeConfig(draft));
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="llm-modal" role="dialog" aria-modal="true" aria-labelledby="llm-config-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-heading">
          <div>
            <h2 id="llm-config-title">LLM 配置</h2>
            <p>选择预设或填写 OpenAI-compatible 服务。</p>
          </div>
          <button type="button" className="icon-button" onClick={onClose} title="关闭">
            <X size={18} />
          </button>
        </div>

        <div className="config-grid">
          <label>
            <span>Provider</span>
            <select value={selectedId} onChange={(event) => applyPreset(event.target.value)}>
              {presets.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label}
                </option>
              ))}
            </select>
          </label>

          {selectedId === "custom" && (
            <label>
              <span>自定义 Provider</span>
              <input value={draft.provider} onChange={(event) => setDraft((current) => ({ ...current, provider: event.target.value }))} placeholder="例如 siliconflow" />
            </label>
          )}

          <label>
            <span>Model</span>
            <input value={draft.model} onChange={(event) => setDraft((current) => ({ ...current, model: event.target.value }))} placeholder="模型名称" />
          </label>

          <label>
            <span>API Key</span>
            <input
              value={draft.apiKey}
              onChange={(event) => setDraft((current) => ({ ...current, apiKey: event.target.value }))}
              placeholder="sk-..."
              type="password"
            />
          </label>

          <label>
            <span>Base URL</span>
            <input value={draft.baseUrl} onChange={(event) => setDraft((current) => ({ ...current, baseUrl: event.target.value }))} placeholder="https://.../v1" />
          </label>
        </div>

        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onClose}>
            取消
          </button>
          <button type="button" className="primary-button" onClick={save}>
            <Settings size={17} />
            保存
          </button>
        </div>
      </section>
    </div>
  );
}
