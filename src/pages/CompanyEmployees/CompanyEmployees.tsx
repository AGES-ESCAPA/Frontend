import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthenticatedLayout, SIDEBAR_MENU_PRESETS } from '@components/layout';
import type { SidebarUser } from '@components/layout';
import {
  Button,
  EmployeeFormModal,
  EmployeeTable,
  EmptyState,
  Modal,
  ProgressBar,
  SearchBar,
  SumCard,
  Toast,
} from '@components/ui';
import type { Employee, EmployeeFormField, EmployeeFormValues } from '@components/ui';
import { useCompanySeats } from '@hooks/useCompanySeats';
import { useCompanyEmployees } from '@hooks/useCompanyEmployees';
import { useToast } from '@hooks/useToast';
import { mapCompanyEmployeeToRow } from '@utils/mapCompanyEmployee';
import {
  CompanyEmployeeServiceError,
  companyEmployeeService,
  NO_SEATS_AVAILABLE_MESSAGE,
} from '@services/companyEmployeeService';
import styles from './CompanyEmployees.module.css';

const COMPANY_USER: SidebarUser = {
  name: 'Empresa',
  role: 'Gestor Empresa',
};

const menuItems = SIDEBAR_MENU_PRESETS.company.map((item) => ({
  ...item,
  active: item.route === '/empresa/colaboradores',
}));

const SkeletonCards = () => (
  <div className={styles.cards} role="status" aria-label="Carregando resumo de vagas">
    {Array.from({ length: 3 }, (_, index) => (
      <div key={index} className={styles.cardSkeleton} aria-hidden="true" />
    ))}
  </div>
);

const SkeletonTable = () => (
  <div role="status" aria-label="Carregando colaboradores" className={styles.tableSkeleton}>
    {Array.from({ length: 5 }, (_, index) => (
      <div key={index} className={styles.tableSkeletonRow} aria-hidden="true" />
    ))}
  </div>
);

