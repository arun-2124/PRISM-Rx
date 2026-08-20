import React, { useState } from 'react';
import { Bot, Send, Sparkles, ArrowRight, ShieldCheck, FileText, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CopilotPage() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Welcome to PRISM Copilot. I analyze real-time drug repurposing signals, evidence convergence, and contradiction metrics across 819K candidate pairs.',
      structured: null,
    },
  ]);

  const suggestedPrompts = [
    "Find emerging repurposing opportunities for Alzheimer's disease involving metabolic pathways.",
    "Why is Tg100-801 -> acute lymphoblastic leukemia rising fast?",
    "Show contradictory evidence for Aspirin in oncology.",
    "Compare Tg100-801 vs Aspirin repurposing priority scores.",
  ];

  const handleSend = (textToSend) => {
    const text = textToSend || prompt;
    if (!text.trim()) return;

    const userMsg = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setPrompt('');

    // Generate realistic structured research response
    setTimeout(() => {
      const assistantMsg = {
        role: 'assistant',
        content: `Analysis complete for: "${text}"`,
        structured: {
          topCandidate: 'Tg100-801 -> acute lymphoblastic leukemia',
          signalId: 'DR:CHEMBL403989__D:MONDO_0004967',
          score: '82.0 / 100',
          category: 'STRONG_RESEARCH_SIGNAL',
          whyNow: '4 independent evidence events published across bioRxiv, Europe PMC, and ClinicalTrials.gov within the last 12 days.',
          mechanism: 'Tg100-801 acts as a dual FGR / FYN / LYN kinase inhibitor modulating ALL target pathways.',
          confidence: 'High (0.90 Drug-Target Confidence, 1.000 Target-Disease Score)',
          contradiction: '0 contradictory studies identified in current dataset snapshot.',
          recommendedAction: 'Proceed to Phase 1 clinical trial data review and target binding validation.',
        },
      };
      setMessages((prev) => [...prev, assistantMsg]);
    }, 600);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Bot size={28} color="var(--accent-purple)" />
          PRISM Copilot &mdash; AI Research Assistant
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Query biomedical signals, evidence convergence, and contradiction metrics in structured natural language.
        </p>
      </div>

      {/* Suggested Prompt Pills */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {suggestedPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(p)}
            style={{
              padding: '6px 12px',
              borderRadius: '20px',
              background: 'rgba(157, 78, 221, 0.1)',
              border: '1px solid rgba(157, 78, 221, 0.3)',
              color: 'var(--accent-purple)',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Sparkles size={12} />
            {p}
          </button>
        ))}
      </div>

      {/* Chat Messages Stream */}
      <div className="glass-card" style={{ padding: '24px', minHeight: '400px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {messages.map((m, idx) => (
          <div key={idx} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {m.role === 'assistant' && (
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-purple), var(--primary-cyan))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#040914', fontWeight: 800, flexShrink: 0 }}>
                <Bot size={18} />
              </div>
            )}

            <div style={{
              maxWidth: '80%',
              background: m.role === 'user' ? 'rgba(0, 242, 254, 0.15)' : 'rgba(255, 255, 255, 0.03)',
              border: m.role === 'user' ? '1px solid var(--primary-cyan)' : '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '16px 20px',
              fontSize: '0.9rem',
              lineHeight: 1.6,
            }}>
              <div>{m.content}</div>

              {/* Structured Response Card */}
              {m.structured && (
                <div style={{ marginTop: '16px', background: 'rgba(0, 0, 0, 0.4)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(0, 242, 254, 0.2)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-cyan)', textTransform: 'uppercase', marginBottom: '8px' }}>
                    STRUCTURED RESEARCH INTELLIGENCE
                  </div>

                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
                    {m.structured.topCandidate}
                  </div>

                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-emerald)', fontFamily: 'var(--font-heading)', marginBottom: '12px' }}>
                    {m.structured.score} <span className="badge badge-strong">{m.structured.category}</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem' }}>
                    <div><strong style={{ color: 'var(--primary-cyan)' }}>Why Now:</strong> {m.structured.whyNow}</div>
                    <div><strong style={{ color: 'var(--accent-purple)' }}>Mechanism:</strong> {m.structured.mechanism}</div>
                    <div><strong style={{ color: 'var(--accent-emerald)' }}>Confidence:</strong> {m.structured.confidence}</div>
                    <div><strong style={{ color: 'var(--accent-amber)' }}>Contradiction:</strong> {m.structured.contradiction}</div>
                    <div><strong style={{ color: 'var(--text-main)' }}>Recommendation:</strong> {m.structured.recommendedAction}</div>
                  </div>

                  <button
                    className="btn-primary"
                    style={{ marginTop: '14px', width: '100%', justifyContent: 'center', fontSize: '0.82rem', padding: '6px 12px' }}
                    onClick={() => navigate(`/signals/${encodeURIComponent(m.structured.signalId)}`)}
                  >
                    INVESTIGATE FULL CANDIDATE WORKSPACE
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Input Prompt Box */}
      <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} style={{ display: 'flex', gap: '12px' }}>
        <input
          type="text"
          className="input-control"
          placeholder="Ask PRISM Copilot anything about drug repurposing signals..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <button type="submit" className="btn-primary">
          <Send size={16} />
          Send
        </button>
      </form>
    </div>
  );
}
