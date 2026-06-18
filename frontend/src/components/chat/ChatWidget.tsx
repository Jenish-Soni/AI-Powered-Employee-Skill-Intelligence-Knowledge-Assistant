'use client';

import { useState, useRef, useEffect } from 'react';
import { Message } from '@/types/chat';
import { askQuestion, uploadPdf } from '@/services/api';
import ChatHeader from '@/components/chat/ChatHeader';
import MessageList from '@/components/chat/MessageList';
import MessageInput from '@/components/chat/MessageInput';
import { MessageCircle, X } from 'lucide-react';

interface ChatWidgetProps {
  role: 'admin' | 'hr' | 'employee';
}

export default function ChatWidget({ role }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'ai',
      content: 'Hello! I am your AI HR Assistant. I can answer questions about our company policies, remote work, leaves, and more. How can I help you today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsLoading(true);
    
    const uploadMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: `[Uploading PDF: ${file.name}...]`
    };
    setMessages(prev => [...prev, uploadMsg]);
    
    try {
      const data = await uploadPdf(file);
      
      const successMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: `Success! I processed the manual '${file.name}' and learned ${data.chunks_processed} new chunks of information.`
      };
      setMessages(prev => [...prev, successMsg]);
    } catch (error) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: `Sorry, there was an error uploading the PDF.`
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const data = await askQuestion(userMessage.content);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: data.answer,
        context: data.retrieved_context
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: 'Sorry, I encountered an error connecting to the backend. Please ensure the FastAPI server is running on port 8000.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 z-40 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
      >
        <MessageCircle size={28} />
      </button>

      {/* Chat Panel */}
      <div 
        className={`fixed bottom-6 right-6 w-[400px] h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 transform origin-bottom-right z-50 ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}
      >
        <div className="flex items-center justify-between bg-blue-600 p-4 text-white">
          <div className="flex items-center gap-2">
            <MessageCircle size={20} />
            <h3 className="font-semibold">HR Assistant</h3>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-blue-100 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-0 m-0 relative bg-gray-50">
          <MessageList 
            messages={messages} 
            isLoading={isLoading} 
            messagesEndRef={messagesEndRef} 
          />
        </div>
        
        <div className="border-t border-gray-200 p-4 bg-white">
          <MessageInput 
            input={input} 
            setInput={setInput} 
            isLoading={isLoading} 
            onSubmit={handleSubmit} 
            onUpload={role === 'hr' ? handleFileUpload : undefined} 
          />
        </div>
      </div>
    </>
  );
}
