import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, IconButton, Typography, TextField, CircularProgress,
  Divider, Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import AddCommentIcon from '@mui/icons-material/AddComment';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { apiFetch } from '../../utils/api';
import { useStore } from '../Store';
import { COLORS } from '../../utils/colors';

// ─── Theme ───────────────────────────────────────────────────────────────────
const AI = {
  from:    '#6366f1',
  to:      '#8b5cf6',
  dark:    '#1e1b4b',
  mid:     '#312e81',
  accent:  '#818cf8',
  glow:    'rgba(139,92,246,0.45)',
  glowSm:  'rgba(139,92,246,0.25)',
  bgChat:  '#f5f4ff',
  bubble:  'rgba(99,102,241,0.08)',
  border:  'rgba(99,102,241,0.18)',
};

const gradient = `linear-gradient(135deg, ${AI.from}, ${AI.to})`;
const headerGradient = `linear-gradient(135deg, ${AI.dark} 0%, ${AI.mid} 55%, #4338ca 100%)`;

// ─── Markdown components ──────────────────────────────────────────────────────
const mdComponents = {
  p: ({ children }) => (
    <Typography component="p" sx={{ fontSize: '0.82rem', lineHeight: 1.65, m: 0, mb: 0.6, '&:last-child': { mb: 0 } }}>
      {children}
    </Typography>
  ),
  strong: ({ children }) => <Box component="strong" sx={{ fontWeight: 700 }}>{children}</Box>,
  em: ({ children }) => <Box component="em" sx={{ fontStyle: 'italic' }}>{children}</Box>,
  h1: ({ children }) => <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, mb: 0.5, mt: 0.75 }}>{children}</Typography>,
  h2: ({ children }) => <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, mb: 0.5, mt: 0.75 }}>{children}</Typography>,
  h3: ({ children }) => <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, mb: 0.5, mt: 0.75 }}>{children}</Typography>,
  ul: ({ children }) => <Box component="ul" sx={{ pl: 2.5, my: 0.5, '& li': { fontSize: '0.82rem', lineHeight: 1.65 } }}>{children}</Box>,
  ol: ({ children }) => <Box component="ol" sx={{ pl: 2.5, my: 0.5, '& li': { fontSize: '0.82rem', lineHeight: 1.65 } }}>{children}</Box>,
  li: ({ children }) => <Box component="li" sx={{ mb: 0.2 }}>{children}</Box>,
  hr: () => <Divider sx={{ my: 1, borderColor: COLORS.border }} />,
  code: ({ inline, children }) => inline
    ? <Box component="code" sx={{ bgcolor: AI.bubble, border: `1px solid ${AI.border}`, borderRadius: 0.5, px: 0.6, py: 0.1, fontSize: '0.77rem', fontFamily: 'monospace', color: AI.from }}>{children}</Box>
    : <Box component="pre" sx={{ bgcolor: '#1e1b4b', color: '#c4b5fd', borderRadius: 1.5, p: 1.25, my: 0.75, overflowX: 'auto', fontSize: '0.76rem', fontFamily: 'monospace', lineHeight: 1.55 }}>{children}</Box>,
  table: ({ children }) => (
    <Box sx={{ overflowX: 'auto', my: 1, borderRadius: 1.5, border: `1px solid ${AI.border}`, boxShadow: `0 2px 8px ${AI.glowSm}` }}>
      <Box component="table" sx={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.79rem' }}>{children}</Box>
    </Box>
  ),
  thead: ({ children }) => <Box component="thead" sx={{ background: `linear-gradient(90deg, ${AI.dark}, ${AI.mid})` }}>{children}</Box>,
  tbody: ({ children }) => <Box component="tbody">{children}</Box>,
  tr: ({ children }) => <Box component="tr" sx={{ '&:not(:last-child)': { borderBottom: `1px solid ${AI.border}` } }}>{children}</Box>,
  th: ({ children }) => (
    <Box component="th" sx={{ px: 1.25, py: 0.65, textAlign: 'left', fontWeight: 700, color: '#c4b5fd', whiteSpace: 'nowrap', borderRight: `1px solid rgba(255,255,255,0.08)`, '&:last-child': { borderRight: 'none' } }}>
      {children}
    </Box>
  ),
  td: ({ children }) => (
    <Box component="td" sx={{ px: 1.25, py: 0.65, borderRight: `1px solid ${AI.border}`, '&:last-child': { borderRight: 'none' }, 'tr:nth-of-type(even) &': { bgcolor: AI.bubble } }}>
      {children}
    </Box>
  ),
  blockquote: ({ children }) => (
    <Box component="blockquote" sx={{ borderLeft: `3px solid ${AI.accent}`, pl: 1.5, ml: 0, my: 0.5, color: COLORS.textSecondary, fontStyle: 'italic' }}>{children}</Box>
  ),
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function AiAvatar() {
  return (
    <Box sx={{
      width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
      background: gradient,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: `0 0 8px ${AI.glowSm}`,
    }}>
      <AutoAwesomeIcon sx={{ fontSize: 14, color: '#fff' }} />
    </Box>
  );
}

function MessageBubble({ role, content }) {
  const isUser = role === 'user';

  if (isUser) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1.5 }}>
        <Box sx={{
          maxWidth: '78%',
          background: gradient,
          color: '#fff',
          borderRadius: '14px 14px 2px 14px',
          px: 1.5, py: 0.9,
          fontSize: '0.82rem',
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          boxShadow: `0 2px 12px ${AI.glowSm}`,
        }}>
          {content}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1.5, gap: 1 }}>
      <AiAvatar />
      <Box sx={{
        maxWidth: 'calc(100% - 38px)',
        bgcolor: '#ffffff',
        border: `1px solid ${AI.border}`,
        borderRadius: '2px 14px 14px 14px',
        px: 1.5, py: 1,
        boxShadow: `0 2px 8px ${AI.glowSm}`,
        color: COLORS.textPrimary,
        wordBreak: 'break-word',
        '& > *:first-of-type': { mt: 0 },
        '& > *:last-child': { mb: 0 },
      }}>
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
          {content}
        </ReactMarkdown>
      </Box>
    </Box>
  );
}

