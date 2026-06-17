"use client";

import { useState, useRef, useEffect } from 'react';
import { Message } from '@/types/chat';
import { askQuestion, uploadPdf } from '@/services/api';
import ChatHeader from '@/components/chat/ChatHeader';
import MessageList from '@/components/chat/MessageList';
import MessageInput from '@/components/chat/MessageInput';

export default function Home() {
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
    scrollToBottom();
  }, [messages]);

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
    <div className="container">
      <ChatHeader />
      <MessageList 
        messages={messages} 
        isLoading={isLoading} 
        messagesEndRef={messagesEndRef} 
      />
      <MessageInput 
        input={input} 
        setInput={setInput} 
        isLoading={isLoading} 
        onSubmit={handleSubmit} 
        onUpload={handleFileUpload} 
      />
    </div>
  );
}
