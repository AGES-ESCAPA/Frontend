export const Login = () => {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-surface)',
        color: 'var(--color-text-primary)',
        fontFamily: 'var(--font-family-base)',
      }}
    >
      <div
        style={{
          padding: '2rem 3rem',
          borderRadius: '1rem',
          background: 'var(--color-surface-raised)',
          border: '1px solid var(--color-border)',
          textAlign: 'center',
        }}
      >
        <h1 style={{ fontSize: 'var(--text-h3)', marginBottom: '0.75rem' }}>Login</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Página de autenticação em desenvolvimento.
        </p>
      </div>
    </main>
  );
};