function SessionItem({ session, isActive, onClick }) {
  const preview = session.content.length > 33 ? session.content.slice(0, 33) + '…' : session.content;
  const date = new Date(session.createdAt);
  const label = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

  return (
    <Box onClick={onClick} sx={{
      px: 1.25, py: 0.85, cursor: 'pointer', borderRadius: 1.5, mx: 0.5,
      bgcolor: isActive ? 'rgba(99,102,241,0.12)' : 'transparent',
      borderLeft: isActive ? `2px solid ${AI.accent}` : '2px solid transparent',
      '&:hover': { bgcolor: isActive ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.05)' },
      transition: 'all 0.15s',
    }}>
      <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: isActive ? AI.accent : COLORS.textPrimary, lineHeight: 1.3 }}>
        {preview}
      </Typography>
      <Typography sx={{ fontSize: '0.66rem', color: COLORS.textSecondary, mt: 0.2 }}>{label}</Typography>
    </Box>
  );
}

function TypingDots() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1.5, gap: 1 }}>
      <AiAvatar />
      <Box sx={{
        bgcolor: '#ffffff', border: `1px solid ${AI.border}`,
        borderRadius: '2px 14px 14px 14px',
        px: 1.25, py: 0.9,
        display: 'flex', gap: 0.6, alignItems: 'center',
        boxShadow: `0 2px 8px ${AI.glowSm}`,
      }}>
        {[0, 1, 2].map(i => (
          <Box key={i} sx={{
            width: 6, height: 6, borderRadius: '50%', background: gradient,
            animation: 'aiDots 1.3s ease-in-out infinite',
            animationDelay: `${i * 0.22}s`,
            '@keyframes aiDots': {
              '0%, 80%, 100%': { transform: 'scale(0.65)', opacity: 0.35 },
              '40%': { transform: 'scale(1)', opacity: 1 },
            },
          }} />
        ))}
      </Box>
    </Box>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
const MIN_W = 380;
const MAX_W = 900;
const DEFAULT_W = 540;

