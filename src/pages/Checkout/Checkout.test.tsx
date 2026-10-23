import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { courseService, CourseRequestError } from '@services/courseService';
import type * as CourseServiceModule from '@services/courseService';
import type { PublicCourseDetails } from '@/types/course';
import { Checkout } from './Checkout';

vi.mock('@services/courseService', async (importOriginal) => {
  const actual = await importOriginal<typeof CourseServiceModule>();

  return {
    ...actual,
    courseService: {
      ...actual.courseService,
      getPublicCourseById: vi.fn(),
    },
  };
});

const getPublicCourseByIdMock = vi.mocked(courseService.getPublicCourseById);

const COURSE_ID = 'e0000000-0000-4000-e000-000000000004';
const VALID_NUMBER = '4539148803436467';

const details: PublicCourseDetails = {
  id: COURSE_ID,
  title: 'Hospitalidade de Luxo',
  shortDescription: null,
  description: null,
  category: null,
  level: null,
  durationTime: null,
  price: 167,
  deadline: null,
  thumbnailUrl: null,
  teaserVideoUrl: null,
  rating: null,
  reviewsCount: null,
  studentsCount: null,
  instructor: null,
  learningObjectives: null,
  materials: null,
  modules: null,
};

const renderCheckout = (path = `/checkout/${COURSE_ID}`, props = {}) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/checkout/:courseId" element={<Checkout {...props} />} />
        <Route path="/empresa/checkout/:courseId" element={<Checkout {...props} />} />
      </Routes>
    </MemoryRouter>,
  );

describe('Checkout', () => {
  beforeEach(() => {
    getPublicCourseByIdMock.mockReset();
    getPublicCourseByIdMock.mockResolvedValue(details);
  });

  it('should show the page heading', async () => {
    renderCheckout();

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Finalizar Compra',
      }),
    ).toBeInTheDocument();

    expect(screen.getByText('Pagamento')).toBeInTheDocument();

    await screen.findByRole('button', {
      name: 'Pagar R$167,00',
    });
  });

  it('should display the loading state while fetching the course', async () => {
    renderCheckout();

    expect(screen.getByText('Carregando os dados da compra...')).toBeInTheDocument();

    expect(
      await screen.findByRole('button', {
        name: 'Pagar R$167,00',
      }),
    ).toBeInTheDocument();

    expect(getPublicCourseByIdMock).toHaveBeenCalledWith(COURSE_ID, expect.any(AbortSignal));
  });

  it('should display the credit card form without a payment method selector', async () => {
    renderCheckout();

    await screen.findByLabelText('Número do cartão');

    expect(screen.queryByRole('radio')).not.toBeInTheDocument();

    expect(screen.getByLabelText('Nome impresso no cartão')).toBeInTheDocument();

    expect(screen.getByLabelText('Número do cartão')).toBeInTheDocument();

    expect(screen.queryByText(/pix/i)).not.toBeInTheDocument();

    expect(screen.queryByText(/boleto/i)).not.toBeInTheDocument();
  });

  it('should only enable the pay button when the card form is valid', async () => {
    const user = userEvent.setup();

    renderCheckout();

    const button = await screen.findByRole('button', {
      name: 'Pagar R$167,00',
    });

    expect(button).toBeDisabled();

    await user.type(screen.getByLabelText('Nome impresso no cartão'), 'jorge amado');

    await user.type(screen.getByLabelText('Número do cartão'), VALID_NUMBER);

    await user.type(screen.getByLabelText('Data de vencimento'), '1299');

    expect(button).toBeDisabled();

    await user.type(screen.getByLabelText('CVV'), '123');

    expect(button).toBeEnabled();
  });

  it('should trigger confirmation with CARD and installments', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    renderCheckout(`/checkout/${COURSE_ID}`, {
      onConfirm,
    });

    await screen.findByRole('button', {
      name: 'Pagar R$167,00',
    });

    await user.type(screen.getByLabelText('Nome impresso no cartão'), 'jorge amado');

    await user.type(screen.getByLabelText('Número do cartão'), VALID_NUMBER);

    await user.type(screen.getByLabelText('Data de vencimento'), '1299');

    await user.type(screen.getByLabelText('CVV'), '123');

    await user.click(
      screen.getByRole('button', {
        name: 'Pagar R$167,00',
      }),
    );

    expect(onConfirm).toHaveBeenCalledWith({
      paymentMethod: 'CARD',
      installments: 1,
    });

    expect(JSON.stringify(onConfirm.mock.calls)).not.toContain(VALID_NUMBER);
  });

  it('should render a custom order summary when provided', async () => {
    renderCheckout(`/checkout/${COURSE_ID}`, {
      summary: <p>Pacote 10 Assentos Corporativos</p>,
    });

    await screen.findByRole('button', {
      name: 'Pagar R$167,00',
    });

    expect(
      screen.getByRole('complementary', {
        name: 'Resumo do pedido',
      }),
    ).toHaveTextContent('Pacote 10 Assentos Corporativos');
  });

  it('should automatically render the course summary', async () => {
    renderCheckout();

    await screen.findByRole('button', {
      name: 'Pagar R$167,00',
    });

    const summary = screen.getByRole('complementary', {
      name: 'Resumo do pedido',
    });

    expect(summary).toBeInTheDocument();

    expect(summary).toHaveTextContent('Hospitalidade de Luxo');
  });

  it('should use the student layout on the default route', async () => {
    renderCheckout();

    await screen.findByRole('button', {
      name: 'Pagar R$167,00',
    });

    expect(screen.getAllByText('Meus Cursos').length).toBeGreaterThan(0);
  });

  it('should use the company layout on the company route', async () => {
    renderCheckout(`/empresa/checkout/${COURSE_ID}`);

    await screen.findByRole('button', {
      name: 'Pagar R$167,00',
    });

    expect(screen.getAllByText('Colaboradores').length).toBeGreaterThan(0);
  });

  it('should display a not-found message when the course returns HTTP 404', async () => {
    getPublicCourseByIdMock.mockRejectedValue(new CourseRequestError('Curso não encontrado', 404));

    renderCheckout();

    const alert = await screen.findByRole('alert');

    expect(alert).toHaveTextContent('Curso não encontrado');

    expect(
      screen.getByRole('link', {
        name: 'Voltar ao catálogo',
      }),
    ).toHaveAttribute('href', '/aluno/cursos');

    expect(
      screen.queryByRole('button', {
        name: /Pagar/,
      }),
    ).not.toBeInTheDocument();
  });

  it('should display an error and allow retrying after an API failure', async () => {
    const user = userEvent.setup();

    getPublicCourseByIdMock
      .mockRejectedValueOnce(new Error('Falha de rede'))
      .mockResolvedValueOnce(details);

    renderCheckout();

    const alert = await screen.findByRole('alert');

    expect(alert).toHaveTextContent('Falha de rede');

    await user.click(
      screen.getByRole('button', {
        name: 'Tentar novamente',
      }),
    );

    expect(
      await screen.findByRole('button', {
        name: 'Pagar R$167,00',
      }),
    ).toBeInTheDocument();

    expect(getPublicCourseByIdMock).toHaveBeenCalledTimes(2);
  });

  it('should send a company back to the company catalog on error', async () => {
    getPublicCourseByIdMock.mockRejectedValue(new Error('Course not found'));

    renderCheckout(`/empresa/checkout/${COURSE_ID}`);

    await waitFor(() => {
      expect(
        screen.getByRole('link', {
          name: 'Voltar ao catálogo',
        }),
      ).toHaveAttribute('href', '/empresa/cursos');
    });
  });
});
