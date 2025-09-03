// components/PickChat.js
import { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';

const Box = styled.div`
  margin-top: 1rem;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  overflow: hidden;
`;

const Head = styled.div`
  background: #f3f4f6;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Title = styled.div`
  font-weight: 600;
  color: #111827;
`;

const Body = styled.div`
  max-height: 260px;
  overflow-y: auto;
  padding: 0.75rem 1rem;
`;

const Bubble = styled.div`
  background: ${p => (p.role === 'user' ? '#e0e7ff' : '#ecfdf5')};
  color: #111827;
  border-radius: 0.75rem;
  padding: 0.5rem 0.75rem;
  margin: 0.5rem 0;
  align-self: ${p => (p.role === 'user' ? 'flex-end' : 'flex-start')};
  max-width: 90%;
  white-space: pre-wrap;
`;

const Row = styled.form`
  display: flex;
  border-top: 1px solid #e5e7eb;
`;

const Input = styled.input`
  flex: 1;
  padding: 0.75rem;
  border: 0;
  outline: none;
  font-size: 0.95rem;
`;

const Btn = styled.button`
  padding: 0.75rem 1rem;
  background: #4f46e5;
  color: white;
  border: 0;
  cursor: pointer;
  font-weight: 600;
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

export default function PickChat({ pickId, defaultPrompt }) {
  const [messages, setMessages] = useState(() => defaultPrompt ? [{ role: 'assistant', content: defaultPrompt }] : []);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bodyRef = useRef(null);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input.trim() };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/ai/ask-pick', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ pickId, message: userMsg.content })
      });
      const data = await res.json();
      const reply = data?.reply || 'No response.';
      setMessages(m => [...m, { role: 'assistant', content: reply }]);
    } catch (err) {
      setMessages(m => [...m, { role: 'assistant', content: 'Sorry—something went wrong.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box>
      <Head>
        <Title>AI Chat (Pick-Specific)</Title>
        <div className="text-xs text-gray-500">No strategy details revealed</div>
      </Head>
      <Body ref={bodyRef}>
        {messages.map((m, i) => (
          <Bubble key={i} role={m.role}>{m.content}</Bubble>
        ))}
        {loading && <Bubble role="assistant">Thinking…</Bubble>}
      </Body>
      <Row onSubmit={sendMessage}>
        <Input
          placeholder='Ask about this pick… (e.g., "How does this compare to implied odds?")'
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <Btn type="submit" disabled={loading}>Send</Btn>
      </Row>
    </Box>
  );
}
