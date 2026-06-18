import { Message } from '@/types/chat';
import { RefObject } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Sparkles, FileText, User } from 'lucide-react';

type MessageListProps = {
  messages: Message[];
  isLoading: boolean;
  messagesEndRef: RefObject<HTMLDivElement | null>;
};

export default function MessageList({ messages, isLoading, messagesEndRef }: MessageListProps) {
  return (
    <div className="flex flex-col gap-4 p-5">
      {messages.map((msg) => {
        const isAi = msg.role === 'ai';
        return (
          <div 
            key={msg.id} 
            className={`flex flex-col gap-1 max-w-[85%] ${isAi ? 'self-start' : 'self-end'}`}
          >
            {/* Sender header with icon */}
            <div className={`flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase text-slate-400 mb-0.5 ${isAi ? 'pl-1' : 'pr-1 self-end'}`}>
              {isAi ? (
                <>
                  <Sparkles size={11} className="text-blue-500 animate-pulse" />
                  <span>HR AI assistant</span>
                </>
              ) : (
                <>
                  <span>You</span>
                  <User size={11} className="text-slate-400" />
                </>
              )}
            </div>

            {/* Bubble */}
            <div 
              className={`rounded-2xl px-4 py-3 shadow-sm border ${
                isAi 
                  ? 'bg-white border-slate-200/80 text-slate-800 rounded-tl-none' 
                  : 'bg-blue-600 border-blue-600 text-white rounded-tr-none'
              }`}
            >
              <div className={`prose-chat ${isAi ? 'text-slate-800' : 'text-white'}`}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.content}
                </ReactMarkdown>
              </div>
              
              {/* Context References */}
              {isAi && msg.context && msg.context.length > 0 && (
                <div className="flex flex-col gap-1.5 mt-3 pt-3 border-t border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Sources Cited:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.context.map((ctx, idx) => (
                      <div 
                        key={idx} 
                        className="inline-flex items-center gap-1 text-[10px] bg-slate-50 border border-slate-200/80 text-slate-600 hover:bg-slate-100 font-semibold px-2 py-0.5 rounded-md transition-colors cursor-help" 
                        title={ctx}
                      >
                        <FileText size={10} className="text-blue-500" />
                        <span>Manual Doc [{idx + 1}]</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="flex flex-col gap-1 max-w-[85%] self-start">
          <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase text-slate-400 mb-0.5 pl-1">
            <Sparkles size={11} className="text-blue-500 animate-pulse" />
            <span>AI is typing...</span>
          </div>
          <div className="rounded-2xl px-4 py-3 bg-white border border-slate-200/80 text-slate-800 rounded-tl-none shadow-sm">
            <div className="flex items-center space-x-1.5 py-1">
              <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
