import { useRef } from 'react';
import { Paperclip, Send } from 'lucide-react';

type MessageInputProps = {
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function MessageInput({ input, setInput, isLoading, onSubmit, onUpload }: MessageInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onUpload) onUpload(e);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex items-center gap-2">
      {onUpload && (
        <>
          <button 
            type="button" 
            onClick={handleUploadClick}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50/50 rounded-xl transition-all cursor-pointer disabled:opacity-50"
            disabled={isLoading}
            title="Upload PDF Manual (HR only)"
          >
            <Paperclip size={18} />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="application/pdf" 
            className="hidden" 
          />
        </>
      )}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask a question about manuals or leave balance..."
        className="flex-1 bg-slate-50/80 border border-slate-200/80 text-slate-800 text-sm focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl px-4 py-2.5 outline-none transition-all placeholder:text-slate-400"
        disabled={isLoading}
      />
      <button 
        type="submit" 
        className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-[0.97] disabled:opacity-40 disabled:scale-100 transition-all cursor-pointer shadow-sm hover:shadow" 
        disabled={isLoading || !input.trim()}
      >
        <Send size={15} className="ml-0.5" />
      </button>
    </form>
  );
}
