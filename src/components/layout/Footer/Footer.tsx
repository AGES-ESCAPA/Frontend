import escapaLogo from '@assets/escapa_logo.png';
import styles from './Footer.module.css';

export type FooterVariant = 'full' | 'compact';

export type FooterProps = {
  variant: FooterVariant;
  categories?: string[];
  year?: number;
};

type FooterLink = {
  label: string;
  href: string;
};

const platformLinks: FooterLink[] = [
  { label: 'Minha Conta', href: '/login' },
  { label: 'Certificados', href: '/certificados' },
  { label: 'Suporte', href: '/suporte' },
];

const companyLinks: FooterLink[] = [
  { label: 'Sobre a escapa!', href: '/sobre' },
  { label: 'Contato', href: '/contato' },
];

const compactLinks: FooterLink[] = [
  { label: 'Política de Privacidade', href: '/politica-de-privacidade' },
  { label: 'Termos de Uso', href: '/termos-de-uso' },
  { label: 'Suporte', href: '/suporte' },
];

const defaultCategories = ['Turismo', 'Hospitalidade', 'Inovação'];

const getCurrentYear = () => new Date().getFullYear();

const renderLinkList = (links: FooterLink[]) => (
  <ul className={styles.linkList}>
    {links.map((link) => (
      <li key={link.href}>
        <a className={styles.link} href={link.href}>
          {link.label}
        </a>
      </li>
    ))}
  </ul>
);

export const Footer = ({
  variant,
  categories = defaultCategories,
  year = getCurrentYear(),
}: FooterProps) => {
  const copyright = `© ${year} Escapa! Cursos. Todos os direitos reservados.`;

  if (variant === 'compact') {
    return (
      <footer className={`${styles.footer} ${styles.compact}`} aria-label="Rodapé compacto">
        <p className={styles.copyright}>{copyright}</p>
        <nav className={styles.compactNav} aria-label="Links legais e suporte">
          {renderLinkList(compactLinks)}
        </nav>
      </footer>
    );
  }

  return (
    <footer className={`${styles.footer} ${styles.full}`} aria-label="Rodapé institucional">
      <div className={styles.fullContent}>
        <section className={styles.brandSection} aria-label="Sobre a Escapa">
          <img src={escapaLogo} alt="escapa!" className={styles.logo} />
          <p className={styles.brandKicker}>Aprenda</p>
          <p className={styles.description}>
            Plataforma de educação premium para profissionais e empresas do turismo e da
            hospitalidade. Marketing, IA, inovação e muito mais.
          </p>
        </section>

        <nav className={styles.navSection} aria-labelledby="footer-platform-title">
          <h2 className={styles.navTitle} id="footer-platform-title">
            Plataforma
          </h2>
          {renderLinkList(platformLinks)}
        </nav>

        <nav className={styles.navSection} aria-labelledby="footer-company-title">
          <h2 className={styles.navTitle} id="footer-company-title">
            Empresa
          </h2>
          {renderLinkList(companyLinks)}
        </nav>
      </div>

      <div className={styles.fullBottom}>
        <p className={styles.copyright}>{copyright}</p>
        <p className={styles.categories}>{categories.join(' · ')}</p>
      </div>
    </footer>
  );
};
