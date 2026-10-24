export type MockUserRole = 'student' | 'company' | 'admin';

const MOCK_USER_ROLE_KEY = 'escapa_mock_user_role';

// Salva o perfil demo no navegador para que a guarda consulte a escolha do login.
export const getMockUserRole = (): MockUserRole | null => {
  const role = localStorage.getItem(MOCK_USER_ROLE_KEY);
  // Aceita apenas os perfis conhecidos e evita tratar valores inválidos como autenticados.
  return role === 'student' || role === 'company' || role === 'admin' ? role : null;
};

// Atualiza o perfil demo quando o usuário escolhe uma opção na tela de login.
export const setMockUserRole = (role: MockUserRole): void => {
  localStorage.setItem(MOCK_USER_ROLE_KEY, role);
};
