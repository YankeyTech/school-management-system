'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Bot, User, Loader2, Trash2, BookOpen, BarChart3, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Props {
  schoolId: string;
  userRole: string;
  userName: string;
}

const SUGGESTED_PROMPTS = [
  { icon: BarChart3, text: 'Analyze student performance trends this term', category: 'Analytics' },
  { icon: BookOpen, text: 'Generate a report card comment for a student scoring 75%', category: 'Reports' },
  { icon: MessageSquare, text: 'Write a parent notification about upcoming exams', category: 'Communication' },
  { icon: Sparkles, text: 'Suggest strategies for improving attendance rates', category: 'Insights' },
  { icon: BarChart3, text: 'What subjects need more attention based on recent results?', category: 'Analytics' },
  { icon: BookOpen, text: 'Create a study schedule template for BECE preparation', category: 'Planning' },
];

export function AIAssistantClient({ schoolId, userRole, userName }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: `Hello ${userName}! I'm your EduCore AI Assistant. I can help you with:\n\n• **Report card comments** — just give me a student's scores\n• **Performance analysis** — trends, weak subjects, recommendations\n• **Communication drafts** — letters to parents, announcements\n• **Administrative tasks** — scheduling, planning, insights\n\nWhat can I help you with today?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          history: messages.slice(-10),
          schoolId,
          userRole,
        }),
      });

      const data = await response.json();

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message ?? 'Sorry, I could not generate a response.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function clearChat() {
    setMessages([
      {
        id: '0',
        role: 'assistant',
        content: `Hello ${userName}! How can I assist you today?`,
        timestamp: new Date(),
      },
    ]);
  }

  function renderContent(content: string) {
    // Simple markdown-like rendering
    const lines = content.split('\n');
    return lines.map((line, i) => {
      // Bold
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={i} className={cn('', line === '' ? 'h-2' : '')}>
          {parts.map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={j}>{part.slice(2, -2)}</strong>;
            }
            // Bullet points
            if (part.startsWith('• ')) {
              return <span key={j} className="block pl-2">{part}</span>;
            }
            return <span key={j}>{part}</span>;
          })}
        </p>
      );
    });
  }

  const hasOnlyWelcome = messages.length === 1;

  return (
    <div className="flex flex-col h-full bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-muted/20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">EduCore AI</p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[11px] text-muted-foreground">Powered by Claude</span>
            </div>
          </div>
        </div>
        <button
          onClick={clearChat}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Clear chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'flex items-start gap-3 animate-fade-in',
              msg.role === 'user' ? 'flex-row-reverse' : ''
            )}
          >
            {/* Avatar */}
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white',
                msg.role === 'assistant'
                  ? 'gradient-primary'
                  : 'bg-gradient-to-br from-blue-500 to-purple-600'
              )}
            >
              {msg.role === 'assistant' ? (
                <Bot className="h-4 w-4" />
              ) : (
                <User className="h-4 w-4" />
              )}
            </div>

            {/* Bubble */}
            <div
              className={cn(
                'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed space-y-1',
                msg.role === 'assistant'
                  ? 'bg-muted/60 text-foreground rounded-tl-sm'
                  : 'bg-primary text-primary-foreground rounded-tr-sm'
              )}
            >
              {msg.role === 'assistant'
                ? renderContent(msg.content)
                : <p>{msg.content}</p>
              }
              <p className={cn(
                'text-[10px] mt-1',
                msg.role === 'assistant' ? 'text-muted-foreground' : 'text-primary-foreground/60'
              )}>
                {msg.timestamp.toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="bg-muted/60 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggested prompts (shown when chat is fresh) */}
      {hasOnlyWelcome && (
        <div className="px-5 py-3 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2 font-medium">Suggestions</p>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
            {SUGGESTED_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                onClick={() => sendMessage(prompt.text)}
                className="flex items-start gap-2 p-2.5 rounded-lg border border-border hover:bg-accent text-left transition-colors group"
              >
                <prompt.icon className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors leading-tight">
                  {prompt.text}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t border-border">
        <div className="flex items-end gap-2 bg-muted/30 rounded-xl border border-border p-1">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything... (Enter to send, Shift+Enter for new line)"
            rows={1}
            className="flex-1 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground 
                       focus:outline-none resize-none max-h-32 leading-relaxed"
            style={{ minHeight: '36px' }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="p-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 
                       disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-1.5">
          AI responses are generated and should be reviewed before use
        </p>
      </div>
    </div>
  );
}
