'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Zap, MessageSquare, Loader2, Copy, ThumbsUp, ThumbsDown, ArrowLeft } from 'lucide-react';
import clsx from 'clsx';
import { LandingPage } from '../components/LandingPage';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isTyping?: boolean;
}

export default function ChatPage() {
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hello! I'm your AI assistant. I'm here to help you with anything you need. Ask me questions, get creative ideas, solve problems, or just have a conversation. What would you like to talk about today?",
      role: 'assistant',
      timestamp: new Date('2024-01-01T12:00:00'), // Static timestamp to avoid hydration mismatch
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Ensure component is hydrated before showing dynamic content
  useEffect(() => {
    setIsClient(true);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getAIResponse = async (messages: Message[]): Promise<string> => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        console.warn('API returned error:', data.error);
      }
      
      if (data.isSimulated) {
        console.log('🎭 Using simulated AI response');
      } else {
        console.log('🤖 Using real AI response');
      }

      return data.message || 'Sorry, I could not generate a response.';
      
    } catch (error) {
      console.error('Failed to get AI response:', error);
      
      // Final fallback - client-side simulation
      const responses = [
        "I apologize, but I'm having trouble connecting to the AI service right now.",
        "There seems to be a temporary issue with the AI connection.",
        "I'm experiencing some technical difficulties at the moment.",
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      return `${randomResponse} Please try again in a moment, or check your internet connection.`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: 'user',
      timestamp: new Date(),
    };

    const typingMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: '',
      role: 'assistant',
      timestamp: new Date(),
      isTyping: true,
    };

    setMessages(prev => [...prev, userMessage, typingMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Get AI response from API (with fallback to simulation)
      const currentMessages = messages.concat(userMessage);
      const aiResponse = await getAIResponse(currentMessages);
      
      setMessages(prev => prev.filter(msg => msg.id !== typingMessage.id).concat({
        id: (Date.now() + 2).toString(),
        content: aiResponse,
        role: 'assistant',
        timestamp: new Date(),
      }));
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      
      // Remove typing indicator and show error message
      setMessages(prev => prev.filter(msg => msg.id !== typingMessage.id).concat({
        id: (Date.now() + 2).toString(),
        content: "I apologize, but I encountered an error. Please try again.",
        role: 'assistant',
        timestamp: new Date(),
      }));
    }
    
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as React.FormEvent);
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  // Show landing page first, then chat interface
  if (!showChat) {
    return <LandingPage onStartChat={() => setShowChat(true)} />;
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-white/20 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowChat(false)}
              className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors"
              title="Back to home"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI Chat Assistant
              </h1>
              <p className="text-sm text-gray-600">Powered by advanced AI technology</p>
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {messages.map((message) => 
          message.role === 'assistant' ? (
            // Assistant message (left-aligned)
            <div key={message.id} className="flex space-x-4 justify-start">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div className="max-w-[70%] group">
                <div className="px-6 py-4 rounded-2xl shadow-lg bg-white border border-gray-100">
                  {message.isTyping ? (
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      </div>
                      <span className="text-sm text-gray-500">AI is thinking...</span>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-800">
                        {message.content}
                      </p>
                    </div>
                  )}
                </div>
                
                {!message.isTyping && (
                  <div className="flex items-center justify-between mt-2 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs text-gray-500">
                      {isClient ? message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '12:00'}
                    </span>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => copyMessage(message.content)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                        title="Copy message"
                      >
                        <Copy className="h-3.5 w-3.5 text-gray-400" />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Good response">
                        <ThumbsUp className="h-3.5 w-3.5 text-gray-400" />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Poor response">
                        <ThumbsDown className="h-3.5 w-3.5 text-gray-400" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // User message (right-aligned)
            <div key={message.id} className="flex space-x-4 justify-end">
              <div className="max-w-[70%] group">
                <div className="px-6 py-4 rounded-2xl shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-white">
                    {message.content}
                  </p>
                </div>
                
                <div className="flex items-center justify-between mt-2 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs text-gray-500">
                    {isClient ? message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '12:00'}
                  </span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => copyMessage(message.content)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                      title="Copy message"
                    >
                      <Copy className="h-3.5 w-3.5 text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-700 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                <User className="h-6 w-6 text-white" />
              </div>
            </div>
          )
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input */}
      <footer className="border-t border-white/20 bg-white/80 backdrop-blur-xl px-6 py-4">
        <form onSubmit={handleSubmit} className="flex space-x-4">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
              className="w-full px-4 py-3 pr-16 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none max-h-32 bg-white/90 backdrop-blur-sm shadow-sm"
              rows={1}
              style={{
                minHeight: '3rem',
                height: 'auto',
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 128) + 'px';
              }}
            />
            <div className="absolute right-3 bottom-3 flex items-center space-x-2">
              <div className="text-xs text-gray-400 hidden sm:block">
                {input.length}/2000
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={clsx(
              'px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg flex items-center space-x-2',
              !input.trim() || isLoading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-blue-200 hover:shadow-blue-300 hover:shadow-lg'
            )}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
        
        {/* Quick suggestions */}
        <div className="mt-3 flex flex-wrap gap-2">
          {!isLoading && messages.length <= 1 && (
            <>
              <button
                onClick={() => setInput("What can you help me with today?")}
                className="px-3 py-1.5 text-xs bg-blue-50 text-blue-700 rounded-full border border-blue-200 hover:bg-blue-100 transition-colors"
              >
                <Zap className="h-3 w-3 inline mr-1" />
                Get started
              </button>
              <button
                onClick={() => setInput("Tell me about your capabilities")}
                className="px-3 py-1.5 text-xs bg-purple-50 text-purple-700 rounded-full border border-purple-200 hover:bg-purple-100 transition-colors"
              >
                <MessageSquare className="h-3 w-3 inline mr-1" />
                Learn more
              </button>
            </>
          )}
        </div>
      </footer>
    </div>
  );
}
