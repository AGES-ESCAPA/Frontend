import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useToast } from './useToast';

describe('useToast', () => {
  it('should start with no toast visible', () => {
    const { result } = renderHook(() => useToast());

    expect(result.current.toast).toBeNull();
  });

  it('should show a toast with the given variant, title and description', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('success', 'Rascunho salvo!', 'Os dados foram gravados.');
    });

    expect(result.current.toast).toMatchObject({
      variant: 'success',
      title: 'Rascunho salvo!',
      description: 'Os dados foram gravados.',
    });
  });

  it('should dismiss the toast', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('error', 'Falha ao salvar');
    });
    expect(result.current.toast).not.toBeNull();

    act(() => {
      result.current.dismissToast();
    });
    expect(result.current.toast).toBeNull();
  });

  it('should give every toast a different key, even when triggered back-to-back', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('error', 'Primeira falha');
    });
    const firstKey = result.current.toast?.key;

    act(() => {
      result.current.showToast('error', 'Segunda falha imediatamente depois');
    });
    const secondKey = result.current.toast?.key;

    expect(firstKey).toBeDefined();
    expect(secondKey).toBeDefined();
    expect(secondKey).not.toBe(firstKey);
  });
});
