import { Send } from "lucide-react";
import { useState } from "react";
import type { ChatMessage } from "../types/face";

type Props = {
  messages: ChatMessage[];
  busy: boolean;
  onSend: (message: string) => void;
};

export function ChatInput({ messages, busy, onSend }: Props) {
  const [text, setText] = useState("");

  function submit() {
    const value = text.trim();
    if (!value || busy) return;
    setText("");
    onSend(value);
  }

  return (
    <div className="chat-panel">
      <div className="messages">
        {messages.length === 0 && <p className="empty">描述你的脸型、眼睛、眉毛、发型或整体气质。</p>}
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`message ${message.role}`}>
            {message.content}
          </div>
        ))}
      </div>
      <div className="chat-compose">
        <textarea
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
    </div>
  );
}
