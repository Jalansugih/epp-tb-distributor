import { describe, expect, it } from 'vitest';
import { generateDocumentNo, generateId, generateNumericCode } from './identifiers';

describe('generateId', () => {
  it('prefixes the id as requested', () => {
    expect(generateId('so')).toMatch(/^so-/);
  });

  it('produces unique ids across many calls (no Date.now()-style collisions)', () => {
    const ids = new Set(Array.from({ length: 1000 }, () => generateId('so')));
    expect(ids.size).toBe(1000);
  });
});

describe('generateDocumentNo', () => {
  it('embeds the actual date passed in, not a hardcoded one', () => {
    const docNo = generateDocumentNo('SO', new Date('2027-03-05T00:00:00Z'));
    expect(docNo).toMatch(/^SO\/2027\/03\/\d{4}$/);
  });

  it('produces unique document numbers across many calls', () => {
    const docs = new Set(Array.from({ length: 500 }, () => generateDocumentNo('PO')));
    expect(docs.size).toBe(500);
  });
});

describe('generateNumericCode', () => {
  it('returns only digits after the prefix', () => {
    const code = generateNumericCode('SO', 9);
    expect(code.slice(2)).toMatch(/^\d{9}$/);
  });
});
