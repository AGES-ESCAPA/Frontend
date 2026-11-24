import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { COURSE_FORM_INITIAL_VALUES } from '@utils/courseForm';
import { useCourseForm } from './useCourseForm';

describe('useCourseForm', () => {
  it('starts with empty initial values and no errors', () => {
    const { result } = renderHook(() => useCourseForm());

    expect(result.current.values).toEqual(COURSE_FORM_INITIAL_VALUES);
    expect(result.current.errors).toEqual({});
  });

  it('updates a field and clears its validation error', () => {
    const { result } = renderHook(() => useCourseForm());

    act(() => {
      result.current.replaceErrors({ title: 'Preenchimento obrigatório.' });
    });
    expect(result.current.errors.title).toBe('Preenchimento obrigatório.');

    act(() => {
      result.current.changeField('title', 'Turismo em Tempos de Escapismo');
    });

    expect(result.current.values.title).toBe('Turismo em Tempos de Escapismo');
    expect(result.current.errors.title).toBeUndefined();
  });

  it('ignores changeField when the value is unchanged', () => {
    const { result } = renderHook(() => useCourseForm());

    act(() => {
      result.current.changeField('title', 'Mesmo título');
    });

    const before = result.current.values;

    act(() => {
      result.current.replaceErrors({ title: 'Erro' });
      result.current.changeField('title', 'Mesmo título');
    });

    expect(result.current.values).toBe(before);
    expect(result.current.errors.title).toBe('Erro');
  });

  it('replaces all values and clears errors', () => {
    const { result } = renderHook(() => useCourseForm());

    act(() => {
      result.current.replaceErrors({ price: 'Inválido' });
      result.current.replaceValues({
        ...COURSE_FORM_INITIAL_VALUES,
        title: 'Novo curso',
        price: '197',
      });
    });

    expect(result.current.values.title).toBe('Novo curso');
    expect(result.current.values.price).toBe('197');
    expect(result.current.errors).toEqual({});
  });

  it('replaces errors without changing values', () => {
    const { result } = renderHook(() => useCourseForm());

    act(() => {
      result.current.changeField('deadline', '30');
      result.current.replaceErrors({ deadline: 'Informe um número válido.' });
    });

    expect(result.current.values.deadline).toBe('30');
    expect(result.current.errors.deadline).toBe('Informe um número válido.');
  });
});
