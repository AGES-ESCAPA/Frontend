import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Toast } from '@components/ui';
import { useToast } from '@hooks/useToast';

/** Mantém a confirmação visível depois de sair do formulário. */
export const RegistrationFeedback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast, isOpen, showToast, dismissToast } = useToast();
  useEffect(() => {
    const state: unknown = location.state;
    if (
      state === null ||
      typeof state !== 'object' ||
      !('registrationSuccess' in state) ||
      state.registrationSuccess !== true
    )
      return;
    showToast('success', 'Cadastro realizado com sucesso!', 'Você já está conectado à plataforma.');
    const rest = Object.fromEntries(
      Object.entries(state).filter(([key]) => key !== 'registrationSuccess'),
    );
    navigate(`${location.pathname}${location.search}${location.hash}`, {
      replace: true,
      state: rest,
    });
  }, [location, navigate, showToast]);
  return toast === null ? null : (
    <Toast
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) dismissToast();
      }}
      variant={toast.variant}
      title={toast.title}
      description={toast.description}
    />
  );
};
