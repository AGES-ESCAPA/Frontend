import { Navbar } from '@components/layout/Navbar/Navbar';

export const Login = () => {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-surface)' }}>
      <Navbar state="register" />
      <main
        style={{
          minHeight: 'calc(100vh - 4rem)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-text-primary)',
          fontFamily: 'var(--font-family-base)',
        }}
      >
        <div
          style={{
            padding: 'var(--space-8) var(--space-12)',
            borderRadius: 'var(--radius-xl)',
            background: 'var(--color-surface-raised)',
            border: '1px solid var(--color-border)',
            textAlign: 'center',
          }}
        >
          <h1 style={{ fontSize: 'var(--text-h3)', marginBottom: 'var(--space-3)' }}>Login</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Página de autenticação em desenvolvimento.
          </p>
        </div>
      </main>
    </div>
  );
};
