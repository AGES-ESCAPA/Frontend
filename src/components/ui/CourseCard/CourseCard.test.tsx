import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CourseCard } from './CourseCard';

const defaultProps = {
  id: 'curso-ia-101',
  imageUrl: 'src/assets/card_turismo_.jpg',
  category: 'Marketing' as const,
  level: 'basic' as const,
  title: 'Introdução ào turismo com IA',
  description:
    'Aprenda como reter clientes no setor de turismo com a ajuda da inteligência artificial.',
  duration: '12h',
  lessonsCount: 32,
  instructor: 'Dra. Mariana',
  price: 'R$ 249,90',
  onClick: vi.fn(),
};

describe('CourseCard', () => {
  it('renderiza as informações essenciais do curso', () => {
    render(<CourseCard {...defaultProps} />);

    expect(screen.getByText(defaultProps.title)).toBeInTheDocument();
    expect(screen.getByText(defaultProps.description)).toBeInTheDocument();
    expect(screen.getByText(defaultProps.duration)).toBeInTheDocument();
    expect(screen.getByText(`${defaultProps.lessonsCount} aulas`)).toBeInTheDocument();
    expect(screen.getByText(defaultProps.instructor)).toBeInTheDocument();
    expect(screen.getByText(defaultProps.price)).toBeInTheDocument();
  });

  it('renderiza as duas instâncias do Badge (categoria e nível)', () => {
    render(<CourseCard {...defaultProps} />);

    expect(screen.getByText('Marketing')).toBeInTheDocument();
    expect(screen.getByText('Básico')).toBeInTheDocument();
  });

  it('renderiza o rating e a contagem de reviews quando fornecidos', () => {
    render(<CourseCard {...defaultProps} rating={4.9} reviewsCount={247} />);

    expect(screen.getByText('4.9')).toBeInTheDocument();
    expect(screen.getByText('(247)')).toBeInTheDocument();
  });

  it('não renderiza a seção de rating quando rating não é fornecido', () => {
    render(<CourseCard {...defaultProps} />);

    expect(screen.queryByText('(247)')).not.toBeInTheDocument();
  });

  it('chama onClick com o id do curso ao clicar no card', () => {
    const handleClick = vi.fn();
    render(<CourseCard {...defaultProps} onClick={handleClick} />);

    fireEvent.click(screen.getByRole('button', { name: /ver detalhes do curso/i }));

    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledWith(defaultProps.id);
  });

  it('chama onClick ao pressionar Enter com o card focado', () => {
    const handleClick = vi.fn();
    render(<CourseCard {...defaultProps} onClick={handleClick} />);

    const card = screen.getByRole('button', { name: /ver detalhes do curso/i });
    fireEvent.keyDown(card, { key: 'Enter' });

    expect(handleClick).toHaveBeenCalledWith(defaultProps.id);
  });

  it('chama onClick ao pressionar Espaço com o card focado', () => {
    const handleClick = vi.fn();
    render(<CourseCard {...defaultProps} onClick={handleClick} />);

    const card = screen.getByRole('button', { name: /ver detalhes do curso/i });
    fireEvent.keyDown(card, { key: ' ' });

    expect(handleClick).toHaveBeenCalledWith(defaultProps.id);
  });

  it('não chama onClick para outras teclas', () => {
    const handleClick = vi.fn();
    render(<CourseCard {...defaultProps} onClick={handleClick} />);

    const card = screen.getByRole('button', { name: /ver detalhes do curso/i });
    fireEvent.keyDown(card, { key: 'Tab' });

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('exibe a imagem de capa quando carregada com sucesso', () => {
    render(<CourseCard {...defaultProps} />);

    const image = screen.getByRole('img', { hidden: true });
    expect(image).toHaveAttribute('src', defaultProps.imageUrl);
  });

  it('exibe o placeholder quando a imagem falha ao carregar', () => {
    const { container } = render(<CourseCard {...defaultProps} />);

    const image = screen.getByRole('img', { hidden: true });
    fireEvent.error(image);

    expect(screen.queryByRole('img', { hidden: true })).not.toBeInTheDocument();
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });
});
