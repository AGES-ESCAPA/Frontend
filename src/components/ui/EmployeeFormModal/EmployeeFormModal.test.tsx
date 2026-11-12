import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EmployeeFormModal } from './EmployeeFormModal';
import type { EmployeeFormModalProps, EmployeeFormValues } from './EmployeeFormModal';

// Inicializa o user configurado para rodar os testes sem delay de digitação artificial
const user = userEvent.setup();

const renderModal = (props: Partial<EmployeeFormModalProps> = {}) => {
  const onSubmit = vi.fn();
  const onOpenChange = vi.fn();

  render(
    <EmployeeFormModal
      open
      onOpenChange={onOpenChange}
      mode="create"
      onSubmit={onSubmit}
      {...props}
    />,
  );

  return { onSubmit, onOpenChange };
};

const fillRequiredFields = async (email = 'ana@empresa.com.br') => {
  await user.type(screen.getByLabelText(/^Nome completo/), 'Ana Silva');
  await user.type(screen.getByLabelText(/^E-mail corporativo/), email);
  await user.type(screen.getByLabelText(/^Cargo/), 'Analista de Turismo');
};

afterEach(() => cleanup());

describe('EmployeeFormModal', () => {
  it('renders the create form and submits the required employee fields', async () => {
    const { onSubmit, onOpenChange } = renderModal();

    expect(screen.getByRole('dialog', { name: 'Cadastrar Colaborador' })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Nome completo/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^E-mail corporativo/)).toHaveAttribute('type', 'email');
    expect(screen.getByLabelText(/^Cargo/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/^Status do acesso/)).not.toBeInTheDocument();

    await fillRequiredFields();
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Ana Silva',
      email: 'ana@empresa.com.br',
      role: 'Analista de Turismo',
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  }, 10_000);

  it('prefills the employee details and access status in edit mode', () => {
    renderModal({
      mode: 'edit',
      initialValues: {
        name: 'Bruna Costa',
        email: 'bruna@empresa.com.br',
        role: 'Coordenadora',
        accessStatus: 'active',
      },
    });

    expect(screen.getByRole('dialog', { name: 'Editar Colaborador' })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Nome completo/)).toHaveValue('Bruna Costa');
    expect(screen.getByLabelText(/^E-mail corporativo/)).toHaveValue('bruna@empresa.com.br');
    expect(screen.getByLabelText(/^Cargo/)).toHaveValue('Coordenadora');
    expect(screen.getByLabelText(/^Status do acesso/)).toHaveValue('active');
    expect(screen.getByRole('option', { name: 'Ativo' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Inativo' })).toBeInTheDocument();
  });

  it('blocks empty required fields and invalid email with field-level errors', async () => {
    renderModal();

    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByText('Informe o nome completo.')).toBeInTheDocument();
    expect(screen.getByText('Informe o e-mail corporativo.')).toBeInTheDocument();
    expect(screen.getByText('Informe o cargo.')).toBeInTheDocument();
    expect(screen.getByLabelText(/^Nome completo/)).toHaveAttribute('aria-invalid', 'true');

    await user.type(screen.getByLabelText(/^Nome completo/), 'Ana Silva');
    await user.type(screen.getByLabelText(/^E-mail corporativo/), 'email-invalido');
    await user.type(screen.getByLabelText(/^Cargo/), 'Analista');

    expect(await screen.findByText('Informe um e-mail válido.')).toBeInTheDocument();
  });

  it('limits a pending employee to the pending and inactive status options', async () => {
    const { onSubmit } = renderModal({
      mode: 'edit',
      initialValues: {
        name: 'Carlos Lima',
        email: 'carlos@empresa.com.br',
        role: 'Consultor',
        accessStatus: 'pending',
      },
    });
    const statusSelect = screen.getByLabelText(/^Status do acesso/);
    const options = within(statusSelect).getAllByRole('option');

    expect(statusSelect).toHaveValue('pending');
    expect(options.map((option) => option.textContent)).toEqual(['Pendente', 'Inativo']);

    await user.selectOptions(statusSelect, 'inactive');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Carlos Lima',
      email: 'carlos@empresa.com.br',
      role: 'Consultor',
      accessStatus: 'inactive',
    });
  });

  it('shows API field errors beside their matching inputs', () => {
    renderModal({
      fieldErrors: { email: 'Este e-mail já está cadastrado.' },
    });

    expect(screen.getByText('Este e-mail já está cadastrado.')).toBeInTheDocument();
    expect(screen.getByLabelText(/^E-mail corporativo/)).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText(/^Nome completo/)).not.toHaveAttribute('aria-invalid', 'true');
  });

  it('disables the form and shows loading while a submission is in progress', () => {
    renderModal({ isSubmitting: true });

    expect(screen.getByLabelText(/^Nome completo/)).toBeDisabled();
    expect(screen.getByLabelText(/^E-mail corporativo/)).toBeDisabled();
    expect(screen.getByLabelText(/^Cargo/)).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Salvar' })).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
  });

  it('keeps the form open and displays an unexpected submit error', async () => {
    const onSubmit = vi
      .fn<(...args: [EmployeeFormValues]) => Promise<void>>()
      .mockRejectedValue(new Error('Falha ao salvar'));
    const { onOpenChange } = renderModal({ onSubmit });

    await fillRequiredFields();
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Falha ao salvar');
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it('does not close the modal when cancel is clicked during submission', () => {
    const { onOpenChange } = renderModal({ isSubmitting: true });

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
