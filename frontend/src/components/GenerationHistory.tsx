import { ImageIcon, MessageSquareText, X } from "lucide-react";
import { AdventurerAvatar } from "../avatar/AdventurerAvatar";
import type { GenerationRecord } from "../types/face";

type Props = {
  records: GenerationRecord[];
  onSelect: (record: GenerationRecord) => void;
  onDelete: (record: GenerationRecord) => void;
};

const timeFormatter = new Intl.DateTimeFormat("zh-CN", {
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit"
});

const sourceLabels = {
  image: "图片生成",
  chat: "对话生成"
};

export function GenerationHistory({ records, onSelect, onDelete }: Props) {
  const isScrollable = records.length > 3;

  function requestDelete(record: GenerationRecord) {
    if (window.confirm("确定删除这条生成记录吗？删除后无法恢复。")) {
      onDelete(record);
    }
  }

  return (
    <section className={`generation-history ${isScrollable ? "is-scrollable" : ""}`}>
      <div className="section-heading">
        <h2>生成记录</h2>
        <span>{records.length}</span>
      </div>
      {records.length === 0 ? (
        <p className="empty">成功生成头像后，记录会保存在这里。</p>
      ) : (
        <div className="history-list-shell">
          <div className="history-list">
            {records.map((record) => (
              <div className="history-item" key={record.id}>
                <button className="history-open" type="button" onClick={() => onSelect(record)}>
                  <span className="history-avatar" aria-hidden="true">
                    <AdventurerAvatar avatar={record.currentSelection} />
                  </span>
                  <span className="history-meta">
                    <span className="history-title">
                      {record.sourceMode === "image" ? <ImageIcon size={15} /> : <MessageSquareText size={15} />}
                      {sourceLabels[record.sourceMode]}
                    </span>
                    <span className="history-subtitle">
                      {timeFormatter.format(new Date(record.createdAt))} · {record.provider}
                    </span>
                  </span>
                  {record.uploadedImageDataUrl && <img className="history-upload-thumb" src={record.uploadedImageDataUrl} alt="" />}
                </button>
                <button className="history-delete" type="button" onClick={() => requestDelete(record)} aria-label="删除生成记录" title="删除生成记录">
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
