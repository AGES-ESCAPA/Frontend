import { useMemo, useRef, useState } from 'react';
import { MailPlus, Pencil, UserPlus } from 'lucide-react';
import { AuthenticatedLayout, SIDEBAR_MENU_PRESETS } from '@components/layout';
import type { SidebarUser } from '@components/layout';
import { Badge, Button } from '@components/ui';
import { EmployeeFormModal } from './components/EmployeeFormModal';
import type { EmployeeAccessStatus, EmployeeFormValues } from './components/EmployeeFormModal';
import styles from './EmployeeManagement.module.css';

interface DemoEmployee extends EmployeeFormValues {
  id: string;
}

const DEMO_EMPLOYEES: DemoEmployee[] = [
  {
    id: 'demo-pending',
    name: 'Ana Costa (exemplo)',
    email: 'ana.costa@exemplo.com',
    jobTitle: 'Gerente de operações',
    status: 'PENDING',
  },
  {
    id: 'demo-active',
    name: 'Carlos Mendes (exemplo)',
    email: 'carlos.mendes@exemplo.com',
    jobTitle: 'Agente de viagens',
    status: 'ACTIVE',
  },
];

const STATUS_LABELS: Record<EmployeeAccessStatus, string> = {
  PENDING: 'Pendente',
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
};

const STATUS_VARIANTS = {
  PENDING: 'warning',
  ACTIVE: 'success',
  INACTIVE: 'neutral',
} as const;

const FALLBACK_USER: SidebarUser = { name: '', role: '', email: '' };

export const EmployeeManagement = () => {
  const [employees, setEmployees] = useState(DEMO_EMPLOYEES);
  const [modalOpen, setModalOpen] = useState(false);
  const [employeeBeingEdited, setEmployeeBeingEdited] = useState<DemoEmployee | null>(null);
  const [feedback, setFeedback] = useState('');
  const nextId = useRef(1);

  const menuItems = useMemo(
    () =>
      SIDEBAR_MENU_PRESETS.company.map((item) => ({
        ...item,
        active: item.route === '/empresa/colaboradores',
      })),
    [],
  );

  const openCreateModal = () => {
    setEmployeeBeingEdited(null);
    setModalOpen(true);
    setFeedback('');
  };

  const openEditModal = (employee: DemoEmployee) => {
    setEmployeeBeingEdited(employee);
    setModalOpen(true);
    setFeedback('');
  };

  const handleSubmit = (values: EmployeeFormValues) => {
    if (employeeBeingEdited) {
      setEmployees((current) =>
        current.map((employee) =>
          employee.id === employeeBeingEdited.id ? { ...employee, ...values } : employee,
        ),
      );
    } else {
      const id = `demo-new-${nextId.current}`;
      nextId.current += 1;
      setEmployees((current) => [...current, { id, ...values }]);
    }

    setModalOpen(false);
    setFeedback('Prévia atualizada nesta página. Nenhum dado foi enviado ou salvo no backend.');
  };

  const handleResendInvitation = () => {
    setFeedback(
      'Convite não enviado: a integração de convites com o backend ainda não está disponível.',
    );
  };

  return (
    <AuthenticatedLayout role="company" items={menuItems} user={FALLBACK_USER}>
      <section className={styles.page} aria-labelledby="employee-management-title">
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Área da Empresa</p>
            <h1 id="employee-management-title" className={styles.title}>
              Gestão de Colaboradores
            </h1>
            <p className={styles.description}>
              Cadastre colaboradores e acompanhe o status dos convites de acesso.
            </p>
          </div>
          <Button
            type="button"
            variant="primary"
            label="Cadastrar Colaborador"
            icon={<UserPlus size={18} aria-hidden="true" />}
            onClick={openCreateModal}
          />
        </header>

        <aside className={styles.demoNotice} role="note">
          <strong>Modo de demonstração</strong>
          <span>
            Os exemplos e alterações são locais a esta página. Cadastro, vagas e envio de convites
            ainda não estão conectados ao backend.
          </span>
        </aside>

        {feedback ? (
          <p className={styles.feedback} role="status">
            {feedback}
          </p>
        ) : null}

        <section className={styles.panel} aria-labelledby="employee-list-title">
          <div className={styles.panelHeader}>
            <div>
              <h2 id="employee-list-title">Colaboradores</h2>
              <span className={styles.count}>{employees.length} na demonstração</span>
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Nome</th>
                  <th scope="col">E-mail</th>
                  <th scope="col">Cargo</th>
                  <th scope="col">Status do acesso</th>
                  <th scope="col">Ações</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.id}>
                    <td>{employee.name}</td>
                    <td>{employee.email}</td>
                    <td>{employee.jobTitle}</td>
                    <td>
                      <Badge
                        label={STATUS_LABELS[employee.status]}
                        variant={STATUS_VARIANTS[employee.status]}
                        mini
                      />
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <Button
                          type="button"
                          variant="ghost-dark"
                          label={`Editar ${employee.name}`}
                          icon={<Pencil size={16} aria-hidden="true" />}
                          onClick={() => openEditModal(employee)}
                        />
                        {employee.status === 'PENDING' ? (
                          <Button
                            type="button"
                            variant="ghost-dark"
                            label={`Reenviar convite para ${employee.name}`}
                            icon={<MailPlus size={16} aria-hidden="true" />}
                            onClick={handleResendInvitation}
                          />
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <EmployeeFormModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          mode={employeeBeingEdited ? 'edit' : 'create'}
          initialValues={employeeBeingEdited ?? undefined}
          onSubmit={handleSubmit}
        />
      </section>
    </AuthenticatedLayout>
  );
};
