import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext } from '@contexts/authContextDefinition';
import { getCourseAccessPath } from '@utils/courseAccess';
import type { AuthUser } from '@/types/auth';
import type { OrderConfirmationState, PlacedOrder } from '@/types/order';
import { OrderConfirmation } from './OrderConfirmation';

vi.mock('@utils/courseAccess', () => ({
  getCourseAccessPath: vi.fn(),
}));

const getCourseAccessPathMock = vi.mocked(getCourseAccessPath);

const COURSE_ID = 'e0000000-0000-4000-e000-000000000003';

const courseOrder: PlacedOrder = {
  orderId: '67f8851a-c299-40cd-8de2-df0823075075',
  status: 'APPROVED',
  itemType: 'COURSE',
  courseId: COURSE_ID,
  seatsQuantity: null,
  amount: 297,
  paymentMethod: 'CARD',
  installments: 3,
  createdAt: '2026-10-24T15:32:49.461540389',
};

const seatsOrder: PlacedOrder = {
  ...courseOrder,
  itemType: 'SEATS',
  courseId: null,
  seatsQuantity: 10,
  amount: 790,
  installments: 1,
};

const sessionUser: AuthUser = {
  id: 'b0000000-0000-4000-b000-000000000002',
  name: 'João Pedro Alves',
  email: 'joao.alves@email.com',
  role: 'STUDENT',
};

/** Mostra para onde a confirmação mandou o usuário. */
const Destination = ({ label }: { label: string }) => {
  const { pathname } = useLocation();
  return <output>{`${label}:${pathname}`}</output>;
};

const renderConfirmation = (
  path: string,
  state: OrderConfirmationState | unknown,
  user: AuthUser | null = null,
) =>
  render(
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isRestoring: false,
        login: vi.fn(),
        logout: vi.fn(),
      }}
    >
      <MemoryRouter initialEntries={[{ pathname: path, state }]}>
        <Routes>
          <Route path="/checkout/confirmacao" element={<OrderConfirmation />} />
          <Route path="/empresa/checkout/confirmacao" element={<OrderConfirmation />} />
          <Route path="/meus-cursos" element={<Destination label="meus-cursos" />} />
          <Route path="/empresa/cursos" element={<Destination label="catalogo-empresa" />} />
          <Route path="/empresa/colaboradores" element={<Destination label="colaboradores" />} />
          <Route
            path="/aluno/cursos/:courseId/aulas/:lessonId"
            element={<Destination label="aula" />}
          />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );

