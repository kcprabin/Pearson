import React, { useState } from 'react';
import { Bot, Send, Sparkles, Check, HelpCircle } from 'lucide-react';
import type { ChatMessage } from '../types/dashboard';

interface AssistantTabProps {
  onSendMessage: (message: string) => Promise<string>;
  restaurantName: string;
}

export const AssistantTab: React.FC<AssistantTabProps> = ({
  onSendMessage,
  restaurantName,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'assistant',
      text: `Hello! I'm Pearson, your AI restaurant copilot for ${restaurantName}. I'm grounded in your active menus, customer feedback point, and WhatsApp ordering flow. How can I assist you today?`,
      timestamp: 'Just now',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const suggestions = [
    'What are our top-selling dishes today?',
    'Summarize recent customer feedback reviews',
    'What is our average order prep time?',
    'Draft a WhatsApp promotional message for tonight',
  ];

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      text: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const reply = await onSendMessage(query.trim());
      const botMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'assistant',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="eyebrow text-slate-500">CONVERSATIONAL COPILOT</span>
        <h2 className="font-['Space_Grotesk'] text-2xl font-bold text-slate-900">
          Pearson AI Assistant
        </h2>
        <p className="text-xs text-slate-500">
          Interactive console to query menus, inspect guest feedback, or test WhatsApp voice ordering logic
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Chat Panel */}
        <div className="panel col-span-2 flex min-h-[520px] flex-col p-0 overflow-hidden">
          {/* Heading */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-5 py-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#143d3a] text-[#d9e85a]">
                <Bot size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Pearson Ordering Agent</h4>
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Online · Vector RAG Synchronized</span>
                </div>
              </div>
            </div>
            <span className="text-[11px] text-slate-400">FastAPI & LangGraph</span>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 space-y-3.5 overflow-y-auto p-5">
            {messages.map((m) => {
              const isUser = m.sender === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex items-start gap-2.5 max-w-[85%] ${
                    isUser ? 'ml-auto flex-row-reverse' : ''
                  }`}
                >
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      isUser
                        ? 'bg-[#143d3a] text-white'
                        : 'bg-[#e2ede4] text-[#143d3a]'
                    }`}
                  >
                    {isUser ? 'ME' : <Sparkles size={13} className="text-[#143d3a]" />}
                  </div>
                  <div>
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-2xs ${
                        isUser
                          ? 'bg-[#143d3a] text-white'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {m.text}
                    </div>
                    <span className="mt-1 block text-[10px] text-slate-400">
                      {m.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Sparkles size={14} className="animate-spin text-[#143d3a]" />
                <span>Pearson is thinking...</span>
              </div>
            )}
          </div>

          {/* Prompt Suggestions */}
          <div className="border-t border-slate-100 bg-slate-50/50 p-3">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
              Suggested Questions
            </p>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(s)}
                  className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-600 transition hover:border-[#173e3b] hover:bg-[#eef5ee]"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSend();
            }}
            className="flex items-center gap-2 border-t border-slate-200 p-3 bg-white"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about orders, menus, feedback ratings, or policies..."
              className="flex-1 rounded-lg border border-slate-200 px-3.5 py-2 text-xs text-slate-800 focus:border-[#76a495] focus:outline-none focus:ring-1 focus:ring-[#76a495]"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#d9e85a] text-[#143936] transition hover:bg-[#cbdc3f] disabled:opacity-40"
            >
              <Send size={15} />
            </button>
          </form>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-4">
          <div className="panel">
            <h4 className="font-['Space_Grotesk'] text-sm font-bold text-slate-900">
              Copilot Capabilities
            </h4>
            <div className="mt-3 space-y-2.5 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <Check size={14} className="mt-0.5 text-emerald-600 shrink-0" />
                <span>Answers queries regarding dish ingredients & allergies</span>
              </div>
              <div className="flex items-start gap-2">
                <Check size={14} className="mt-0.5 text-emerald-600 shrink-0" />
                <span>Aggregates customer feedback sentiment across ratings</span>
              </div>
              <div className="flex items-start gap-2">
                <Check size={14} className="mt-0.5 text-emerald-600 shrink-0" />
                <span>Extracts voice audio orders directly through WhatsApp</span>
              </div>
              <div className="flex items-start gap-2">
                <Check size={14} className="mt-0.5 text-emerald-600 shrink-0" />
                <span>Dispatches real-time kitchen order payloads via Kafka</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-teal-200 bg-[#e7f3ef] p-4 text-xs text-[#173e3b]">
            <div className="flex items-center gap-1.5 font-bold mb-1">
              <HelpCircle size={15} />
              <span>FreeLLM & Agent Endpoint</span>
            </div>
            <p className="text-[11px] leading-relaxed text-[#2c5b56]">
              Running via FastAPI at <code>http://localhost:8000</code>. WhatsApp audio transcripts are handled through Whisper & Google/OpenAI embeddings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
