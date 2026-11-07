import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, UserPlus } from 'lucide-react';
import { AuthenticatedLayout, SIDEBAR_MENU_PRESETS } from '@components/layout';
import type { SidebarUser } from '@components/layout';
import { Button, EmployeeTable, EmptyState, ProgressBar, SearchBar, SumCard } from '@components/ui';
import type { Employee } from '@components/ui';
import { useCompanySeats } from '@hooks/useCompanySeats';
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

  // As operações de escrita pertencem às US-31, US-32 e US-33.
  const announcePendingAction = (action: string, employee: Employee) => {
    setActionNotice(`${action} de ${employee.name} estará disponível na respectiva US.`);
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
                label="Tentar novamente vagas"
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
                title="Cadastro disponível na US-31"
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

          {employeesStatus === 'loading' ? <SkeletonTable /> : null}

          {employeesStatus === 'error' ? (
            <div className={styles.state} role="alert">
              <p>{employeesError}</p>

              <Button
                type="button"
                variant="outlined"
                label="Tentar novamente colaboradores"
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

          {employeesStatus === 'success' && rows.length > 0 ? (
            <div className={styles.tableWrapper}>
              <EmployeeTable
                employees={rows}
                onEdit={(employee) => announcePendingAction('Edição', employee)}
                onResendInvite={(employee) => announcePendingAction('Reenvio de convite', employee)}
                onUnlink={(employee) => announcePendingAction('Desvinculação', employee)}
              />
            </div>
          ) : null}

          {actionNotice ? (
            <p role="status" className={styles.notice}>
              {actionNotice}
            </p>
          ) : null}

          {employeesStatus === 'success' ? (
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
                    disabled={page === 0}
                    onClick={() => setPage((current) => Math.max(0, current - 1))}
                  />

                  <span>
                    Página {page + 1} de {totalPages}
                  </span>

                  <Button
                    type="button"
                    variant="outlined"
                    label="Próxima"
                    disabled={page + 1 >= totalPages}
                    onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
                  />
                </nav>
              ) : null}
            </footer>
          ) : null}
        </section>
      </div>
    </AuthenticatedLayout>
  );
};
