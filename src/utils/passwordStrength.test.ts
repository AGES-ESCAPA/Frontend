import { describe, expect, it } from 'vitest';
import { getPasswordStrength } from './passwordStrength';

describe('getPasswordStrength', () => {
  it('mantém a barra vazia quando a senha ainda não foi digitada', () => {
    expect(getPasswordStrength('')).toEqual({ level: 'vazia', score: 0, label: '' });
  });

  it('marca como fraca quando falta variedade', () => {
    expect(getPasswordStrength('abc')).toEqual({ level: 'fraca', score: 1, label: 'Fraca' });
    expect(getPasswordStrength('abcdefgh')).toEqual({ level: 'fraca', score: 1, label: 'Fraca' });
  });

  it('marca como média com parte dos critérios', () => {
    expect(getPasswordStrength('Abcdefgh')).toEqual({ level: 'media', score: 2, label: 'Média' });
    expect(getPasswordStrength('Abcdefg1')).toEqual({ level: 'media', score: 2, label: 'Média' });
  });

  it('marca como forte com tamanho, maiúsculas, número e símbolo', () => {
    expect(getPasswordStrength('S3nh@_F0rt3_Ex')).toEqual({
      level: 'forte',
      score: 3,
      label: 'Forte',
    });
  });
});
