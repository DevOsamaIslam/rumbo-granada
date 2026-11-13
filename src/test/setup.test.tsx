// Simple test to verify test setup works
import { describe, it, expect } from 'vitest';

// Set test flag
(globalThis as Record<string, unknown>).__TEST__ = true;

describe('Test Setup', () => {
  it('should pass basic test', () => {
    expect(true).toBe(true);
  });

  it('should have global test flag', () => {
    expect((globalThis as Record<string, unknown>).__TEST__).toBe(true);
  });
});