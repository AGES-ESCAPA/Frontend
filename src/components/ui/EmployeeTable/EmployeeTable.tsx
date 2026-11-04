import { Pencil, Send, UserMinus } from 'lucide-react';
import { Avatar } from '@components/ui/Avatar/Avatar';
import { Badge } from '@components/ui/Badge/Badge';
import { Table } from '@components/ui/Table/Table';
import type { TableColumn } from '@components/ui/Table/Table';
import type { Employee, EmployeeStatus, EmployeeTableProps } from './EmployeeTable.types';
import styles from './EmployeeTable.module.css';

type NormalizedEmployeeStatus = 'active' | 'pending' | 'inactive';

const STATUS_CONFIG = {
  active: { label: 'Ativo', variant: 'success' },
  pending: { label: 'Pendente', variant: 'warning' },
  inactive: { label: 'Inativo', variant: 'neutral' },
} as const satisfies Record<
  NormalizedEmployeeStatus,
  { label: string; variant: 'success' | 'warning' | 'neutral' }
>;

const normalizeStatus = (status: EmployeeStatus): NormalizedEmployeeStatus => {
  return status.toLowerCase() as NormalizedEmployeeStatus;
};

export const EmployeeTable = ({
  employees,
  onEdit,
  onResendInvite,
  onUnlink,
}: EmployeeTableProps) => {
  const columns: TableColumn<Employee>[] = [
    {
      id: 'name',
      header: 'Nome',
      align: 'start',
      render: (employee) => (
        <div className={styles.employee}>
          <span className={styles.avatar}>
            <Avatar
              name={employee.name}
              imageUrl={employee.avatarUrl ?? undefined}
              theme="dark"
              size="sm"
            />
          </span>
          <span className={styles.name}>{employee.name}</span>
        </div>
      ),
    },
    {
      id: 'email',
      header: 'E-mail',
      align: 'start',
      render: (employee) => <span className={styles.email}>{employee.email}</span>,
    },
    {
      id: 'courses',
      header: 'Cursos atribuídos',
      align: 'center',
      render: (employee) => (
        <span className={styles.courses}>
          <strong>{employee.assignedCourses}</strong>{' '}
          {employee.assignedCourses === 1 ? 'curso' : 'cursos'}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status do acesso',
      align: 'center',
      render: (employee) => {
        const status = normalizeStatus(employee.status);
        const config = STATUS_CONFIG[status];

        return <Badge label={config.label} variant={config.variant} />;
      },
    },
    {
      id: 'actions',
      header: 'Ações',
      align: 'center',
      render: (employee) => (
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.actionButton}
            aria-label="Editar colaborador"
            title="Editar colaborador"
            onClick={() => onEdit(employee)}
          >
            <Pencil aria-hidden="true" size={16} />
          </button>

          <button
            type="button"
            className={styles.actionButton}
            aria-label="Reenviar convite"
            title="Reenviar convite"
            disabled={normalizeStatus(employee.status) !== 'pending'}
            onClick={() => onResendInvite(employee)}
          >
            <Send aria-hidden="true" size={16} />
          </button>

          <button
            type="button"
            className={styles.actionButton}
            aria-label="Desvincular colaborador"
            title="Desvincular colaborador"
            onClick={() => onUnlink(employee)}
          >
            <UserMinus aria-hidden="true" size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <Table<Employee>
      className={styles.tableWrapper}
      columns={columns}
      data={employees}
      getRowId={(employee) => employee.id}
      caption="Tabela de colaboradores"
      emptyMessage="Nenhum colaborador encontrado."
    />
  );
};
