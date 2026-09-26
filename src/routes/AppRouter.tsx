import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// ─── Lazy Loading ─────────────────────────────────────────────────────────────
// Adicione novas páginas aqui seguindo este padrão.
// O .then((m) => ({ default: m.NomeDaPagina })) é necessário porque
// usamos named exports (não default exports).

const Home = lazy(() =>
  import('@pages/Home/Home').then((m) => ({
    default: m.Home,
  })),
);

const MyCourses = lazy(() =>
  import('@pages/MyCourses/MyCourses').then((m) => ({
    default: m.MyCourses,
  })),
);

const CourseDetails = lazy(() =>
  import('@pages/CourseDetails/CourseDetails').then((m) => ({
    default: m.CourseDetails,
  })),
);

const CoursePlayer = lazy(() =>
  import('@pages/CoursePlayer/CoursePlayer').then((m) => ({
    default: m.CoursePlayer,
  })),
);

const Login = lazy(() =>
  import('@pages/Login/Login').then((m) => ({
    default: m.Login,
  })),
);

const Courses = lazy(() =>
  import('@pages/Courses/Courses').then((m) => ({
    default: m.Courses,
  })),
);

const CourseBuilder = lazy(() =>
  import('@pages/CourseBuilder/CourseBuilder').then((m) => ({
    default: m.CourseBuilder,
  })),
);

const AdminCourses = lazy(() =>
  import('@pages/AdminCourses/AdminCourses').then((m) => ({
    default: m.AdminCourses,
  })),
);

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
          <Route path="/meus-cursos" element={<MyCourses />} />
          <Route path="/cursos/:courseId" element={<CourseDetails />} />
          <Route path="/courses/:courseId/lessons/:lessonId" element={<CoursePlayer />} />
          <Route path="/login" element={<Login />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/aluno/cursos" element={<Courses />} />
          <Route path="/empresa/cursos" element={<Courses />} />

          {/* Painel Administrativo */}
          <Route path="/admin/cursos" element={<AdminCourses />} />
          <Route path="/admin/cursos/novo" element={<CourseBuilder />} />
          <Route path="/admin/cursos/:id/editar" element={<CourseBuilder />} />

          {/* TODO: Adicionar as demais páginas conforme o desenvolvimento avança:
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="*" element={<NotFound />} />
          */}
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};
