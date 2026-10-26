import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OrderSummary } from './OrderSummary';

const course = {
  kind: 'course' as const,
  title: 'Turismo',
  imageUrl: '/course.jpg',
  duration: '12h',
  price: 249.9,
};

const seats = {
  kind: 'seats' as const,
  quantity: 10,
  total: 900,
};

describe('OrderSummary', () => {
  it('shows fallback when course image URL is empty', () => {
    render(
      <OrderSummary
        item={{
          kind: 'course',
          title: 'IA Aplicada ao Turismo',
          imageUrl: '',
          duration: '12h',
          price: 97,
        }}
      />,
    );

    expect(
      screen.getByRole('img', {
        name: /capa indisponível para o curso/i,
      }),
    ).toBeInTheDocument();
  });

  it('shows fallback when course image fails to load', () => {
    render(
      <OrderSummary
        item={{
          kind: 'course',
          title: 'IA Aplicada ao Turismo',
          imageUrl: '/imagem-inexistente.jpg',
          duration: '12h',
          price: 97,
        }}
      />,
    );

    const image = screen.getByRole('img', {
      name: /capa do curso ia aplicada ao turismo/i,
    });

    fireEvent.error(image);

    expect(
      screen.getByRole('img', {
        name: /capa indisponível para o curso/i,
      }),
    ).toBeInTheDocument();
  });

  it('shows course cover, title, duration and price', () => {
    render(<OrderSummary item={course} />);

    expect(
      screen.getByRole('img', {
        name: 'Capa do curso Turismo',
      }),
    ).toHaveAttribute('src', '/course.jpg');

    expect(screen.getByText('Turismo')).toBeInTheDocument();
    expect(screen.getByText('12h')).toBeInTheDocument();
    expect(screen.getAllByText('R$ 249,90')).toHaveLength(3);
  });

  it('shows seat quantity and total', () => {
    render(<OrderSummary item={seats} />);

    expect(screen.getByText('10 colaboradores')).toBeInTheDocument();

    expect(screen.getAllByText('R$ 900,00')).toHaveLength(2);
  });

  it('masks individual buyer document', () => {
    render(
      <OrderSummary
        item={seats}
        buyer={{
          kind: 'individual',
          name: 'Maria',
          document: '12345678901',
        }}
      />,
    );

    expect(screen.getByText('CPF: ***.***.789-01')).toBeInTheDocument();

    expect(screen.queryByText(/12345678901/)).not.toBeInTheDocument();
  });

  it('masks company buyer document', () => {
    render(
      <OrderSummary
        item={seats}
        buyer={{
          kind: 'company',
          name: 'Empresa',
          document: '12345678000190',
        }}
      />,
    );

    expect(screen.getByText('CNPJ: **.***.***/0001-90')).toBeInTheDocument();
  });

  it('masks an alphanumeric company document', () => {
    render(
      <OrderSummary
        item={seats}
        buyer={{ kind: 'company', name: 'Empresa', document: '12.ABC.345/01DE-35' }}
      />,
    );

    expect(screen.getByText('CNPJ: **.***.***/01DE-35')).toBeInTheDocument();
  });

  it('shows the name and the e-mail of the buyer', () => {
    render(
      <OrderSummary
        item={seats}
        buyer={{
          kind: 'individual',
          name: 'Maria Souza',
          email: 'maria@email.com',
          document: '12345678901',
        }}
      />,
    );

    expect(screen.getByText('Dados do comprador')).toBeInTheDocument();
    expect(screen.getByText('Maria Souza')).toBeInTheDocument();
    expect(screen.getByText('maria@email.com')).toBeInTheDocument();
  });

  it('shows loading, error and empty states', () => {
    const { rerender } = render(<OrderSummary status="loading" />);

    expect(screen.getByRole('status', { name: 'Carregando resumo do pedido' })).toBeInTheDocument();
    expect(screen.queryByText('Subtotal')).not.toBeInTheDocument();

    rerender(<OrderSummary status="error" />);

    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível');

    rerender(<OrderSummary />);

    expect(screen.getByRole('status')).toHaveTextContent('Nenhum item');
  });

  it('applies discount without negative total', () => {
    render(<OrderSummary item={seats} discount={1000} />);

    expect(screen.getByText('R$ 0,00')).toBeInTheDocument();
  });
});
