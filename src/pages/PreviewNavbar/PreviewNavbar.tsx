import { Navbar } from '@components/layout/Navbar/Navbar';

export const PreviewNavbar = () => {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'var(--color-surface)',
        color: 'var(--color-text-primary)',
        fontFamily: 'var(--font-family-base)',
      }}
    >
      <Navbar />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 3.5rem)',
          padding: 'var(--space-8)',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            maxWidth: '32rem',
          }}
        >
          <h1 style={{ fontSize: 'var(--text-h3)', marginBottom: 'var(--space-4)' }}>
            Preview da Navbar
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Esta tela serve para validar o layout da navegação independentemente da autenticação.
          </p>
        </div>
      </div>
    </main>
  );
};
