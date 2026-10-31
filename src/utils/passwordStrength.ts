export type PasswordStrengthLevel = 'fraca' | 'media' | 'forte';

export interface PasswordStrength {
  level: PasswordStrengthLevel | 'vazia';
  /** Segmentos preenchidos da barra, de 0 a 3. Zero enquanto a senha está vazia. */
  score: 0 | 1 | 2 | 3;
  label: '' | 'Fraca' | 'Média' | 'Forte';
}

const countCriteria = (password: string) =>
  [
    password.length >= 8,
    /[a-z]/.test(password) && /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

/** Três níveis da barra em "Nova Senha": fraca, média e forte. Vazia mantém a barra visível. */
export const getPasswordStrength = (password: string): PasswordStrength => {
  if (password.length === 0) return { level: 'vazia', score: 0, label: '' };

  const criteria = countCriteria(password);
  if (criteria <= 1) return { level: 'fraca', score: 1, label: 'Fraca' };
  if (criteria <= 3) return { level: 'media', score: 2, label: 'Média' };
  return { level: 'forte', score: 3, label: 'Forte' };
};
