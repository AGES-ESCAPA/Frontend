import { User, Building2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { Navbar, Footer } from '@components/layout';
import { AccountTypeCard } from '@components/ui';
import { authPath, getAuthReturnTo } from '@utils/authReturnTo';
import styles from './RegisterAccountType.module.css';

export const RegisterAccountType = () => {
  const location = useLocation();
  const returnTo = getAuthReturnTo(location.state, location.search);
  return (
    <div className={styles.page}>
      <Navbar state="register" />

      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>Selecione o tipo de cadastro</h1>
          <p className={styles.subtitle}>
            Escolha como você deseja se cadastrar para continuar com o processo.
          </p>
        </div>

        <section className={styles.cardsGrid} aria-label="Tipos de cadastro disponíveis">
          <AccountTypeCard
            title="Pessoa Física"
            description="Cadastre-se como indivíduo e acesse nossos serviços com facilidade."
            icon={<User size={32} />}
            to={authPath('/cadastro/usuario', returnTo)}
          />
          <AccountTypeCard
            title="Pessoa Jurídica"
            description="Cadastre sua empresa e gerencie seus dados corporativos de forma centralizada."
            icon={<Building2 size={32} />}
            to={authPath('/cadastro/empresa', returnTo)}
          />
        </section>
      </main>

      <Footer variant="compact" />
    </div>
  );
};
