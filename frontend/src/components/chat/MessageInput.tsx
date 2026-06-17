import { useRef } from 'react';

type MessageInputProps = {
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function MessageInput({ input, setInput, isLoading, onSubmit, onUpload }: MessageInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpload(e);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <form onSubmit={onSubmit} className="input-area">
      <button 
        type="button" 
        onClick={handleUploadClick}
        className="upload-btn"
        disabled={isLoading}
        title="Upload PDF Manual"
      >
        📎
      </button>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="application/pdf" 
        style={{ display: 'none' }} 
      />
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="e.g., Can I work from home on Fridays?"
        className="input-field"
        disabled={isLoading}
      />
      <button type="submit" className="submit-btn" disabled={isLoading || !input.trim()}>
        Send
      </button>
    </form>
  );
}
