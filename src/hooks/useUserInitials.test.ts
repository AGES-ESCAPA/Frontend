import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useUserInitials } from './useUserInitials';

describe('useUserInitials', () => {
  it('returns empty string for blank names', () => {
    expect(renderHook(() => useUserInitials('   ')).result.current).toBe('');
  });

  it('returns the first letter for a single name', () => {
    expect(renderHook(() => useUserInitials('mariana')).result.current).toBe('M');
  });

  it('returns first and last initials for multiple parts', () => {
    expect(renderHook(() => useUserInitials('Mariana Costa Silva')).result.current).toBe('MS');
  });

  it('trims extra whitespace between parts', () => {
    expect(renderHook(() => useUserInitials('  João   Pedro  ')).result.current).toBe('JP');
  });
});
