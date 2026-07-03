import { RotateCcw, Send, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "../types/face";

type Props = {
  messages: ChatMessage[];
  busy: boolean;
  onSend: (message: string) => void;
  onGenerate: () => void;
  onReset: () => void;
  canGenerate: boolean;
};

export function ChatInput({ messages, busy, onSend, onGenerate, onReset, canGenerate }: Props) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!busy) {
      textareaRef.current?.focus();
    }
  }, [busy, messages.length]);

  function submit() {
    const value = text.trim();
    if (!value || busy) return;
    setText("");
    onSend(value);
    window.requestAnimationFrame(() => textareaRef.current?.focus());
  }

  return (
    <div className="chat-panel">
      <div className="messages">
        {messages.length === 0 && <p className="empty">描述你想要的 Adventurer 头像，比如发型、眼睛、嘴巴、颜色或配饰。</p>}
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`message ${message.role}`}>
            {message.content}
          </div>
        ))}
      </div>
      <div className="chat-compose">
        <textarea
          ref={textareaRef}
          value={text}
          disabled={busy}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
        />
        <button type="button" onClick={submit} disabled={busy || !text.trim()} title="发送">
          <Send size={18} />
        </button>
      </div>
      <div className="chat-actions">
        <button type="button" onClick={onGenerate} disabled={busy || !canGenerate}>
          <Sparkles size={17} />
          生成头像
        </button>
        <button type="button" onClick={onReset} disabled={busy || messages.length === 0} title="重新开始">
          <RotateCcw size={17} />
        </button>
      </div>
    </div>
  );
}
