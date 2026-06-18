// src/renderer/ReviewPanel.tsx
import React, { useRef, useEffect, memo } from 'react';

interface ReviewPanelProps {
  history: Array<{ question: string; answer: string }>;
}

/** Single conversation entry — memoized */
const HistoryEntry = memo<{ question: string; answer: string; index: number }>(
  ({ question, answer, index }) => (
    <div className="history-entry">
      <div className="history-q">
        <span className="history-badge">Q{index + 1}</span>
        <span>{question}</span>
      </div>
      <div className="history-a">
        <pre>{answer}</pre>
      </div>
    </div>
  )
);

export const ReviewPanel: React.FC<ReviewPanelProps> = ({ history }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest entry
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history.length]);

  if (history.length === 0) {
    return (
      <div className="review-panel-empty">
        <p>Conversation history will appear here</p>
      </div>
    );
  }

  return (
    <div className="review-panel" ref={scrollRef}>
      {history.map((h, i) => (
        <HistoryEntry key={i} question={h.question} answer={h.answer} index={i} />
      ))}
    </div>
  );
};

export default ReviewPanel;