function generateSessionId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function AiChat() {
  const { userName, userPermissions } = useStore();
  const [open, setOpen] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [width, setWidth] = useState(DEFAULT_W);
  const messagesEndRef = useRef(null);
  const isResizing = useRef(false);
  const resizeStartX = useRef(0);
  const resizeStartW = useRef(DEFAULT_W);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Resize handlers ──
  const onResizeMove = useCallback((e) => {
    if (!isResizing.current) return;
    const delta = resizeStartX.current - e.clientX;
    setWidth(Math.min(Math.max(resizeStartW.current + delta, MIN_W), MAX_W));
  }, []);

  const onResizeEnd = useCallback(() => {
    isResizing.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    window.removeEventListener('mousemove', onResizeMove);
    window.removeEventListener('mouseup', onResizeEnd);
  }, [onResizeMove]);

  const onResizeStart = useCallback((e) => {
    e.preventDefault();
    isResizing.current = true;
    resizeStartX.current = e.clientX;
    resizeStartW.current = width;
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onResizeMove);
    window.addEventListener('mouseup', onResizeEnd);
  }, [width, onResizeMove, onResizeEnd]);

  // ── Data ──
  const loadSessions = useCallback(async () => {
    try {
      const res = await apiFetch('/ai-chat/sessions');
      const data = await res.json();
      setSessions(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { if (open) loadSessions(); }, [open, loadSessions]);

  const startNewSession = () => { setActiveSessionId(generateSessionId()); setMessages([]); };

  const openSession = async (sessionId) => {
    setActiveSessionId(sessionId);
    try {
      const res = await apiFetch(`/ai-chat/sessions/${sessionId}`);
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch { setMessages([]); }
  };

  const handleOpen = () => { setOpen(true); if (!activeSessionId) startNewSession(); };

  const handleSend = async () => {
    const msg = input.trim();
    if (!msg || loading) return;
    const sessionId = activeSessionId || generateSessionId();
    if (!activeSessionId) setActiveSessionId(sessionId);
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);
    try {
      const res = await apiFetch('/ai-chat/message', {
        method: 'POST',
        body: JSON.stringify({ sessionId, message: msg }),
      });
      const data = await res.json();
      if (data.message) setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
      loadSessions();
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Desculpe, ocorreu um erro. Tente novamente.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  if (!userName || ![4, 5].includes(Number(userPermissions))) return null;

  return (
    <Box sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1300 }}>

      {/* FAB */}
      {!open && (
        <Tooltip title="CE Assistente IA" placement="left">
          <Box onClick={handleOpen} sx={{
            width: 54, height: 54, borderRadius: '50%',
            background: gradient,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: `0 4px 20px ${AI.glow}`,
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': { transform: 'scale(1.1)', boxShadow: `0 6px 28px ${AI.glow}` },
            '& .fab-icon': {
              animation: 'fabSpin 3s ease-in-out infinite',
              '@keyframes fabSpin': {
                '0%,100%': { transform: 'rotate(-8deg) scale(1)' },
                '50%': { transform: 'rotate(8deg) scale(1.15)' },
              },
            },
          }}>
            <AutoAwesomeIcon className="fab-icon" sx={{ fontSize: 26, color: '#fff' }} />
          </Box>
        </Tooltip>
      )}

      {/* Chat panel */}
      {open && (
        <Box sx={{
          width, height: 580,
          borderRadius: 2.5,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: `0 16px 56px rgba(0,0,0,0.22), 0 0 0 1px ${AI.border}`,
          position: 'relative',
        }}>

          {/* Resize handle — left edge */}
          <Box
            onMouseDown={onResizeStart}
            sx={{
              position: 'absolute', left: 0, top: 0, bottom: 0, width: 6,
              zIndex: 10, cursor: 'ew-resize',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              '&:hover .resize-bar': { opacity: 1 },
            }}
          >
            <Box className="resize-bar" sx={{
              width: 3, height: 40, borderRadius: 2,
              background: gradient, opacity: 0,
              transition: 'opacity 0.2s',
            }} />
          </Box>

          {/* Header */}
          <Box sx={{
            background: headerGradient,
            px: 2, py: 1.25,
            display: 'flex', alignItems: 'center', gap: 1.25,
            flexShrink: 0,
          }}>
            {/* Logo mark */}
            <Box sx={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 0 12px ${AI.glowSm}`,
            }}>
              <AutoAwesomeIcon sx={{ fontSize: 18, color: '#c4b5fd' }} />
            </Box>

            <Box sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem', lineHeight: 1 }}>
                  CE Assistente
                </Typography>
                <Box sx={{
                  px: 0.7, py: 0.15, borderRadius: 0.75,
                  bgcolor: 'rgba(129,140,248,0.3)',
                  border: '1px solid rgba(129,140,248,0.5)',
                }}>
                  <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, color: '#c4b5fd', letterSpacing: '0.06em' }}>
                    IA
                  </Typography>
                </Box>
              </Box>
              <Typography sx={{ color: 'rgba(196,181,253,0.7)', fontSize: '0.67rem', mt: 0.15 }}>
                Análise de dados em tempo real
              </Typography>
            </Box>

            <Tooltip title="Nova conversa">
              <IconButton size="small" onClick={startNewSession} sx={{
                color: 'rgba(196,181,253,0.75)',
                '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.1)' },
              }}>
                <AddCommentIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <IconButton size="small" onClick={() => setOpen(false)} sx={{
              color: 'rgba(196,181,253,0.75)',
              '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.1)' },
            }}>
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>

          <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>

            {/* Sessions sidebar */}
            <Box sx={{
              width: 150, flexShrink: 0,
              borderRight: `1px solid ${AI.border}`,
              display: 'flex', flexDirection: 'column',
              bgcolor: '#faf9ff',
            }}>
              <Typography sx={{
                px: 1.5, pt: 1.25, pb: 0.5,
                fontSize: '0.63rem', fontWeight: 700,
                color: AI.accent, textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>
                Histórico
              </Typography>
              <Box sx={{ overflowY: 'auto', flexGrow: 1, py: 0.5 }}>
                {sessions.length === 0 ? (
                  <Typography sx={{ px: 1.5, py: 0.5, fontSize: '0.71rem', color: COLORS.textSecondary, fontStyle: 'italic' }}>
                    Sem conversas
                  </Typography>
                ) : sessions.map(s => (
                  <SessionItem
                    key={s.sessionId}
                    session={s}
                    isActive={activeSessionId === s.sessionId}
                    onClick={() => openSession(s.sessionId)}
                  />
                ))}
              </Box>
            </Box>

            {/* Chat */}
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: AI.bgChat }}>

              {/* Messages */}
              <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 1.5, pt: 1.5, pb: 1 }}>
                {messages.length === 0 && (
                  <Box sx={{ textAlign: 'center', mt: 4, px: 2 }}>
                    <Box sx={{
                      width: 56, height: 56, borderRadius: '50%',
                      background: gradient,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      mx: 'auto', mb: 1.5,
                      boxShadow: `0 4px 20px ${AI.glow}`,
                    }}>
                      <AutoAwesomeIcon sx={{ fontSize: 26, color: '#fff' }} />
                    </Box>
                    <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: AI.dark }}>
                      Olá, {userName}!
                    </Typography>
                    <Typography sx={{ fontSize: '0.76rem', color: COLORS.textSecondary, mt: 0.5, lineHeight: 1.5 }}>
                      Pergunte sobre vendas, guias, reservas,<br />comissões e muito mais.
                    </Typography>
                  </Box>
                )}
                {messages.map((m, i) => (
                  <MessageBubble key={i} role={m.role} content={m.content} />
                ))}
                {loading && <TypingDots />}
                <div ref={messagesEndRef} />
              </Box>

              {/* Input */}
              <Box sx={{
                px: 1.25, py: 1,
                bgcolor: '#fff',
                borderTop: `1px solid ${AI.border}`,
                display: 'flex', gap: 1, alignItems: 'flex-end',
              }}>
                <TextField
                  multiline maxRows={3} fullWidth size="small"
                  placeholder="Pergunte algo sobre os dados..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      fontSize: '0.82rem',
                      bgcolor: AI.bgChat,
                      borderRadius: 2,
                      '& fieldset': { borderColor: AI.border },
                      '&:hover fieldset': { borderColor: AI.accent },
                      '&.Mui-focused fieldset': { borderColor: AI.from, borderWidth: 2 },
                    },
                  }}
                />
                <Box
                  onClick={!input.trim() || loading ? undefined : handleSend}
                  sx={{
                    width: 36, height: 36, borderRadius: 1.75, flexShrink: 0,
                    background: !input.trim() || loading ? COLORS.border : gradient,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: !input.trim() || loading ? 'default' : 'pointer',
                    boxShadow: !input.trim() || loading ? 'none' : `0 2px 10px ${AI.glowSm}`,
                    transition: 'all 0.15s',
                    '&:hover': !input.trim() || loading ? {} : { boxShadow: `0 4px 16px ${AI.glow}`, transform: 'scale(1.05)' },
                  }}
                >
                  <SendIcon sx={{ fontSize: 17, color: !input.trim() || loading ? COLORS.textSecondary : '#fff' }} />
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}
