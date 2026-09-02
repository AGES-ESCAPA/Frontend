import { SearchBar } from '@components/ui';
import { useState } from 'react';
import styles from './Home.module.css';

const featuredCourses = [
  {
    title: 'IA Aplicada ao Turismo',
    category: 'INTELIGÊNCIA ARTIFICIAL',
    description:
      'Desenvolva as melhores experiências com inteligência artificial aplicada ao turismo.',
    duration: '4h',
    level: 'Iniciante',
    price: 'R$ 97',
    accent: 'blue',
  },
  {
    title: 'Marketing Digital para Hospitalidade',
    category: 'MARKETING',
    description: 'Estratégias de marketing digital para hotéis e pousadas com foco em conversão.',
    duration: '6h',
    level: 'Intermediário',
    price: 'R$ 117',
    accent: 'teal',
  },
  {
    title: 'Experiência Premium do Hóspede',
    category: 'INTERMEDIÁRIO',
    description: 'Técnicas para elevar a experiência do cliente e criar lembranças memoráveis.',
    duration: '4h',
    level: 'Avançado',
    price: 'R$ 87',
    accent: 'amber',
  },
];

const allCourses = [
  { title: 'Inovação em Destinos Turísticos', category: 'INOVAÇÃO', price: 'R$ 127' },
  { title: 'Revenue Management para Hotelaria', category: 'HOTELARIA', price: 'R$ 147' },
  { title: 'Marketing Digital para Hospitalidade', category: 'MARKETING', price: 'R$ 117' },
  { title: 'Liderança em Hospitalidade de Luxo', category: 'HOSPITALIDADE', price: 'R$ 167' },
  { title: 'IA Aplicada ao Turismo', category: 'INTELIGÊNCIA ARTIFICIAL', price: 'R$ 97' },
  { title: 'Experiência Premium do Hóspede', category: 'INTERMEDIÁRIO', price: 'R$ 87' },
];

const filters = [
  'Todos',
  'Inteligência Artificial',
  'Marketing',
  'Hospitalidade',
  'Inovação',
  'Turismo',
  'Intermediário',
];

export const Home = () => {
  const [searchValue, setSearchValue] = useState('');

  return (
    <div className={styles.pageShell}>
      <header className={styles.topbar}>
        <div className={styles.brandGroup}>
          <span className={styles.brand}>escapa!</span>
          <span className={styles.brandSecondary}>| cursos</span>
        </div>

        <a href="/login" className={styles.enterButton} aria-label="Acessar a plataforma">
          Entrar
        </a>
      </header>

      <main className={styles.mainContent}>
        <section className={styles.sectionContainer}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>CATÁLOGO</span>
            <h1 className={styles.sectionTitle}>Cursos em Destaque</h1>
          </div>

          <div className={styles.featuredGrid}>
            {featuredCourses.map((course) => (
              <article
                key={course.title}
                className={`${styles.featuredCard} ${styles[course.accent]}`}
              >
                <div className={styles.cardTag}>{course.category}</div>
                <div className={styles.cardBody}>
                  <h2>{course.title}</h2>
                  <p>{course.description}</p>
                  <div className={styles.cardMeta}>
                    <span>{course.duration}</span>
                    <span>{course.level}</span>
                    <span>{course.price}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.sectionContainer}>
          <div className={styles.catalogHeader}>
            <h2>Todos os Cursos</h2>
          </div>

          <div className={styles.searchWrap}>
            <SearchBar
              value={searchValue}
              onChange={setSearchValue}
              onSearch={() => undefined}
              placeholder="Buscar por nome ou tema"
              theme="dark"
              aria-label="Buscar cursos"
            />
          </div>

          <div className={styles.filterRow}>
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                className={`${styles.filterButton} ${filter === 'Todos' ? styles.filterButtonActive : ''}`}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className={styles.catalogGrid}>
            {allCourses.map((course) => (
              <article key={course.title} className={styles.courseCard}>
                <div className={styles.courseImage} aria-hidden="true" />
                <div className={styles.courseContent}>
                  <h3>{course.title}</h3>
                  <p>{course.category}</p>
                  <div className={styles.courseFooter}>
                    <span>R$ {course.price.replace('R$ ', '')}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerBrand}>escapa!</div>
        <div className={styles.footerColumns}>
          <div>
            <h4>Plataforma</h4>
            <p>Minhas Cursos</p>
            <p>Certificados</p>
            <p>Suporte</p>
          </div>
          <div>
            <h4>Empresa</h4>
            <p>Sobre a escapa!</p>
            <p>Contato</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