export const CompanyEmployees = () => {
  const navigate = useNavigate();
  const [inputSearch, setInputSearch] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const { toast, isOpen: isToastOpen, showToast, dismissToast } = useToast();
  const [employeeFormOpen, setEmployeeFormOpen] = useState(false);
  const [noSeatsNoticeOpen, setNoSeatsNoticeOpen] = useState(false);
  const [isSubmittingEmployee, setIsSubmittingEmployee] = useState(false);
  const [employeeFormFieldErrors, setEmployeeFormFieldErrors] = useState<
    Partial<Record<EmployeeFormField, string>>
  >({});

  const {
    seats,
    status: seatsStatus,
    errorMessage: seatsError,
    reload: reloadSeats,
  } = useCompanySeats();

  const {
    employees,
    status: employeesStatus,
    errorMessage: employeesError,
    totalElements,
    totalPages,
    reload: reloadEmployees,
  } = useCompanyEmployees(search, page);

  const rows = useMemo(() => employees.map(mapCompanyEmployeeToRow), [employees]);
  const isLoadingEmployees = employeesStatus === 'loading';
  const showEmployeesTable = employeesStatus !== 'error' && rows.length > 0;
  const showEmployeesFooter =
    employeesStatus === 'success' || (isLoadingEmployees && rows.length > 0);

  const reloadAll = useCallback(() => {
    reloadSeats();
    reloadEmployees();
  }, [reloadSeats, reloadEmployees]);

  const handleSearch = useCallback((value: string) => {
    setPage(0);
    setSearch(value.trim());
  }, []);

  const openCreateForm = () => {
    setActionNotice(null);
    if (seatsStatus === 'success' && seats?.seatsAvailable === 0) {
      setNoSeatsNoticeOpen(true);
      return;
    }

    setEmployeeFormOpen(true);
    setEmployeeFormFieldErrors({});
  };

  const openEditForm = (employee: Employee) => {
    setActionNotice(`Edição de ${employee.name} estará disponível em breve.`);
  };

  const resendInvitation = async (employeeId: string, employeeName: string) => {
    try {
      const result = await companyEmployeeService.resendInvite(employeeId);
      if (!result.inviteSent) {
        showToast(
          'error',
          'Convite não enviado',
          `Não foi possível enviar o convite para ${result.email}. Tente novamente mais tarde.`,
        );
        return;
      }

      showToast('success', 'Convite reenviado', `Um novo e-mail foi enviado para ${employeeName}.`);
    } catch (error: unknown) {
      showToast(
        'error',
        'Não foi possível reenviar o convite',
        error instanceof Error ? error.message : 'Tente novamente mais tarde.',
      );
    }
  };

  const handleEmployeeSubmit = async (values: EmployeeFormValues) => {
    setIsSubmittingEmployee(true);
    setActionNotice(null);

    try {
      const result = await companyEmployeeService.createEmployee({
        name: values.name,
        email: values.email,
      });
      if (result.inviteSent) {
        showToast(
          'success',
          'Colaborador cadastrado',
          'O convite para criar a senha foi enviado por e-mail.',
        );
      } else {
        showToast(
          'error',
          'Colaborador cadastrado, convite não enviado',
          'O cadastro foi salvo, mas não foi possível enviar o convite.',
          {
            label: 'Reenviar convite',
            onAction: () => {
              void resendInvitation(result.id, result.name);
            },
          },
        );
      }

      reloadAll();
    } catch (error: unknown) {
      if (error instanceof CompanyEmployeeServiceError && error.status === 409) {
        if (error.message === 'Este e-mail já está cadastrado.') {
          setEmployeeFormFieldErrors({ email: error.message });
        } else if (error.message === NO_SEATS_AVAILABLE_MESSAGE) {
          setEmployeeFormOpen(false);
          setNoSeatsNoticeOpen(true);
        }
      }
      throw error;
    } finally {
      setIsSubmittingEmployee(false);
    }
  };

  useEffect(() => {
    if (employeesStatus === 'success' && totalPages > 0 && page >= totalPages) {
      setPage(totalPages - 1);
    }
  }, [employeesStatus, page, totalPages]);

  return (
    <AuthenticatedLayout role="company" items={menuItems} user={COMPANY_USER}>
      <div className={styles.page}>
        <header className={styles.heading}>
          <div>
            <p className={styles.eyebrow}>Painel corporativo</p>
            <h1>Gestão de Funcionários</h1>
          </div>
          <Button
            type="button"
            variant="secondary"
            label="Atualizar dados"
            icon={<RefreshCw size={18} aria-hidden="true" />}
            onClick={reloadAll}
          />
        </header>

        <section aria-label="Resumo das vagas" className={styles.summary}>
          {seatsStatus === 'loading' ? <SkeletonCards /> : null}
          {seatsStatus === 'error' ? (
            <div role="alert" className={styles.error}>
              <p>{seatsError}</p>
              <Button
                type="button"
                label="Tentar novamente"
                aria-label="Tentar carregar as vagas novamente"
                variant="outlined"
                onClick={reloadSeats}
              />
            </div>
          ) : null}
          {seatsStatus === 'success' && seats ? (
            <div className={styles.cards}>
              <SumCard
                label="Vagas contratadas"
                value={seats.seatsTotal}
                description="Total de vagas do plano"
              />
              <SumCard
                label="Vagas ocupadas"
                value={seats.seatsUsed}
                description={`${seats.seatsAvailable} ${seats.seatsAvailable === 1 ? 'vaga disponível' : 'vagas disponíveis'}`}
              />
              <SumCard
                label="Total de colaboradores"
                value={seats.employeesTotal}
                description={`${seats.employeesActive} ${seats.employeesActive === 1 ? 'ativo' : 'ativos'}`}
              />
            </div>
          ) : null}
        </section>

        <section aria-labelledby="collaborators-heading" className={styles.panel}>
          <div className={styles.toolbar}>
            <div className={styles.panelTitle}>
              <h2 id="collaborators-heading">Colaboradores</h2>
              {employeesStatus === 'success' ? (
                <span className={styles.count}>{totalElements}</span>
              ) : null}
            </div>
            <div className={styles.controls}>
              <div className={styles.search}>
                <SearchBar
                  value={inputSearch}
                  onChange={setInputSearch}
                  onSearch={handleSearch}
                  placeholder="Buscar colaborador"
                  aria-label="Buscar colaborador por nome ou e-mail"
                />
              </div>
              <Button
                type="button"
                variant="primary"
                label="Cadastrar Colaborador"
                icon={<UserPlus size={18} aria-hidden="true" />}
                onClick={openCreateForm}
              />
            </div>
          </div>

          {seatsStatus === 'loading' ? (
            <div
              role="status"
              aria-label="Carregando ocupação das vagas"
              className={styles.progressSkeleton}
            />
          ) : null}
          {seatsStatus === 'success' && seats ? (
            <div className={styles.occupancy}>
              <span>
                {seats.seatsUsed}/{seats.seatsTotal} vagas
              </span>
              <ProgressBar
                value={seats.seatsUsed}
                max={seats.seatsTotal}
                aria-label="Ocupação das vagas contratadas"
                valueLabel={`${seats.seatsUsed} de ${seats.seatsTotal} vagas ocupadas`}
              />
            </div>
          ) : null}
          {isLoadingEmployees && rows.length === 0 ? <SkeletonTable /> : null}
          {employeesStatus === 'error' ? (
            <div className={styles.state} role="alert">
              <p>{employeesError}</p>
              <Button
                type="button"
                variant="outlined"
                label="Tentar novamente"
                aria-label="Tentar carregar os colaboradores novamente"
                onClick={reloadEmployees}
              />
            </div>
          ) : null}
          {employeesStatus === 'success' && rows.length === 0 ? (
            <EmptyState
              title={search ? 'Nenhum resultado para a busca' : 'Nenhum colaborador cadastrado'}
              description={
                search
                  ? 'Tente outro nome ou e-mail, ou limpe a pesquisa.'
                  : 'Cadastre o primeiro colaborador para começar a utilizar as vagas contratadas.'
              }
            />
          ) : null}
          {showEmployeesTable ? (
            <div className={styles.tableWrapper}>
              {isLoadingEmployees ? (
                <span role="status" className={styles.loadingIndicator}>
                  Atualizando colaboradores...
                </span>
              ) : null}
              <EmployeeTable
                employees={rows}
                onEdit={openEditForm}
                onResendInvite={(employee) => void resendInvitation(employee.id, employee.name)}
                onUnlink={(employee) =>
                  setActionNotice(`Desvinculação de ${employee.name} estará disponível em breve.`)
                }
              />
            </div>
          ) : null}
          {actionNotice ? (
            <p role="status" className={styles.notice}>
              {actionNotice}
            </p>
          ) : null}
          {showEmployeesFooter ? (
            <footer className={styles.footer}>
              <span>
                Exibindo {rows.length} de {totalElements} colaboradores
              </span>
              <span>A empresa não consome cursos no perfil gestor</span>
              {totalPages > 1 ? (
                <nav aria-label="Paginação de colaboradores" className={styles.pagination}>
                  <Button
                    type="button"
                    variant="outlined"
                    label="Anterior"
                    disabled={page === 0 || isLoadingEmployees}
                    onClick={() => setPage((current) => Math.max(0, current - 1))}
                  />
                  <span>
                    Página {page + 1} de {totalPages}
                  </span>
                  <Button
                    type="button"
                    variant="outlined"
                    label="Próxima"
                    disabled={page + 1 >= totalPages || isLoadingEmployees}
                    onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
                  />
                </nav>
              ) : null}
            </footer>
          ) : null}
        </section>

        <EmployeeFormModal
          open={employeeFormOpen}
          onOpenChange={setEmployeeFormOpen}
          mode="create"
          onSubmit={handleEmployeeSubmit}
          fieldErrors={employeeFormFieldErrors}
          isSubmitting={isSubmittingEmployee}
        />
        <Modal
          open={noSeatsNoticeOpen}
          onOpenChange={setNoSeatsNoticeOpen}
          title="Vagas esgotadas"
          size="sm"
          footer={
            <>
              <Button
                type="button"
                label="Fechar"
                variant="secondary"
                onClick={() => setNoSeatsNoticeOpen(false)}
              />
              <Button
                type="button"
                label="Comprar vagas"
                variant="primary"
                onClick={() => {
                  setNoSeatsNoticeOpen(false);
                  navigate('/checkout/assentos?quantidade=1');
                }}
              />
            </>
          }
        >
          <p role="alert">
            Suas vagas acabaram. Compre mais assentos para cadastrar um novo colaborador.
          </p>
        </Modal>
        <Toast
          key={toast?.key}
          open={isToastOpen}
          onOpenChange={(open) => {
            if (!open) dismissToast();
          }}
          title={toast?.title ?? ''}
          description={toast?.description}
          variant={toast?.variant}
          actionLabel={toast?.action?.label}
          onAction={toast?.action?.onAction}
        />
      </div>
    </AuthenticatedLayout>
  );
};
