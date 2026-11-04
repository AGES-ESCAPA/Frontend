import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EmployeeTable } from './EmployeeTable';
import type { Employee } from './EmployeeTable.types';

vi.mock('../Badge/Badge', () => ({
  Badge: ({ label, variant }: { label: string; variant: 'success' | 'warning' | 'neutral' }) => (
    <span data-testid="employee-status-badge" data-variant={variant}>
      {label}
    </span>
  ),
}));

const employees: Employee[] = [
  {
    id: '1',
    name: 'Ana Paula Ferreira',
    email: 'ana.ferreira@empresa.com.br',
    assignedCoursesCount: 3,
    status: 'active',
  },
  {
    id: '2',
    name: 'Carlos Eduardo Lima',
    email: 'carlos.lima@empresa.com.br',
    assignedCoursesCount: 1,
    status: 'pending',
  },
  {
    id: '3',
    name: 'Juliana Rocha',
    email: 'juliana.rocha@empresa.com.br',
    assignedCoursesCount: 0,
    status: 'inactive',
  },
];

const setup = (data: Employee[] = employees) => {
  const onEdit = vi.fn();
  const onResendInvite = vi.fn();
  const onUnlink = vi.fn();

  render(
    <EmployeeTable
      employees={data}
      onEdit={onEdit}
      onResendInvite={onResendInvite}
      onUnlink={onUnlink}
    />,
  );

  return { onEdit, onResendInvite, onUnlink };
};

const getEmployeeRow = (name: string) => {
  const row = screen.getByText(name).closest('tr');

  if (!row) {
    throw new Error(`Linha não encontrada: ${name}`);
  }

  return row;
};