describe('OrderConfirmation', () => {
  beforeEach(() => {
    getCourseAccessPathMock.mockReset();
    getCourseAccessPathMock.mockResolvedValue(`/aluno/cursos/${COURSE_ID}/aulas/lesson-1`);
  });

  describe('student buying a course', () => {
    const state: OrderConfirmationState = {
      order: courseOrder,
      itemTitle: 'Hospitalidade de Luxo',
    };

    it('should confirm the approved purchase and say the access is already released', () => {
      renderConfirmation('/checkout/confirmacao', state);

      expect(
        screen.getByRole('heading', { level: 1, name: 'Compra aprovada!' }),
      ).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Pagamento confirmado' })).toBeInTheDocument();
      expect(screen.getByText(/Seu acesso ao curso já está liberado/)).toBeInTheDocument();
    });

    it('should register the order with item, value, payment method, date and the approved status', () => {
      renderConfirmation('/checkout/confirmacao', state);

      expect(screen.getByText('#67F8851A')).toBeInTheDocument();
      expect(screen.getByText('Hospitalidade de Luxo')).toBeInTheDocument();
      expect(screen.getByText('Cartão de crédito em 3x')).toBeInTheDocument();
      expect(screen.getByText('24 de outubro de 2026 às 15:32')).toBeInTheDocument();
      expect(screen.getByText('Aprovado')).toBeInTheDocument();
      expect(screen.getByText(/297,00/)).toBeInTheDocument();
    });

    it('should say "à vista" when there is a single installment', () => {
      renderConfirmation('/checkout/confirmacao', {
        order: { ...courseOrder, installments: 1 },
        itemTitle: 'Hospitalidade de Luxo',
      });

      expect(screen.getByText('Cartão de crédito à vista')).toBeInTheDocument();
    });

    it('should take the student to the purchased course', async () => {
      const user = userEvent.setup();
      renderConfirmation('/checkout/confirmacao', state);

      await user.click(screen.getByRole('button', { name: 'Acessar curso' }));

      expect(getCourseAccessPathMock).toHaveBeenCalledWith(COURSE_ID);
      expect(await screen.findByRole('status')).toHaveTextContent(
        `aula:/aluno/cursos/${COURSE_ID}/aulas/lesson-1`,
      );
    });

    it('should also offer a link to my courses', () => {
      renderConfirmation('/checkout/confirmacao', state);

      expect(screen.getByRole('link', { name: 'Ver meus cursos' })).toHaveAttribute(
        'href',
        '/meus-cursos',
      );
    });

    it('should not offer company destinations to a student', () => {
      renderConfirmation('/checkout/confirmacao', state);

      expect(screen.queryByRole('link', { name: 'Ir para colaboradores' })).not.toBeInTheDocument();
      expect(
        screen.queryByRole('link', { name: 'Ver catálogo de cursos' }),
      ).not.toBeInTheDocument();
    });

    it('should use the name of the logged user in the layout', () => {
      renderConfirmation('/checkout/confirmacao', state, sessionUser);

      expect(screen.getAllByText('João Pedro Alves').length).toBeGreaterThan(0);
    });
  });

  describe('company buying a course', () => {
    const state: OrderConfirmationState = {
      order: courseOrder,
      itemTitle: 'Hospitalidade de Luxo',
    };

    it('should say the course was added to the company catalog', () => {
      renderConfirmation('/empresa/checkout/confirmacao', state);

      expect(
        screen.getByText('O curso foi adicionado ao catálogo da sua empresa.'),
      ).toBeInTheDocument();
    });

    it('should send the company to its internal catalog', () => {
      renderConfirmation('/empresa/checkout/confirmacao', state);

      expect(screen.getByRole('link', { name: 'Ver catálogo de cursos' })).toHaveAttribute(
        'href',
        '/empresa/cursos',
      );
      expect(screen.queryByRole('button', { name: 'Acessar curso' })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Ir para colaboradores' })).not.toBeInTheDocument();
    });
  });

  describe('company buying seats', () => {
    const state: OrderConfirmationState = { order: seatsOrder };

    it('should describe the seats package and the value', () => {
      renderConfirmation('/empresa/checkout/confirmacao', state);

      expect(screen.getByText('Pacote de 10 assentos corporativos')).toBeInTheDocument();
      expect(screen.getByText(/790,00/)).toBeInTheDocument();
      expect(screen.getByText('Cartão de crédito à vista')).toBeInTheDocument();
    });

    it('should explain that seats do not release any course', () => {
      renderConfirmation('/empresa/checkout/confirmacao', state);

      expect(screen.getByText(/Eles não liberam cursos/)).toBeInTheDocument();
    });

    it('should send the company to the collaborators page', () => {
      renderConfirmation('/empresa/checkout/confirmacao', state);

      expect(screen.getByRole('link', { name: 'Ir para colaboradores' })).toHaveAttribute(
        'href',
        '/empresa/colaboradores',
      );
      expect(
        screen.queryByRole('link', { name: 'Ver catálogo de cursos' }),
      ).not.toBeInTheDocument();
    });

    it('should use the singular for a single seat', () => {
      renderConfirmation('/empresa/checkout/confirmacao', {
        order: { ...seatsOrder, seatsQuantity: 1 },
      });

      expect(screen.getByText('Pacote de 1 assento corporativo')).toBeInTheDocument();
    });
  });

  describe('without an approved order to confirm', () => {
    it('should send a student to my courses when the page is opened directly', async () => {
      renderConfirmation('/checkout/confirmacao', undefined);

      await waitFor(() =>
        expect(screen.getByRole('status')).toHaveTextContent('meus-cursos:/meus-cursos'),
      );
    });

    it('should send a company to its catalog when the page is opened directly', async () => {
      renderConfirmation('/empresa/checkout/confirmacao', undefined);

      await waitFor(() =>
        expect(screen.getByRole('status')).toHaveTextContent('catalogo-empresa:/empresa/cursos'),
      );
    });

    it('should not confirm an order that was not approved', async () => {
      renderConfirmation('/checkout/confirmacao', {
        order: { ...courseOrder, status: 'CANCELLED' },
      });

      await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('meus-cursos'));
      expect(screen.queryByText('Compra aprovada!')).not.toBeInTheDocument();
    });

    it('should ignore a state that does not look like an order', async () => {
      renderConfirmation('/checkout/confirmacao', { order: { orderId: 123 } });

      await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('meus-cursos'));
    });
  });
});
