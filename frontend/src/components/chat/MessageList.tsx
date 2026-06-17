import { Message } from '@/types/chat';
import { RefObject } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type MessageListProps = {
  messages: Message[];
  isLoading: boolean;
  messagesEndRef: RefObject<HTMLDivElement | null>;
};

export default function MessageList({ messages, isLoading, messagesEndRef }: MessageListProps) {
  return (
    <div className="chat-window">
      {messages.map((msg) => (
        <div key={msg.id} className={`message ${msg.role}`}>
          <div className="content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {msg.content}
            </ReactMarkdown>
          </div>
          
          {msg.role === 'ai' && msg.context && msg.context.length > 0 && (
            <div className="tags-container">
              {msg.context.map((ctx, idx) => (
                <div key={idx} className="source-tag" title={ctx}>
                  🏷️ Source [{idx + 1}]
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      {isLoading && (
        <div className="message ai">
          <div className="content">Thinking...</div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
