import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { RegisterAccountType } from './RegisterAccountType';

const LocationProbe = () => {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
};

const renderPage = (initialRoute = '/cadastro') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="/cadastro" element={<RegisterAccountType />} />
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  );
};

describe('RegisterAccountType', () => {
  it('renderiza o título principal e subtítulo da página', () => {
    renderPage();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Selecione o tipo de cadastro' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Escolha como você deseja se cadastrar para continuar com o processo.'),
    ).toBeInTheDocument();
  });

  it('renderiza os cards de Pessoa Física e Pessoa Jurídica com títulos e descrições', () => {
    renderPage();

    expect(screen.getByRole('heading', { level: 2, name: 'Pessoa Física' })).toBeInTheDocument();
    expect(
      screen.getByText('Cadastre-se como indivíduo e acesse nossos serviços com facilidade.'),
    ).toBeInTheDocument();

    expect(screen.getByRole('heading', { level: 2, name: 'Pessoa Jurídica' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'Cadastre sua empresa e gerencie seus dados corporativos de forma centralizada.',
      ),
    ).toBeInTheDocument();
  });

  it('o card de Pessoa Física aponta para a rota /cadastro/usuario', () => {
    renderPage();

    const link = screen.getByRole('link', { name: 'Pessoa Física' });
    expect(link).toHaveAttribute('href', '/cadastro/usuario');
  });

  it('o card de Pessoa Jurídica aponta para a rota /cadastro/empresa', () => {
    renderPage();

    const link = screen.getByRole('link', { name: 'Pessoa Jurídica' });
    expect(link).toHaveAttribute('href', '/cadastro/empresa');
  });

  it('navega para /cadastro/usuario ao clicar no card de Pessoa Física', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('link', { name: 'Pessoa Física' }));

    expect(screen.getByTestId('location')).toHaveTextContent('/cadastro/usuario');
  });

  it('navega para /cadastro/empresa ao clicar no card de Pessoa Jurídica', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('link', { name: 'Pessoa Jurídica' }));

    expect(screen.getByTestId('location')).toHaveTextContent('/cadastro/empresa');
  });

  it('permite focar e acionar os cards via teclado (Tab e Enter)', async () => {
    const user = userEvent.setup();
    renderPage();

    const fisicaCard = screen.getByRole('link', { name: 'Pessoa Física' });
    const juridicaCard = screen.getByRole('link', { name: 'Pessoa Jurídica' });

    await user.tab();

    await user.tab();
    expect(fisicaCard).toHaveFocus();

    await user.tab();
    expect(juridicaCard).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(screen.getByTestId('location')).toHaveTextContent('/cadastro/empresa');
  });

  it('renderiza o Navbar no estado register e o Footer compacto', () => {
    renderPage();

    expect(screen.getByRole('navigation', { name: 'Navegação principal' })).toHaveAttribute(
      'data-state',
      'register',
    );
    expect(screen.getByRole('contentinfo', { name: 'Rodapé compacto' })).toBeInTheDocument();
  });
});
