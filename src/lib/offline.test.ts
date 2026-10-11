import { describe, it, expect } from 'vitest';
import { isNetworkError } from './offline';

describe('isNetworkError', () => {
  it('treats connectivity failures as network errors', () => {
    expect(isNetworkError(new TypeError('Failed to fetch'))).toBe(true);
    expect(isNetworkError(new Error('NetworkError when attempting to fetch resource.'))).toBe(true);
    expect(isNetworkError({ message: 'Load failed' })).toBe(true);
    expect(isNetworkError({ message: 'x', status: 503 })).toBe(true);
  });
  it('does not treat database rejections as network errors', () => {
    expect(isNetworkError(new Error('new row violates row-level security policy'))).toBe(false);
    expect(isNetworkError({ message: 'duplicate key value', status: 409 })).toBe(false);
  });
});
