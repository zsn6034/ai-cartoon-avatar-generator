import { ImageIcon, MessageSquareText, X } from "lucide-react";
import type { OutfitGenerationRecord } from "../../types/outfit";
import { actionLabels, labelForOutfitFeature } from "../../outfitRegistry/schema";

type Props = {
  records: OutfitGenerationRecord[];
  onSelect: (record: OutfitGenerationRecord) => void;
  onDelete: (record: OutfitGenerationRecord) => void;
};

const timeFormatter = new Intl.DateTimeFormat("zh-CN", {
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit"
});

const sourceLabels = {
  image: "图片换装",
  chat: "对话换装"
};

export function OutfitGenerationHistory({ records, onSelect, onDelete }: Props) {
  const isScrollable = records.length > 3;

  function requestDelete(record: OutfitGenerationRecord) {
    if (window.confirm("确定删除这条 3D 换装记录吗？删除后无法恢复。")) {
      onDelete(record);
    }
  }

  return (
    <section className={`generation-history outfit-generation-history ${isScrollable ? "is-scrollable" : ""}`}>
      <div className="section-heading">
        <h2>3D 记录</h2>
        <span>{records.length}</span>
      </div>
      {records.length === 0 ? (
        <p className="empty">成功生成 3D 搭配后，记录会保存在这里。</p>
      ) : (
        <div className="history-list-shell">
          <div className="history-list">
            {records.map((record) => (
              <div className="history-item outfit-history-item" key={record.id}>
                <button className="history-open outfit-history-open" type="button" onClick={() => onSelect(record)}>
                  <span className="history-avatar outfit-history-token" aria-hidden="true">
                    3D
                  </span>
                  <span className="history-meta">
                    <span className="history-title">
                      {record.sourceMode === "image" ? <ImageIcon size={15} /> : <MessageSquareText size={15} />}
                      {sourceLabels[record.sourceMode]} · {actionLabels[record.action]}
                    </span>
                    <span className="history-subtitle">
                      {timeFormatter.format(new Date(record.createdAt))} · {record.provider}
                    </span>
                    <span className="history-subtitle outfit-history-assets">
                      {labelForOutfitFeature("hair", record.currentSelection.hair)} / {labelForOutfitFeature("top", record.currentSelection.top)}
                    </span>
                  </span>
                  {record.uploadedImageDataUrl && <img className="history-upload-thumb" src={record.uploadedImageDataUrl} alt="" />}
                </button>
                <button className="history-delete" type="button" onClick={() => requestDelete(record)} aria-label="删除 3D 换装记录" title="删除 3D 换装记录">
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
