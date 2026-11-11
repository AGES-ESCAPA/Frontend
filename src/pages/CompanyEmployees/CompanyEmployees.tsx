import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RefreshCw, UserPlus } from 'lucide-react';
import { AuthenticatedLayout, SIDEBAR_MENU_PRESETS } from '@components/layout';
import type { SidebarUser } from '@components/layout';
import {
  Button,
  ConfirmDialog,
  EmployeeTable,
  EmptyState,
  ProgressBar,
  SearchBar,
  SumCard,
  Toast,
} from '@components/ui';
import type { Employee } from '@components/ui';
import { useCompanySeats } from '@hooks/useCompanySeats';
import { useToast } from '@hooks/useToast';
import {
  CompanyEmployeeServiceError,
  companyEmployeeService,
} from '@services/companyEmployeeService';
import { useCompanyEmployees } from '@hooks/useCompanyEmployees';
import { mapCompanyEmployeeToRow } from '@utils/mapCompanyEmployee';
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
  const [inputSearch, setInputSearch] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [employeeToUnlink, setEmployeeToUnlink] = useState<Employee | null>(null);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [unlinkError, setUnlinkError] = useState<string | null>(null);
  const unlinkInProgress = useRef(false);
  const { toast, isOpen, showToast, dismissToast } = useToast();

  const {
    seats,
    status: seatsStatus,
    errorMessage: seatsError,
    reload: reloadSeats,
    applySeats,
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

  useEffect(() => {
    if (employeesStatus === 'success' && totalPages > 0 && page >= totalPages) {
      setPage(totalPages - 1);
    }
  }, [employeesStatus, page, totalPages]);

  const announcePendingAction = (action: string, employee: Employee) => {
    setActionNotice(`${action} de ${employee.name} estará disponível em breve.`);
  };

  const handleUnlink = (employee: Employee) => {
    setActionNotice(null);
    setUnlinkError(null);
    setEmployeeToUnlink(employee);
  };

  const handleUnlinkDialogChange = (open: boolean) => {
    if (open || unlinkInProgress.current) return;
    setEmployeeToUnlink(null);
    setUnlinkError(null);
  };

  const handleConfirmUnlink = async () => {
    if (!employeeToUnlink || unlinkInProgress.current) return;

    const employee = employeeToUnlink;
    unlinkInProgress.current = true;
    setIsUnlinking(true);
    setUnlinkError(null);

    try {
      const updatedSeats = await companyEmployeeService.unlinkEmployee(employee.id);

      applySeats(updatedSeats);
      reloadEmployees();
      setEmployeeToUnlink(null);

      showToast(
        'success',
        'Colaborador desvinculado',
        `${employee.name} foi desvinculado. A vaga está disponível.`,
      );
    } catch (error: unknown) {
      if (error instanceof CompanyEmployeeServiceError && error.status === 404) {
        reloadAll();
        setEmployeeToUnlink(null);

        showToast(
          'error',
          'Colaborador não vinculado',
          `${employee.name} já não está vinculado à empresa. Os dados estão sendo atualizados.`,
        );
      } else {
        setUnlinkError(
          error instanceof Error
            ? error.message
            : 'Não foi possível concluir a desvinculação. Tente novamente.',
        );
      }
    } finally {
      unlinkInProgress.current = false;
      setIsUnlinking(false);
    }
  };

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
                description={`${seats.seatsAvailable} ${
                  seats.seatsAvailable === 1 ? 'vaga disponível' : 'vagas disponíveis'
                }`}
              />

              <SumCard
                label="Total de colaboradores"
                value={seats.employeesTotal}
                description={`${seats.employeesActive} ${
                  seats.employeesActive === 1 ? 'ativo' : 'ativos'
                }`}
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
                title="Cadastro de colaboradores em breve"
                disabled
              />
            </div>
          </div>

          {seatsStatus === 'loading' ? (
            <div
              className={styles.progressSkeleton}
              role="status"
              aria-label="Carregando ocupação das vagas"
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
              {isLoadingEmployees && (
                <span role="status" className={styles.loadingIndicator}>
                  Atualizando colaboradores...
                </span>
              )}

              <EmployeeTable
                employees={rows}
                onEdit={(employee) => announcePendingAction('Edição', employee)}
                onResendInvite={(employee) => announcePendingAction('Reenvio de convite', employee)}
                onUnlink={handleUnlink}
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
      </div>

      <ConfirmDialog
        open={employeeToUnlink !== null}
        title="Desvincular colaborador?"
        description={
          employeeToUnlink
            ? `${employeeToUnlink.name} perderá acesso a todos os cursos. A vaga ficará disponível para um novo colaborador.`
            : ''
        }
        confirmLabel="Desvincular"
        isConfirming={isUnlinking}
        errorMessage={unlinkError}
        onConfirm={() => {
          void handleConfirmUnlink();
        }}
        onOpenChange={handleUnlinkDialogChange}
      />

      {toast ? (
        <Toast
          key={toast.key}
          open={isOpen}
          variant={toast.variant}
          title={toast.title}
          description={toast.description}
          onOpenChange={(open) => {
            if (!open) dismissToast();
          }}
        />
      ) : null}
    </AuthenticatedLayout>
  );
};
