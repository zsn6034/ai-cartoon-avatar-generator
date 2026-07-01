import type { ChatMessage, InputMode } from "../types/face";
import { ChatInput } from "./ChatInput";
import { ImageUpload } from "./ImageUpload";

type Props = {
  mode: InputMode;
  imageDataUrl?: string;
  messages: ChatMessage[];
  busy: boolean;
  onModeChange: (mode: InputMode) => void;
  onImageUpload: (file: File, dataUrl: string) => void;
  onChatSend: (message: string) => void;
};

export function InputPanel({ mode, imageDataUrl, messages, busy, onModeChange, onImageUpload, onChatSend }: Props) {
  return (
    <section className="panel input-panel">
      <div className="tabs" role="tablist">
        <button className={mode === "image" ? "active" : ""} onClick={() => onModeChange("image")} type="button">
          上传图片
        </button>
        <button className={mode === "chat" ? "active" : ""} onClick={() => onModeChange("chat")} type="button">
          自由对话
        </button>
      </div>
      {mode === "image" ? (
        <ImageUpload imageDataUrl={imageDataUrl} busy={busy} onUpload={onImageUpload} />
      ) : (
        <ChatInput messages={messages} busy={busy} onSend={onChatSend} />
      )}
    </section>
  );
}
