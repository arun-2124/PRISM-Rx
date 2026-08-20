import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, Sparkles, ArrowRight, ShieldAlert, FileText, Zap, Compass, Filter, CheckCircle2, Info, Layers, RefreshCw, ExternalLink } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { postCopilotQuery, fetchSignals } from '../api';

export default function CopilotPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Active Candidate Signal State
  const initialSignalId = searchParams.get('signal_id') || 'DR:CHEMBL403989__D:MONDO_0004967';
  const [selectedSignalId, setSelectedSignalId] = useState(initialSignalId);
  const [candidateList, setCandidateList] = useState([
    { id: 'DR:CHEMBL403989__D:MONDO_0004967', label: 'Tg100-801 → acute lymphoblastic leukemia (Score: 82.0)' },
    { id: 'DR:CHEMBL473159__D:EFO_0005762', label: 'Phloroglucinol → neuropathic pain (Score: 89.5)' },
    { id: 'DR:CHEMBL1059__D:EFO_0010282', label: 'Pregabalin → gastrointestinal disease (Score: 88.0)' },
    { id: 'DR:CHEMBL1201__D:MONDO_0004992', label: 'Metformin → cancer (Score: 28.0)' },
  ]);

  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Welcome to **PRISM AI Copilot** — an evidence-grounded research assistant. I analyze real-time drug repurposing signals, evidence convergence, and contradiction metrics across 2,002,252+ verified database records.',
      structured: null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchSignals({ limit: 10 })
      .then(res => {
        if (res?.signals) {
          const formatted = res.signals.map(s => ({
            id: s.signal_id,
            label: `${s.drug.name} → ${s.disease.name} (Score: ${s.research_priority_score})`,
          }));
          setCandidateList(formatted);
        }
      })
      .catch(() => null);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const generalPrompts = [
    "What is medicine?",
    "Explain drug repurposing",
    "What is a PRISM score?",
    "What is a clinical trial?",
    "What does inhibitor mean?",
    "How does PRISM-Rx identify signals?",
  ];

  const candidatePrompts = [
    "Why is this candidate interesting?",
    "Explain its PRISM score",
    "What evidence supports this signal?",
    "Are there safety concerns?",
    "What clinical trials exist?",
    "Show the biological pathway",
  ];

  const handleSend = async (textToSend) => {
    const text = textToSend || prompt;
    if (!text.trim() || loading) return;

    const userMsg = {
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setPrompt('');
    setLoading(true);

    try {
      const res = await postCopilotQuery(text, selectedSignalId);
      const assistantMsg = {
        role: 'assistant',
        content: res.answer,
        data: res,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: "I don't have enough verified evidence in the current PRISM-Rx dataset to answer that query reliably.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <Bot size={30} color="var(--primary-cyan)" />
            PRISM AI Copilot
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '4px', margin: 0 }}>
            Evidence-grounded biomedical research assistant backed by 2.0M+ medbase.db records.
          </p>
        </div>

        {/* Candidate Context Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '6px 12px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600 }}>RESEARCH CONTEXT:</span>
          <select
            value={selectedSignalId}
            onChange={(e) => setSelectedSignalId(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'var(--primary-cyan)', fontSize: '0.82rem', fontWeight: 700, outline: 'none', cursor: 'pointer', maxWidth: '320px' }}
          >
            {candidateList.map(c => (
              <option key={c.id} value={c.id} style={{ background: '#0a0f1d', color: '#ffffff' }}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Suggested Prompts Section */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Suggested Research Questions:
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {candidatePrompts.map((p, idx) => (
            <button
              key={`cand-${idx}`}
              onClick={() => handleSend(p)}
              disabled={loading}
              style={{
                padding: '6px 12px',
                borderRadius: '20px',
                background: 'rgba(0, 242, 254, 0.08)',
                border: '1px solid rgba(0, 242, 254, 0.3)',
                color: 'var(--primary-cyan)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
              }}
            >
              <Sparkles size={12} />
              {p}
            </button>
          ))}
          {generalPrompts.map((p, idx) => (
            <button
              key={`gen-${idx}`}
              onClick={() => handleSend(p)}
              disabled={loading}
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
                transition: 'all 0.2s ease',
              }}
            >
              <BookOpen size={12} />
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Stream Container */}
      <div className="glass-card" style={{ padding: '24px', minHeight: '480px', maxHeight: '600px', overflowY: 'auto', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {messages.map((m, idx) => (
          <div key={idx} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {m.role === 'assistant' && (
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-cyan), var(--accent-purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#040914', fontWeight: 800, flexShrink: 0 }}>
                <Bot size={20} />
              </div>
            )}

            <div style={{
              maxWidth: m.role === 'user' ? '65%' : '85%',
              background: m.role === 'user' ? 'rgba(0, 242, 254, 0.12)' : 'rgba(255, 255, 255, 0.03)',
              border: m.role === 'user' ? '1px solid var(--primary-cyan)' : '1px solid var(--border-color)',
              borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              padding: '18px 22px',
              fontSize: '0.9rem',
              lineHeight: 1.6,
              color: '#ffffff',
              boxShadow: m.role === 'user' ? '0 4px 12px rgba(0, 242, 254, 0.1)' : 'none',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: m.role === 'user' ? 'var(--primary-cyan)' : 'var(--accent-purple)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {m.role === 'user' ? 'RESEARCHER QUESTION' : 'PRISM AI COPILOT RESPONSE'}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginLeft: '12px' }}>{m.timestamp}</span>
              </div>

              {/* Formatted Markdown Content */}
              <div className="copilot-markdown-content" style={{ fontSize: '0.9rem' }}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ node, ...props }) => <h1 style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '16px', marginBottom: '8px', color: 'var(--primary-cyan)' }} {...props} />,
                    h2: ({ node, ...props }) => <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '14px', marginBottom: '6px', color: '#ffffff' }} {...props} />,
                    h3: ({ node, ...props }) => <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '12px', marginBottom: '6px', color: 'var(--accent-purple)' }} {...props} />,
                    h4: ({ node, ...props }) => <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '10px', marginBottom: '4px', color: 'var(--primary-cyan)' }} {...props} />,
                    p: ({ node, ...props }) => <p style={{ marginBottom: '8px', lineHeight: 1.6 }} {...props} />,
                    ul: ({ node, ...props }) => <ul style={{ paddingLeft: '20px', margin: '8px 0' }} {...props} />,
                    ol: ({ node, ...props }) => <ol style={{ paddingLeft: '20px', margin: '8px 0' }} {...props} />,
                    li: ({ node, ...props }) => <li style={{ marginBottom: '4px' }} {...props} />,
                    code: ({ node, inline, ...props }) => (
                      <code style={{ background: 'rgba(0, 242, 254, 0.12)', color: 'var(--primary-cyan)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.85em' }} {...props} />
                    ),
                    table: ({ node, ...props }) => (
                      <div style={{ overflowX: 'auto', margin: '14px 0', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }} {...props} />
                      </div>
                    ),
                    th: ({ node, ...props }) => (
                      <th style={{ background: 'rgba(0, 242, 254, 0.1)', padding: '8px 12px', borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--primary-cyan)', fontWeight: 700 }} {...props} />
                    ),
                    td: ({ node, ...props }) => (
                      <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }} {...props} />
                    ),
                    a: ({ node, ...props }) => (
                      <a style={{ color: 'var(--primary-cyan)', textDecoration: 'underline' }} target="_blank" rel="noopener noreferrer" {...props} />
                    ),
                  }}
                >
                  {m.content}
                </ReactMarkdown>
              </div>

              {/* Data Sources Pills & External Action */}
              {m.data?.sources && (
                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>VERIFIED SOURCES:</span>
                    {m.data.sources.map((s, i) => (
                      <span key={i} className="badge" style={{ fontSize: '0.68rem', background: 'rgba(255,255,255,0.06)' }}>
                        {s}
                      </span>
                    ))}
                  </div>

                  {m.data.signal_id && (
                    <button
                      className="btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                      onClick={() => navigate(`/signals/${encodeURIComponent(m.data.signal_id)}`)}
                    >
                      Inspect Candidate Workspace <ArrowRight size={12} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(0, 242, 254, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-cyan)' }}>
              <RefreshCw size={18} className="spin" />
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
              Querying medbase.db evidence graph and analyzing grounded research metrics...
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Prompt Box */}
      <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} style={{ display: 'flex', gap: '12px' }}>
        <input
          type="text"
          className="input-control"
          placeholder="Ask PRISM Copilot about drug repurposing, evidence records, clinical trials, or target pathways..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={loading}
        />
        <button type="submit" className="btn-primary" disabled={loading || !prompt.trim()}>
          <Send size={16} />
          Send Query
        </button>
      </form>
    </div>
  );
}

// Icon component helper
function BookOpen({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  );
}
