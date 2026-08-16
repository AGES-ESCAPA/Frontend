import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// ─── Lazy Loading ─────────────────────────────────────────────────────────────
// Adicione novas páginas aqui seguindo este padrão.
// O .then((m) => ({ default: m.NomeDaPagina })) é necessário porque
// usamos named exports (não default exports).

const Home = lazy(() => import('@pages/Home/Home').then((m) => ({ default: m.Home })));

// ─── Fallback de Carregamento ─────────────────────────────────────────────────

const PageLoader = () => (
  <div
    style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--color-accent)',
      fontFamily: 'var(--font-serif)',
      fontSize: 'var(--text-2xl)',
    }}
    role="status"
    aria-label="Carregando página"
  >
    escapa!
  </div>
);

// ─── Rotas ────────────────────────────────────────────────────────────────────
/**
 * AppRouter — configuração central de rotas.
 *
 * Como adicionar uma nova rota:
 *  1. Crie a página em src/pages/NomeDaPagina/NomeDaPagina.tsx
 *  2. Adicione o lazy import acima
 *  3. Adicione um <Route> abaixo
 *  4. Para rotas protegidas, envolva com <ProtectedRoute> (a criar)
 */
export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/" element={<Home />} />

          {/* TODO: Adicionar as demais páginas conforme o desenvolvimento avança:
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/courses/:courseId/lessons/:lessonId" element={<CoursePlayer />} />
            <Route path="*" element={<NotFound />} />
          */}
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};
