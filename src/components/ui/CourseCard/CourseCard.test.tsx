import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CourseCard } from './CourseCard';
import styles from './CourseCard.module.css';

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
    expect(screen.getByText('Iniciante')).toBeInTheDocument();
  });

  it('renderiza o rating e a contagem de reviews quando fornecidos', () => {
    render(<CourseCard {...defaultProps} rating={4.9} reviewsCount={247} />);

    expect(screen.getByText('4.9')).toBeInTheDocument();
    expect(screen.getByText('(247)')).toBeInTheDocument();
  });

  it('não renderiza a seção de rating quando rating não é fornecido', () => {
    // reviewsCount é passado: se a seção aparecesse sem rating, "(247)" estaria na tela.
    render(<CourseCard {...defaultProps} reviewsCount={247} />);

    expect(screen.queryByText('(247)')).not.toBeInTheDocument();
    // Sem rating sobra só o separador entre duração e aulas.
    expect(screen.getAllByText('•')).toHaveLength(1);
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

  it('mostra capa em preto e branco, tag Adquirido e botão Acessar no lugar do preço', () => {
    render(<CourseCard {...defaultProps} acquired />);

    expect(screen.getByText('Adquirido')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /acessar o curso/i })).toBeInTheDocument();
    expect(screen.queryByText(defaultProps.price)).not.toBeInTheDocument();
    expect(screen.getByRole('img', { hidden: true })).toHaveClass(styles.imageAcquired);
  });

  it('aciona o acesso do curso adquirido sem disparar o clique do card', () => {
    const handleClick = vi.fn();
    const handleAccess = vi.fn();
    render(<CourseCard {...defaultProps} acquired onClick={handleClick} onAccess={handleAccess} />);

    fireEvent.click(screen.getByRole('button', { name: /acessar o curso/i }));

    expect(handleAccess).toHaveBeenCalledTimes(1);
    expect(handleAccess).toHaveBeenCalledWith(defaultProps.id);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('esconde o botão Acessar e o preço do curso adquirido quando showAccess é falso', () => {
    render(<CourseCard {...defaultProps} acquired showAccess={false} />);

    expect(screen.getByText('Adquirido')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /acessar o curso/i })).not.toBeInTheDocument();
    expect(screen.queryByText(defaultProps.price)).not.toBeInTheDocument();
  });

  it('mostra a quantidade de colaboradores com acesso no lugar do preço', () => {
    render(<CourseCard {...defaultProps} acquired showAccess={false} employeesWithAccess={12} />);

    expect(screen.getByText('12 colaboradores com acesso')).toBeInTheDocument();
    expect(screen.queryByText(defaultProps.price)).not.toBeInTheDocument();
  });

  it('usa o singular quando só um colaborador tem acesso', () => {
    render(<CourseCard {...defaultProps} acquired showAccess={false} employeesWithAccess={1} />);

    expect(screen.getByText('1 colaborador com acesso')).toBeInTheDocument();
  });

  it('abre os detalhes ao clicar no card adquirido sem botão de acesso', () => {
    const handleClick = vi.fn();
    render(<CourseCard {...defaultProps} acquired showAccess={false} onClick={handleClick} />);

    fireEvent.click(screen.getByRole('button', { name: /ver detalhes do curso/i }));

    expect(handleClick).toHaveBeenCalledWith(defaultProps.id);
  });

  it('exibe o placeholder quando a imagem falha ao carregar', () => {
    const { container } = render(<CourseCard {...defaultProps} />);

    const image = screen.getByRole('img', { hidden: true });
    fireEvent.error(image);

    expect(screen.queryByRole('img', { hidden: true })).not.toBeInTheDocument();
    expect(container.querySelector(`.${styles.imagePlaceholder}`)).toBeInTheDocument();
  });
});
