import { Link, useLocation } from 'react-router-dom';
import { Footer, Navbar } from '@components/layout';
import { Button } from '@components/ui';
import { useAuth } from '@contexts/useAuth';
import { getDefaultRoute } from '@routes/access';
import styles from './NotFound.module.css';

/**
 * Página 404 para URLs que não existem. Distinta de "Em construção",
 * usada só em rotas futuras conhecidas.
 */
export const NotFound = () => {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const homeHref = user ? getDefaultRoute(user.role) : '/';
  const homeLabel = user ? 'Ir para a área inicial' : 'Voltar ao início';

  return (
    <div className={styles.page}>
      <Navbar state="register" />
      <main className={styles.main}>
        <section className={styles.panel} aria-labelledby="not-found-title">
          <p className={styles.code} aria-hidden="true">
            404
          </p>
          <h1 id="not-found-title" className={styles.title}>
            Página não encontrada
          </h1>
          <p className={styles.description}>
            O endereço que você tentou abrir não existe ou foi removido. Confira se digitou
            corretamente ou volte para continuar na Escapa! Academy.
          </p>
          <code className={styles.path}>{pathname}</code>
          <div className={styles.actions}>
            <Button asChild variant="primary" label={homeLabel}>
              <Link to={homeHref} />
            </Button>
            {!user && (
              <Button asChild variant="outlined" label="Entrar">
                <Link to="/login" />
              </Button>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};
