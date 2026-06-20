import type { Direction, Transaction } from '../types';
import { IN_CATEGORIES, OUT_CATEGORIES } from '../types';

export interface ParsedVoice {
  amount?: number;
  dir?: Direction;
  category?: string;
  who?: string;
  why?: string;
}

const NUMBER_WORDS: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
  hundred: 100,
  thousand: 1000,
};

function parseSpelledAmount(text: string): number | undefined {
  const lower = text.toLowerCase();
  const match = lower.match(
    /(\w+(?:\s+\w+)*)\s+(?:dollars?|bucks?)/,
  );
  if (!match) return undefined;

  const words = match[1].split(/\s+/);
  let total = 0;
  let current = 0;

  for (const word of words) {
    const val = NUMBER_WORDS[word];
    if (val === undefined) return undefined;
    if (val === 100 || val === 1000) {
      current = (current || 1) * val;
    } else {
      current += val;
    }
    if (val < 100) {
      total += current;
      current = 0;
    }
  }
  total += current;
  return total > 0 ? total : undefined;
}

function parseNumericAmount(text: string): number | undefined {
  const match = text.match(/[\d,]+(?:\.\d{1,2})?/);
  if (!match) return undefined;
  const num = parseFloat(match[0].replace(/,/g, ''));
  return isNaN(num) ? undefined : num;
}

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function parseVoiceInput(text: string): ParsedVoice {
  const lower = text.toLowerCase();
  const result: ParsedVoice = { dir: 'out' };

  result.amount = parseNumericAmount(text) ?? parseSpelledAmount(text);

  if (
    /\b(got|received|deposit|paycheck|earned|refund|income|salary|paid me)\b/.test(lower)
  ) {
    result.dir = 'in';
  }

  if (/\b(invest|brokerage|stock|401|roth|ira)\b/.test(lower)) {
    result.category = 'Investing';
    result.dir = 'out';
  } else if (
    /\b(rent|grocer|bill|gas|food|utilit|insurance|necessit|phone)\b/.test(lower)
  ) {
    result.category = 'Necessity';
    result.dir = 'out';
  } else if (
    /\b(sent|gave|gift)\b/.test(lower) &&
    /\bto\s+([a-z]+(?:\s+[a-z]+)?)/i.test(text)
  ) {
    result.category = 'Sent to people';
    result.dir = 'out';
  } else if (/\b(fun|concert|movie|game|dinner|drinks|trip|show|coffee)\b/.test(lower)) {
    result.category = 'Fun';
    result.dir = 'out';
  } else if (result.dir === 'in') {
    if (/\b(back|split|owe|venmo)\b/.test(lower)) {
      result.category = 'Repayment';
    } else {
      result.category = 'Income';
    }
  } else {
    result.category = 'Other';
  }

  const toMatch = text.match(/\bto\s+([a-z]+(?:\s+[a-z]+)?)/i);
  const fromMatch = text.match(/\bfrom\s+([a-z]+(?:\s+[a-z]+)?)/i);
  if (toMatch) result.who = titleCase(toMatch[1]);
  else if (fromMatch) result.who = titleCase(fromMatch[1]);

  const forMatch = text.match(/\bfor\s+(.+?)(?:\s+on\s+|\s+via\s+|$)/i);
  if (forMatch) result.why = forMatch[1].trim();

  return result;
}

export function buildTitle(
  dir: Direction,
  category: string,
  who: string,
): string {
  if (dir === 'in') {
    return who ? `${who}` : 'Money in';
  }
  if (category === 'Sent to people' && who) {
    return `Sent to ${who}`;
  }
  return who || category;
}

export function categoriesForDirection(dir: Direction): string[] {
  return dir === 'in' ? [...IN_CATEGORIES] : [...OUT_CATEGORIES];
}

export function transactionToForm(tx: Transaction) {
  return {
    dir: tx.dir,
    amount: String(tx.amount),
    category: tx.category,
    who: tx.who,
    why: tx.why,
    date: tx.date,
    method: tx.method,
    editingId: tx.id,
  };
}
