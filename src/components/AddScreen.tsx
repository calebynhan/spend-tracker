import { useCallback, useEffect, useRef, useState } from 'react';
import type { AddFormState } from '../types';
import { buildTitle, categoriesForDirection, parseVoiceInput } from '../lib/voiceParser';

interface Props {
  form: AddFormState;
  onChange: (form: AddFormState) => void;
  onSave: () => void;
}

export function AddScreen({ form, onChange, onSave }: Props) {
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    setVoiceSupported(!!SR);
  }, []);

  const applyParsed = useCallback(
    (text: string) => {
      setTranscript(text);
      const parsed = parseVoiceInput(text);
      const cats = categoriesForDirection(parsed.dir ?? form.dir);
      onChange({
        ...form,
        ...(parsed.dir && { dir: parsed.dir }),
        ...(parsed.amount !== undefined && { amount: String(parsed.amount) }),
        ...(parsed.category && cats.includes(parsed.category) && { category: parsed.category }),
        ...(parsed.who && { who: parsed.who }),
        ...(parsed.why && { why: parsed.why }),
      });
    },
    [form, onChange],
  );

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const text = Array.from(event.results)
        .map((r: SpeechRecognitionResult) => r[0]?.transcript ?? '')
        .join('');
      applyParsed(text);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const setDir = (dir: 'in' | 'out') => {
    const cats = categoriesForDirection(dir);
    onChange({
      ...form,
      dir,
      category: cats.includes(form.category) ? form.category : cats[0],
    });
  };

  const categories = categoriesForDirection(form.dir);
  const isSentToPeople = form.category === 'Sent to people';
  const whoLabel =
    form.dir === 'in'
      ? 'Source'
      : isSentToPeople
        ? 'Who you sent to'
        : 'Who / payee';

  const canSave = parseFloat(form.amount) > 0;

  return (
    <div>
      <h1 className="serif" style={{ fontSize: 32, fontWeight: 500, margin: '0 0 20px' }}>
        {form.editingId ? 'Edit' : 'Add'}
      </h1>

      <div className="direction-toggle">
        <button
          type="button"
          className={`direction-btn ${form.dir === 'in' ? 'active' : ''}`}
          onClick={() => setDir('in')}
        >
          Money in
        </button>
        <button
          type="button"
          className={`direction-btn ${form.dir === 'out' ? 'active' : ''}`}
          onClick={() => setDir('out')}
        >
          Money out
        </button>
      </div>

      <div className="voice-card" style={{ marginBottom: 20 }}>
        {voiceSupported ? (
          <>
            <button
              type="button"
              className={`mic-btn ${listening ? 'listening' : ''}`}
              onClick={listening ? stopListening : startListening}
              aria-label={listening ? 'Stop listening' : 'Start voice input'}
            >
              🎤
            </button>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 8px' }}>
              {listening ? 'Listening… tap to stop' : 'Tap to speak a transaction'}
            </p>
            {transcript && (
              <p style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--ink)', margin: 0 }}>
                "{transcript}"
              </p>
            )}
          </>
        ) : (
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
            Voice unavailable — type below
          </p>
        )}
      </div>

      <div className="amount-input-wrap">
        <span className="serif" style={{ fontSize: 36, color: 'var(--muted)' }}>
          $
        </span>
        <input
          type="number"
          inputMode="decimal"
          className="amount-input"
          placeholder="0"
          value={form.amount}
          onChange={(e) => onChange({ ...form, amount: e.target.value })}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <span className="field-label">Category</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`chip ${form.category === cat ? 'active' : ''}`}
              onClick={() => onChange({ ...form, category: cat })}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label className="field-label">{whoLabel}</label>
        <input
          type="text"
          className="field-input"
          placeholder={whoLabel}
          value={form.who}
          onChange={(e) => onChange({ ...form, who: e.target.value })}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label className="field-label">Why / note</label>
        <input
          type="text"
          className="field-input"
          placeholder="Reason or note"
          value={form.why}
          onChange={(e) => onChange({ ...form, why: e.target.value })}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        <div>
          <label className="field-label">Date</label>
          <input
            type="date"
            className="field-input"
            value={form.date}
            onChange={(e) => onChange({ ...form, date: e.target.value })}
          />
        </div>
        <div>
          <label className="field-label">Method</label>
          <input
            type="text"
            className="field-input"
            placeholder="Zelle, card…"
            value={form.method}
            onChange={(e) => onChange({ ...form, method: e.target.value })}
          />
        </div>
      </div>

      <button
        type="button"
        className="btn-dark"
        disabled={!canSave}
        onClick={onSave}
        style={{ opacity: canSave ? 1 : 0.45 }}
      >
        Save transaction
      </button>

      {form.amount && (
        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted)', marginTop: 12 }}>
          Preview: {buildTitle(form.dir, form.category, form.who)}
        </p>
      )}
    </div>
  );
}
