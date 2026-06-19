import { useCallback, useEffect, useRef, useState } from 'react';
import type { Account, Category, FlowDirection, Transaction } from '../types';
import { CATEGORY_META, ACCOUNT_LABELS } from '../types';
import { createTransaction } from '../lib/categorize';
import { parseVoiceInput } from '../lib/voiceParser';
import { todayISO } from '../lib/format';

interface Props {
  onAdd: (transaction: Transaction) => void;
}

const CATEGORIES = Object.keys(CATEGORY_META) as Category[];

export function AddTransaction({ onAdd }: Props) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [direction, setDirection] = useState<FlowDirection>('out');
  const [date, setDate] = useState(todayISO());
  const [account, setAccount] = useState<Account>('checking_6174');
  const [category, setCategory] = useState<Category | ''>('');
  const [reason, setReason] = useState('');
  const [person, setPerson] = useState('');
  const [method, setMethod] = useState('');
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    setVoiceSupported(!!SR);
  }, []);

  const applyVoiceResult = useCallback((text: string) => {
    setVoiceText(text);
    const parsed = parseVoiceInput(text);
    if (parsed.description) setDescription(parsed.description);
    if (parsed.amount) setAmount(String(parsed.amount));
    if (parsed.direction) setDirection(parsed.direction);
    if (parsed.reason) setReason(parsed.reason);
    if (parsed.person) setPerson(parsed.person);
    if (parsed.date) setDate(parsed.date);
  }, []);

  const startListening = useCallback(() => {
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
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join('');
      applyVoiceResult(transcript);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [applyVoiceResult]);

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!description || isNaN(numAmount) || numAmount <= 0) return;

    const tx = createTransaction({
      date,
      description,
      amount: numAmount,
      direction,
      account,
      category: category || undefined,
      reason: reason || undefined,
      person: person || undefined,
      method: method || undefined,
    });

    onAdd(tx);

    setDescription('');
    setAmount('');
    setReason('');
    setPerson('');
    setMethod('');
    setCategory('');
    setVoiceText('');
  };

  const quickReasons =
    direction === 'out'
      ? ['Split bill', 'Gift', 'Rent share', 'Pay back', 'Investment', 'Subscription']
      : ['Paycheck', 'Reimbursement', 'Gift received', 'Refund', 'Interest'];

  return (
    <div className="px-4 pb-28 pt-2">
      {voiceSupported && (
        <div className="mb-6">
          <button
            type="button"
            onClick={listening ? stopListening : startListening}
            className={`flex w-full items-center justify-center gap-3 rounded-2xl py-5 text-lg font-semibold transition ${
              listening
                ? 'animate-pulse bg-accent-red text-white'
                : 'bg-accent-green/20 text-accent-green active:bg-accent-green/30'
            }`}
          >
            <span className="text-2xl">{listening ? '⏹' : '🎤'}</span>
            {listening ? 'Listening… tap to stop' : 'Tap to speak a transaction'}
          </button>
          {voiceText && (
            <p className="mt-2 text-center text-sm text-gray-400">Heard: "{voiceText}"</p>
          )}
          <p className="mt-2 text-center text-xs text-gray-600">
            Try: "Spent 33 dollars on Uber for ride yesterday"
          </p>
        </div>
      )}

      {!voiceSupported && (
        <div className="mb-6 rounded-2xl bg-surface-card p-4 text-center text-sm text-gray-400">
          Voice input works in Safari & Chrome on your phone. Use the form below on other browsers.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <DirectionButton
            label="Money In"
            active={direction === 'in'}
            onClick={() => setDirection('in')}
            color="green"
          />
          <DirectionButton
            label="Money Out"
            active={direction === 'out'}
            onClick={() => setDirection('out')}
            color="white"
          />
        </div>

        <Field label="What">
          <input
            type="text"
            placeholder="Uber, Venmo, Charles Schwab…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input"
            required
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Amount">
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input"
              required
            />
          </Field>
          <Field label="Date">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input"
              required
            />
          </Field>
        </div>

        <Field label="Account">
          <select
            value={account}
            onChange={(e) => setAccount(e.target.value as Account)}
            className="input"
          >
            {(Object.keys(ACCOUNT_LABELS) as Account[]).map((a) => (
              <option key={a} value={a}>
                {ACCOUNT_LABELS[a]}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Why (optional)">
          <input
            type="text"
            placeholder="Reason for this transaction"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="input"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {quickReasons.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                className="rounded-full bg-surface-raised px-2.5 py-1 text-xs text-gray-400"
              >
                {r}
              </button>
            ))}
          </div>
        </Field>

        {(direction === 'out' && description.toLowerCase().includes('zelle')) ||
        person ? (
          <Field label="Person (optional)">
            <input
              type="text"
              placeholder="Who did you send to / receive from?"
              value={person}
              onChange={(e) => setPerson(e.target.value)}
              className="input"
            />
          </Field>
        ) : null}

        <Field label="How (optional)">
          <input
            type="text"
            placeholder="Zelle, Venmo, auto-pay…"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="input"
          />
        </Field>

        <Field label="Category (auto-detected if blank)">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category | '')}
            className="input"
          >
            <option value="">Auto-detect</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_META[c].icon} {CATEGORY_META[c].label}
              </option>
            ))}
          </select>
        </Field>

        <button
          type="submit"
          className="w-full rounded-2xl bg-white py-4 font-semibold text-black active:scale-[0.98]"
        >
          Add Transaction
        </button>
      </form>

      <style>{`
        .input {
          width: 100%;
          border-radius: 0.75rem;
          background: #1c1c1e;
          padding: 0.75rem 1rem;
          color: white;
          outline: none;
        }
        .input:focus {
          box-shadow: 0 0 0 1px #2c2c2e;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm text-gray-400">{label}</label>
      {children}
    </div>
  );
}

function DirectionButton({
  label,
  active,
  onClick,
  color,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  color: 'green' | 'white';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-xl py-3 font-medium transition ${
        active
          ? color === 'green'
            ? 'bg-accent-green text-black'
            : 'bg-white text-black'
          : 'bg-surface-card text-gray-400'
      }`}
    >
      {label}
    </button>
  );
}
