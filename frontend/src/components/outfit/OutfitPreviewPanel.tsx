import type { OutfitAction, OutfitSelection } from "../../types/outfit";
import { actionOptions } from "../../outfitRegistry/schema";
import { OutfitViewer } from "./OutfitViewer";

type Props = {
  outfit: OutfitSelection;
  action: OutfitAction;
  loading?: boolean;
  loadingLabel?: string;
  onActionChange: (action: OutfitAction) => void;
};

export function OutfitPreviewPanel({ outfit, action, loading = false, loadingLabel = "生成中...", onActionChange }: Props) {
  return (
    <section className="preview-panel outfit-preview-panel">
      <div className="outfit-preview-toolbar">
        <label>
          <span>动作</span>
          <select value={action} onChange={(event) => onActionChange(event.target.value as OutfitAction)}>
            {actionOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <OutfitViewer selection={outfit} action={action} />
      {loading && (
        <div className="preview-loading" role="status" aria-live="polite">
          <span className="loading-spinner" />
          <span>{loadingLabel}</span>
        </div>
      )}
    </section>
  );
}
