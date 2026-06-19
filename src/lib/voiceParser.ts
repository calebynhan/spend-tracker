import type { Category, FlowDirection } from '../types';
import { categorize } from './categorize';

export interface ParsedVoiceInput {
  description?: string;
  amount?: number;
  direction?: FlowDirection;
  reason?: string;
  person?: string;
  date?: string;
}

const AMOUNT_RE = /\$?\s*(\d+(?:\.\d{1,2})?)\s*(?:dollars?)?/i;
const DATE_RE =
  /(?:on\s+)?(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)|(?:on\s+)?(today|yesterday)|(?:on\s+)?(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})/i;

const IN_KEYWORDS = /\b(received|got|deposit|income|paid me|sent me|from)\b/i;
const OUT_KEYWORDS = /\b(spent|paid|sent|bought|transfer(?:red)? to|invested)\b/i;

const PERSON_RE = /(?:to|from)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/;
const REASON_RE = /(?:for|because|reason)\s+(.+?)(?:\s+on\s+|\s*$)/i;

export function parseVoiceInput(text: string): ParsedVoiceInput {
  const result: ParsedVoiceInput = {};
  const lower = text.toLowerCase();

  const amountMatch = text.match(AMOUNT_RE);
  if (amountMatch) {
    result.amount = parseFloat(amountMatch[1]);
  }

  if (IN_KEYWORDS.test(lower) && !OUT_KEYWORDS.test(lower)) {
    result.direction = 'in';
  } else if (OUT_KEYWORDS.test(lower)) {
    result.direction = 'out';
  }

  const personMatch = text.match(PERSON_RE);
  if (personMatch) {
    result.person = personMatch[1];
  }

  const reasonMatch = text.match(REASON_RE);
  if (reasonMatch) {
    result.reason = reasonMatch[1].trim();
  }

  const dateMatch = text.match(DATE_RE);
  if (dateMatch) {
    if (dateMatch[2] === 'today') {
      result.date = new Date().toISOString().slice(0, 10);
    } else if (dateMatch[2] === 'yesterday') {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      result.date = d.toISOString().slice(0, 10);
    } else if (dateMatch[1]) {
      const parts = dateMatch[1].split('/');
      const month = parts[0].padStart(2, '0');
      const day = parts[1].padStart(2, '0');
      const year = parts[2] ? (parts[2].length === 2 ? `20${parts[2]}` : parts[2]) : '2026';
      result.date = `${year}-${month}-${day}`;
    }
  }

  // Extract description: remove parsed parts, keep merchant-like words
  let desc = text
    .replace(AMOUNT_RE, '')
    .replace(DATE_RE, '')
    .replace(PERSON_RE, '')
    .replace(REASON_RE, '')
  .replace(/\b(received|got|spent|paid|sent|bought|for|because|on|today|yesterday|dollars?)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (desc.length > 1) {
    result.description = desc.charAt(0).toUpperCase() + desc.slice(1);
  }

  return result;
}

export function suggestCategory(
  description: string,
  amount: number,
  direction: FlowDirection,
): Category {
  return categorize({ description, amount, direction });
}
