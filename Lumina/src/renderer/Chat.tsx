// src/renderer/Chat.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';

const api = (window as any).luminaAPI;

interface ChatProps {
  onResponse: (question: string, answer: string) => void;
}

const Chat: React.FC<ChatProps> = ({ onResponse }) => {
  const [input, setInput] = useState('');
  const [fusionEnabled, setFusionEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load persisted fusion state once on mount
  useEffect(() => {
    api.getFusionStatus().then((state: boolean) => setFusionEnabled(state));
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const toggleFusion = useCallback(async () => {
    const newState = !fusionEnabled;
    setFusionEnabled(newState);
    await api.toggleFusion(newState);
  }, [fusionEnabled]);

  const submitQuestion = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    const startTime = Date.now();

    try {
      const answer = await api.generateCode(trimmed);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      onResponse(trimmed, `${answer}\n\n_Response time: ${elapsed}s_`);
    } catch (e: any) {
      onResponse(trimmed, `⚠️ Error: ${e.message || 'Failed to communicate with AI'}`);
    } finally {
      setInput('');
      setLoading(false);
      textareaRef.current?.focus();
    }
  }, [input, loading, onResponse]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitQuestion();
    }
  }, [submitQuestion]);

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h3>✦ Architect</h3>
        <label className="fusion-toggle" title="Enable web-augmented answers">
          <input type="checkbox" checked={fusionEnabled} onChange={toggleFusion} />
          <span className="toggle-slider"></span>
          <span className="toggle-label">Fusion</span>
        </label>
      </div>
      <div className="chat-input-area">
        <textarea
          ref={textareaRef}
          rows={1}
          placeholder={loading ? 'Thinking...' : 'Ask about your code...'}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <button
          className="btn-send"
          onClick={submitQuestion}
          disabled={loading || !input.trim()}
          title="Send (Enter)"
        >
          {loading ? (
            <span className="spinner"></span>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M1.724 1.053a.5.5 0 00-.714.545l1.403 4.85a.5.5 0 00.397.354l5.69.953c.268.045.268.445 0 .49l-5.69.953a.5.5 0 00-.397.354l-1.403 4.85a.5.5 0 00.714.545l13-6.5a.5.5 0 000-.894l-13-6.5z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default Chat;
