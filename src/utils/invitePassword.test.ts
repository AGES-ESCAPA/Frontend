import { describe, expect, it } from 'vitest';
import { hasInvitePasswordErrors, validateInvitePassword } from './invitePassword';

describe('validateInvitePassword', () => {
  it('accepts matching passwords with at least 8 characters', () => {
    expect(
      validateInvitePassword({ password: 'senha-segura', passwordConfirmation: 'senha-segura' }),
    ).toEqual({});
  });

  it('requires both fields', () => {
    expect(validateInvitePassword({ password: '', passwordConfirmation: '' })).toEqual({
      password: 'Informe sua senha.',
      passwordConfirmation: 'Confirme sua senha.',
    });
  });

  it('rejects a password shorter than 8 characters', () => {
    expect(
      validateInvitePassword({ password: '1234567', passwordConfirmation: '1234567' }),
    ).toEqual({ password: 'A senha deve ter pelo menos 8 caracteres.' });
  });

  it('rejects a confirmation that differs from the password', () => {
    expect(
      validateInvitePassword({ password: 'senha-segura', passwordConfirmation: 'outra-senha' }),
    ).toEqual({ passwordConfirmation: 'As senhas devem ser iguais.' });
  });
});

describe('hasInvitePasswordErrors', () => {
  it('ignores fields whose error was cleared', () => {
    expect(hasInvitePasswordErrors({ password: undefined })).toBe(false);
    expect(hasInvitePasswordErrors({ password: 'Informe sua senha.' })).toBe(true);
  });
});