describe('EmployeeTable', () => {
  describe('renderização', () => {
    it('renderiza as cinco colunas', () => {
      setup();

      const headers = screen.getAllByRole('columnheader');

      expect(headers).toHaveLength(5);
      expect(headers.map((header) => header.textContent)).toEqual([
        'Nome',
        'E-mail',
        'Cursos atribuídos',
        'Status do acesso',
        'Ações',
      ]);
    });

    it('exibe nome e e-mail dos colaboradores', () => {
      setup();

      expect(screen.getByText('Ana Paula Ferreira')).toBeInTheDocument();

      expect(screen.getByText('ana.ferreira@empresa.com.br')).toBeInTheDocument();
    });

    it('exibe iniciais quando não há foto', async () => {
      setup();

      const row = getEmployeeRow('Ana Paula Ferreira');

      expect(await within(row).findByText('AF')).toBeInTheDocument();
    });

    it('exibe a quantidade de cursos no plural', () => {
      setup();

      const row = getEmployeeRow('Ana Paula Ferreira');
      const cells = within(row).getAllByRole('cell');

      expect(cells[2]).toHaveTextContent('3 cursos');
    });

    it('exibe a quantidade de cursos no singular', () => {
      setup();

      const row = getEmployeeRow('Carlos Eduardo Lima');
      const cells = within(row).getAllByRole('cell');

      expect(cells[2]).toHaveTextContent('1 curso');
    });

    it('exibe corretamente zero cursos', () => {
      setup();

      const row = getEmployeeRow('Juliana Rocha');
      const cells = within(row).getAllByRole('cell');

      expect(cells[2]).toHaveTextContent('0 cursos');
    });

    it.each([
      ['Ana Paula Ferreira', 'Ativo'],
      ['Carlos Eduardo Lima', 'Pendente'],
      ['Juliana Rocha', 'Inativo'],
    ])('exibe o status de %s como %s', (name, status) => {
      setup();

      const row = getEmployeeRow(name);

      expect(within(row).getByText(status)).toBeInTheDocument();
    });

    it.each([
      ['Ana Paula Ferreira', 'Ativo', 'success'],
      ['Carlos Eduardo Lima', 'Pendente', 'warning'],
      ['Juliana Rocha', 'Inativo', 'neutral'],
    ] as const)('utiliza o Badge com a variante correta para %s', (name, status, variant) => {
      setup();

      const row = getEmployeeRow(name);
      const badge = within(row).getByTestId('employee-status-badge');

      expect(badge).toHaveTextContent(status);
      expect(badge).toHaveAttribute('data-variant', variant);
    });

    it('renderiza o estado vazio', () => {
      setup([]);

      expect(screen.getByText('Nenhum colaborador encontrado.')).toBeInTheDocument();

      expect(screen.getAllByRole('row')).toHaveLength(2);
    });
  });

  describe('ações', () => {
    it('executa onEdit com o colaborador correto', async () => {
      const user = userEvent.setup();
      const { onEdit } = setup();

      const row = getEmployeeRow('Ana Paula Ferreira');

      await user.click(
        within(row).getByRole('button', {
          name: 'Editar colaborador',
        }),
      );

      expect(onEdit).toHaveBeenCalledTimes(1);
      expect(onEdit).toHaveBeenCalledWith(employees[0]);
    });

    it('executa onResendInvite para colaborador pendente', async () => {
      const user = userEvent.setup();
      const { onResendInvite } = setup();

      const row = getEmployeeRow('Carlos Eduardo Lima');

      await user.click(
        within(row).getByRole('button', {
          name: 'Reenviar convite',
        }),
      );

      expect(onResendInvite).toHaveBeenCalledTimes(1);
      expect(onResendInvite).toHaveBeenCalledWith(employees[1]);
    });

    it('executa onUnlink com o colaborador correto', async () => {
      const user = userEvent.setup();
      const { onUnlink } = setup();

      const row = getEmployeeRow('Juliana Rocha');

      await user.click(
        within(row).getByRole('button', {
          name: 'Desvincular colaborador',
        }),
      );

      expect(onUnlink).toHaveBeenCalledTimes(1);
      expect(onUnlink).toHaveBeenCalledWith(employees[2]);
    });

    it('habilita reenvio para colaboradores pendentes', () => {
      setup();

      const row = getEmployeeRow('Carlos Eduardo Lima');

      expect(
        within(row).getByRole('button', {
          name: 'Reenviar convite',
        }),
      ).toBeEnabled();
    });

    it.each(['Ana Paula Ferreira', 'Juliana Rocha'])('desabilita reenvio para %s', (name) => {
      setup();

      const row = getEmployeeRow(name);

      expect(
        within(row).getByRole('button', {
          name: 'Reenviar convite',
        }),
      ).toBeDisabled();
    });

    it.each(['Ana Paula Ferreira', 'Juliana Rocha'])(
      'não executa reenvio para %s',
      async (name) => {
        const user = userEvent.setup();
        const { onResendInvite } = setup();

        const row = getEmployeeRow(name);

        const resendButton = within(row).getByRole('button', {
          name: 'Reenviar convite',
        });

        expect(resendButton).toBeDisabled();

        await user.click(resendButton);

        expect(onResendInvite).not.toHaveBeenCalled();
      },
    );

    it('possui os três nomes acessíveis exigidos', () => {
      setup();

      const row = getEmployeeRow('Ana Paula Ferreira');

      for (const name of ['Editar colaborador', 'Reenviar convite', 'Desvincular colaborador']) {
        expect(within(row).getByRole('button', { name })).toBeInTheDocument();
      }
    });

    it('permite editar e desvincular pelo teclado', async () => {
      const user = userEvent.setup();
      const { onEdit, onUnlink } = setup([employees[0]]);

      await user.tab();

      expect(
        screen.getByRole('button', {
          name: 'Editar colaborador',
        }),
      ).toHaveFocus();

      await user.keyboard('{Enter}');

      expect(onEdit).toHaveBeenCalledTimes(1);
      expect(onEdit).toHaveBeenCalledWith(employees[0]);

      await user.tab();

      expect(
        screen.getByRole('button', {
          name: 'Desvincular colaborador',
        }),
      ).toHaveFocus();

      await user.keyboard(' ');

      expect(onUnlink).toHaveBeenCalledTimes(1);
      expect(onUnlink).toHaveBeenCalledWith(employees[0]);
    });

    it('permite reenviar convite pelo teclado para colaborador pendente', async () => {
      const user = userEvent.setup();
      const { onResendInvite } = setup([employees[1]]);

      await user.tab();
      await user.tab();

      const resendButton = screen.getByRole('button', {
        name: 'Reenviar convite',
      });

      expect(resendButton).toHaveFocus();

      await user.keyboard('{Enter}');

      expect(onResendInvite).toHaveBeenCalledTimes(1);
      expect(onResendInvite).toHaveBeenCalledWith(employees[1]);
    });

    it('executa ações nas linhas correspondentes', async () => {
      const user = userEvent.setup();
      const { onEdit } = setup();

      const firstRow = getEmployeeRow('Ana Paula Ferreira');
      const secondRow = getEmployeeRow('Carlos Eduardo Lima');

      await user.click(
        within(firstRow).getByRole('button', {
          name: 'Editar colaborador',
        }),
      );

      await user.click(
        within(secondRow).getByRole('button', {
          name: 'Editar colaborador',
        }),
      );

      expect(onEdit).toHaveBeenCalledTimes(2);
      expect(onEdit).toHaveBeenNthCalledWith(1, employees[0]);
      expect(onEdit).toHaveBeenNthCalledWith(2, employees[1]);
    });

    it('não dispara callbacks de outras ações', async () => {
      const user = userEvent.setup();
      const { onEdit, onResendInvite, onUnlink } = setup();

      const row = getEmployeeRow('Carlos Eduardo Lima');

      await user.click(
        within(row).getByRole('button', {
          name: 'Editar colaborador',
        }),
      );

      expect(onEdit).toHaveBeenCalledTimes(1);
      expect(onResendInvite).not.toHaveBeenCalled();
      expect(onUnlink).not.toHaveBeenCalled();
    });
  });
});
