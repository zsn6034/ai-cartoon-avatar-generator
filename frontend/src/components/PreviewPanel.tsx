import type { AvatarSelection } from "../types/face";
import { AdventurerAvatar } from "../avatar/AdventurerAvatar";

type Props = {
  avatar: AvatarSelection;
  loading?: boolean;
  loadingLabel?: string;
};

export function PreviewPanel({ avatar, loading = false, loadingLabel = "生成中..." }: Props) {
  return (
    <section className="preview-panel">
      <AdventurerAvatar avatar={avatar} />
      {loading && (
        <div className="preview-loading" role="status" aria-live="polite">
          <span className="loading-spinner" />
          <span>{loadingLabel}</span>
        </div>
      )}
    </section>
  );
}
