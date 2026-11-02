import { ChevronDown, Pencil, Send, UserMinus } from 'lucide-react';
import { Avatar } from '../Avatar/Avatar';
import { Table } from '../Table/Table';
import type { TableColumn } from '../Table/Table';
import type { Employee, EmployeeStatus, EmployeeTableProps } from './EmployeeTable.types';
import styles from './EmployeeTable.module.css';

const STATUS_CONFIG: Record<EmployeeStatus, { label: string }> = {
  active: { label: 'Ativo' },
  pending: { label: 'Pendente' },
  inactive: { label: 'Inativo' },
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
            <Avatar name={employee.name} imageUrl={employee.avatarUrl} theme="dark" size="sm" />
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
          <strong>{employee.assignedCoursesCount}</strong>{' '}
          {employee.assignedCoursesCount === 1 ? 'curso' : 'cursos'}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status do acesso',
      align: 'center',
      render: (employee) => {
        const config = STATUS_CONFIG[employee.status];

        return (
          <span
            className={`${styles.statusBadge} ${styles[employee.status]}`}
            aria-label={`Status do acesso: ${config.label}`}
          >
            <span className={styles.statusDot} aria-hidden="true" />
            <span>{config.label}</span>
            <ChevronDown size={12} aria-hidden="true" />
          </span>
        );
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
            disabled={employee.status !== 'pending'}
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
