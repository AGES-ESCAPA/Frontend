import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Footer, Navbar } from '@components/layout';
import { Button, CourseCard, CourseCardSkeleton, FilterTabs, SearchBar } from '@components/ui';
import { usePublicCourses } from '@hooks/usePublicCourses';
import { mapPublicCourseToCardProps } from '@utils/mapPublicCourse';
import styles from './Home.module.css';

const ALL_FILTER = 'Todos';
const CATEGORY_OPTIONS = [
  ALL_FILTER,
  'Hospitalidade',
  'Turismo',
  'Inteligência Artificial',
  'Marketing',
  'Inovação',
];
const LEVEL_OPTIONS = [ALL_FILTER, 'Iniciante', 'Intermediário', 'Avançado'];
const FEATURED_SKELETONS = 3;
const CATALOG_SKELETONS = 6;

const toOptionalFilter = (value: string): string | undefined =>
  value === ALL_FILTER ? undefined : value;

const formatFoundCount = (total: number): string =>
  total === 1 ? '1 curso encontrado' : `${total} cursos encontrados`;

export const Home = () => {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState(ALL_FILTER);
  const [level, setLevel] = useState(ALL_FILTER);

  const {
    featured,
    featuredStatus,
    catalog,
    catalogStatus,
    totalElements,
    reloadFeatured,
    reloadCatalog,
    reloadAll,
  } = usePublicCourses({
    title: searchTerm || undefined,
    category: toOptionalFilter(category),
    level: toOptionalFilter(level),
  });

  const handleCourseClick = (courseId: string) => {
    navigate(`/cursos/${courseId}`);
  };

  const showPageError = featuredStatus === 'error' && catalogStatus === 'error';

  return (
    <div className={styles.page}>
      <Navbar state="noAuth" />

      <main className={styles.main}>
        {showPageError ? (
          <section className={styles.errorState} role="alert">
            <h1 className={styles.errorTitle}>Não foi possível carregar os cursos</h1>
            <p className={styles.errorDescription}>
              Verifique sua conexão e tente novamente em instantes.
            </p>
            <Button variant="primary" label="Tentar Novamente" onClick={reloadAll} />
          </section>
        ) : (
          <>
            <section className={styles.section} aria-labelledby="featured-heading">
              <p className={styles.eyebrow}>Catálogo</p>
              <h1 id="featured-heading" className={styles.heading}>
                Cursos em Destaque
              </h1>

              {featuredStatus === 'loading' && (
                <div
                  className={styles.grid}
                  role="status"
                  aria-label="Carregando cursos em destaque"
                >
                  {Array.from({ length: FEATURED_SKELETONS }, (_, index) => (
                    <CourseCardSkeleton key={`featured-skeleton-${index}`} />
                  ))}
                </div>
              )}

              {featuredStatus === 'error' && (
                <div className={styles.inlineError} role="alert">
                  <p>Não foi possível carregar os cursos em destaque.</p>
                  <Button variant="outlined" label="Tentar Novamente" onClick={reloadFeatured} />
                </div>
              )}

              {featuredStatus === 'success' && featured.length > 0 && (
                <div className={styles.grid}>
                  {featured.map((course) => (
                    <CourseCard
                      key={course.id}
                      {...mapPublicCourseToCardProps(course, handleCourseClick)}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className={styles.section} aria-labelledby="catalog-heading">
              <h2 id="catalog-heading" className={styles.heading}>
                Todos os Cursos
              </h2>

              <div className={styles.catalogToolbar}>
                <div className={styles.searchWrap}>
                  <SearchBar
                    value={searchValue}
                    onChange={setSearchValue}
                    onSearch={setSearchTerm}
                    placeholder="Buscar por nome ou tema"
                  />
                </div>
                <div className={styles.categoryTabs}>
                  <FilterTabs
                    options={CATEGORY_OPTIONS}
                    selected={category}
                    onChange={setCategory}
                    groupLabel="Categoria"
                  />
                </div>
                <div className={styles.filterDivider} />
                <div className={styles.levelTabs}>
                  <FilterTabs
                    options={LEVEL_OPTIONS}
                    selected={level}
                    onChange={setLevel}
                    variant="ghost-dark"
                    groupLabel="Nível"
                  />
                </div>
              </div>

              {catalogStatus === 'loading' && (
                <div className={styles.grid} role="status" aria-label="Carregando cursos">
                  {Array.from({ length: CATALOG_SKELETONS }, (_, index) => (
                    <CourseCardSkeleton key={`catalog-skeleton-${index}`} />
                  ))}
                </div>
              )}

              {catalogStatus === 'error' && (
                <div className={styles.errorState} role="alert">
                  <h3 className={styles.errorTitle}>Não foi possível carregar os cursos</h3>
                  <p className={styles.errorDescription}>
                    Verifique sua conexão e tente novamente em instantes.
                  </p>
                  <Button variant="primary" label="Tentar Novamente" onClick={reloadCatalog} />
                </div>
              )}

              {catalogStatus === 'success' && (
                <>
                  <p className={styles.resultsCount}>{formatFoundCount(totalElements)}</p>
                  {catalog.length === 0 ? (
                    <p className={styles.emptyState}>
                      Nenhum curso encontrado para os filtros atuais.
                    </p>
                  ) : (
                    <div className={styles.grid}>
                      {catalog.map((course) => (
                        <CourseCard
                          key={course.id}
                          {...mapPublicCourseToCardProps(course, handleCourseClick)}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </section>
          </>
        )}
      </main>

      <Footer variant="full" />
    </div>
  );
};
