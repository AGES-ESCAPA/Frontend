import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@contexts/AuthContext';
import { ProtectedRoute } from './ProtectedRoute';

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

const Checkout = lazy(() =>
  import('@pages/Checkout/Checkout').then((m) => ({
    default: m.Checkout,
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
const DigitalCertificate = lazy(() =>
  import('@pages/DigitalCertificate/DigitalCertificate').then((m) => ({
    default: m.DigitalCertificate,
  })),
);

const RegisterAccountType = lazy(() =>
  import('@pages/RegisterAccountType/RegisterAccountType').then((m) => ({
    default: m.RegisterAccountType,
  })),
);

const UnderConstruction = lazy(() =>
  import('@pages/UnderConstruction/UnderConstruction').then((m) => ({
    default: m.UnderConstruction,
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
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Rotas Públicas */}
            <Route path="/" element={<Home />} />
            <Route path="/cadastro" element={<RegisterAccountType />} />
            <Route
              path="/meus-cursos"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'EMPLOYEE']}>
                  <MyCourses />
                </ProtectedRoute>
              }
            />
            <Route path="/cursos/:courseId" element={<CourseDetails />} />
            <Route
              path="/aluno/cursos/:courseId/aulas/:lessonId"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'EMPLOYEE']}>
                  <CoursePlayer />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<Login />} />
            <Route
              path="/checkout/:courseId"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'COMPANY']}>
                  <Checkout />
                </ProtectedRoute>
              }
            />
            <Route
              path="/empresa/checkout/:courseId"
              element={
                <ProtectedRoute allowedRoles={['COMPANY']}>
                  <Checkout />
                </ProtectedRoute>
              }
            />
            <Route path="/courses" element={<Courses />} />
            <Route
              path="/aluno/cursos"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'EMPLOYEE']}>
                  <Courses />
                </ProtectedRoute>
              }
            />
            <Route
              path="/empresa/cursos"
              element={
                <ProtectedRoute allowedRoles={['COMPANY']}>
                  <Courses />
                </ProtectedRoute>
              }
            />
            {/* Sidebar/Navbar autenticadas e os botões de Baixar/Compartilhar são
              decididos pelo isOwner da API, não pela rota (ver DigitalCertificate). */}
            <Route path="/certificados/:verificationCode" element={<DigitalCertificate />} />

            {/* Painel Administrativo */}
            <Route
              path="/admin/cursos"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminCourses />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/cursos/novo"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <CourseBuilder />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/cursos/:id/editar"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <CourseBuilder />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/*"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <UnderConstruction />
                </ProtectedRoute>
              }
            />
            <Route
              path="/empresa/*"
              element={
                <ProtectedRoute allowedRoles={['COMPANY']}>
                  <UnderConstruction />
                </ProtectedRoute>
              }
            />
            <Route
              path="/aluno/*"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'EMPLOYEE']}>
                  <UnderConstruction />
                </ProtectedRoute>
              }
            />
            <Route
              path="/meu-perfil"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'EMPLOYEE']}>
                  <UnderConstruction />
                </ProtectedRoute>
              }
            />

            {/* Qualquer rota ainda sem página cai aqui. */}
            <Route path="*" element={<UnderConstruction />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
};
