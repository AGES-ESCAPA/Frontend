import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext } from '@contexts/authContextDefinition';
import { OrderServiceError, createOrder, getSeatPrice } from '@services/orderService';
import { profileService } from '@services/profileService';
import { getCourseAccessPath } from '@utils/courseAccess';
import type { UserProfile } from '@/types/profile';
import type { AuthUser } from '@/types/auth';
import { courseService, CourseRequestError } from '@services/courseService';
import type * as CourseServiceModule from '@services/courseService';
import type { PublicCourseDetails } from '@/types/course';
import type { OrderConfirmationState, PlacedOrder } from '@/types/order';
import { CHECKOUT_MAX_INSTALLMENTS, Checkout } from './Checkout';

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

vi.mock('@services/orderService', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  createOrder: vi.fn(),
  getSeatPrice: vi.fn(),
}));

vi.mock('@services/profileService', () => ({
  profileService: { getProfile: vi.fn() },
}));

vi.mock('@utils/courseAccess', () => ({ getCourseAccessPath: vi.fn() }));

const getPublicCourseByIdMock = vi.mocked(courseService.getPublicCourseById);
const createOrderMock = vi.mocked(createOrder);
const getSeatPriceMock = vi.mocked(getSeatPrice);
const getProfileMock = vi.mocked(profileService.getProfile);
const getCourseAccessPathMock = vi.mocked(getCourseAccessPath);

const studentProfile: UserProfile = {
  profile: 'STUDENT',
  editable: true,
  name: 'João Pedro Alves',
  email: 'joao.alves@email.com',
  cpf: '52998224725',
  phone: null,
  companyName: null,
  cnpj: null,
  avatarUrl: null,
};

const companyProfile: UserProfile = {
  profile: 'COMPANY',
  editable: true,
  name: 'Responsável',
  email: 'contato@hostel.com.br',
  cpf: null,
  phone: null,
  companyName: 'Hostel Centro Histórico ME',
  cnpj: '44555666000124',
  avatarUrl: null,
};

const companyUser: AuthUser = {
  id: 'd0000000-0000-4000-d000-000000000004',
  name: 'Hostel Centro Histórico',
  email: 'contato@hostel.com.br',
  role: 'COMPANY',
};

const placedOrder: PlacedOrder = {
  orderId: '67f8851a-c299-40cd-8de2-df0823075075',
  status: 'APPROVED',
  itemType: 'COURSE',
  courseId: 'e0000000-0000-4000-e000-000000000004',
  seatsQuantity: null,
  amount: 167,
  paymentMethod: 'CARD',
  installments: 1,
  createdAt: '2026-10-24T15:32:49.461540389',
};

/** Mostra onde o checkout parou e o que mandou para a confirmação. */
const ConfirmationProbe = () => {
  const location = useLocation();
  const state = location.state as OrderConfirmationState | null;
  return (
    <output>{`${location.pathname}|${state?.order.orderId ?? ''}|${state?.itemTitle ?? ''}`}</output>
  );
};

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

const sessionUser: AuthUser = {
  id: 'b0000000-0000-4000-b000-000000000002',
  name: 'João Pedro Alves',
  email: 'joao.alves@email.com',
  role: 'STUDENT',
};

const renderCheckout = (
  path = `/checkout/${COURSE_ID}`,
  props = {},
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
        updateUser: vi.fn(),
      }}
    >
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/checkout/confirmacao" element={<ConfirmationProbe />} />
          <Route path="/empresa/checkout/confirmacao" element={<ConfirmationProbe />} />
          <Route path="/checkout/assentos" element={<Checkout kind="seats" {...props} />} />
          <Route path="/empresa/checkout/assentos" element={<Checkout kind="seats" {...props} />} />
          <Route path="/checkout/:courseId" element={<Checkout {...props} />} />
          <Route path="/aluno/cursos/:courseId/aulas/:lessonId" element={<ConfirmationProbe />} />
          <Route path="/empresa/cursos" element={<ConfirmationProbe />} />
          <Route path="/empresa/checkout/:courseId" element={<Checkout {...props} />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );

const fillValidCard = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText('Nome impresso no cartão'), 'jorge amado');
  await user.type(screen.getByLabelText('Número do cartão'), VALID_NUMBER);
  await user.type(screen.getByLabelText('Data de vencimento'), '1299');
  await user.type(screen.getByLabelText('CVV'), '123');
};

describe('Checkout', () => {
  beforeEach(() => {
    getPublicCourseByIdMock.mockReset();
    getPublicCourseByIdMock.mockResolvedValue(details);
    createOrderMock.mockReset();
    createOrderMock.mockResolvedValue(placedOrder);
    getSeatPriceMock.mockReset();
    getSeatPriceMock.mockResolvedValue(79);
    getProfileMock.mockReset();
    getProfileMock.mockResolvedValue(studentProfile);
    getCourseAccessPathMock.mockReset();
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

    await waitFor(() => expect(createOrderMock).toHaveBeenCalledTimes(1));
    expect(createOrderMock).toHaveBeenCalledWith({
      itemType: 'COURSE',
      courseId: COURSE_ID,
      paymentMethod: 'CARD',
      installments: 1,
    });
    expect(JSON.stringify(createOrderMock.mock.calls)).not.toContain(VALID_NUMBER);
    expect(JSON.stringify(createOrderMock.mock.calls)).not.toContain('amount');
  });

  it('should go to the confirmation with the approved order and the course title', async () => {
    const user = userEvent.setup();
    renderCheckout();
    await screen.findByRole('button', { name: 'Pagar R$167,00' });
    await fillValidCard(user);

    await user.click(screen.getByRole('button', { name: 'Pagar R$167,00' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      `/checkout/confirmacao|${placedOrder.orderId}|Hospitalidade de Luxo`,
    );
  });

  it('should send a company to its own confirmation route', async () => {
    const user = userEvent.setup();
    renderCheckout(`/empresa/checkout/${COURSE_ID}`);
    await screen.findByRole('button', { name: 'Pagar R$167,00' });
    await fillValidCard(user);

    await user.click(screen.getByRole('button', { name: 'Pagar R$167,00' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      `/empresa/checkout/confirmacao|${placedOrder.orderId}`,
    );
  });

  it('should keep the button busy and place the order only once while it is in progress', async () => {
    const user = userEvent.setup();
    let resolveOrder: (order: PlacedOrder) => void = () => undefined;
    createOrderMock.mockReturnValue(
      new Promise<PlacedOrder>((resolve) => {
        resolveOrder = resolve;
      }),
    );
    renderCheckout();
    await screen.findByRole('button', { name: 'Pagar R$167,00' });
    await fillValidCard(user);

    await user.click(screen.getByRole('button', { name: 'Pagar R$167,00' }));
    const button = screen.getByRole('button', { name: 'Pagar R$167,00' });
    await user.click(button);

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(createOrderMock).toHaveBeenCalledTimes(1);

    resolveOrder(placedOrder);
    await screen.findByText(/confirmacao/);
  });

  it('should show the reason and let the user try again when the purchase fails', async () => {
    const user = userEvent.setup();
    createOrderMock.mockRejectedValueOnce(
      new OrderServiceError(409, 'Você já tem acesso ativo a este curso.'),
    );
    renderCheckout();
    await screen.findByRole('button', { name: 'Pagar R$167,00' });
    await fillValidCard(user);

    await user.click(screen.getByRole('button', { name: 'Pagar R$167,00' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Você já tem acesso ativo a este curso.',
    );
    expect(screen.getByRole('button', { name: 'Pagar R$167,00' })).toBeEnabled();
    expect(screen.getByLabelText('Número do cartão')).toHaveValue('4539 1488 0343 6467');

    await user.click(screen.getByRole('button', { name: 'Pagar R$167,00' }));

    expect(await screen.findByRole('status')).toHaveTextContent(placedOrder.orderId);
    expect(createOrderMock).toHaveBeenCalledTimes(2);
  });

  it('should offer a retry toast that sends the same choice again when the purchase fails', async () => {
    const user = userEvent.setup();
    createOrderMock.mockRejectedValueOnce(new Error('boom'));
    renderCheckout();
    await screen.findByRole('button', { name: 'Pagar R$167,00' });
    await fillValidCard(user);
    await user.selectOptions(screen.getByLabelText('Parcelas'), '3');

    await user.click(screen.getByRole('button', { name: 'Pagar R$167,00' }));

    expect(await screen.findByText('Não foi possível concluir a compra')).toBeInTheDocument();
    expect(screen.getByLabelText('Número do cartão')).toHaveValue('4539 1488 0343 6467');

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    await screen.findByText(/confirmacao/);
    expect(createOrderMock).toHaveBeenCalledTimes(2);
    expect(createOrderMock.mock.calls[1][0]).toEqual(createOrderMock.mock.calls[0][0]);
    expect(createOrderMock.mock.calls[1][0]).toMatchObject({ installments: 3 });
  });

  it('should link a student who already has the course to the course itself on a 409', async () => {
    const user = userEvent.setup();
    createOrderMock.mockRejectedValueOnce(
      new OrderServiceError(409, 'Você já tem acesso ativo a este curso.'),
    );
    getCourseAccessPathMock.mockResolvedValue(`/aluno/cursos/${COURSE_ID}/aulas/aula-1`);
    renderCheckout();
    await screen.findByRole('button', { name: 'Pagar R$167,00' });
    await fillValidCard(user);

    await user.click(screen.getByRole('button', { name: 'Pagar R$167,00' }));
    await user.click(await screen.findByRole('button', { name: 'Ir para o curso' }));

    expect(
      await screen.findByText(new RegExp(`/aluno/cursos/${COURSE_ID}/aulas/aula-1`)),
    ).toBeInTheDocument();
    expect(getCourseAccessPathMock).toHaveBeenCalledWith(COURSE_ID);
  });

  it('should show the buyer of the profile in the summary', async () => {
    renderCheckout(`/checkout/${COURSE_ID}`, {}, sessionUser);

    expect(await screen.findByText('Dados do comprador')).toBeInTheDocument();
    const summary = within(screen.getByRole('complementary', { name: 'Resumo do pedido' }));
    expect(summary.getByText('joao.alves@email.com')).toBeInTheDocument();
    expect(summary.getByText('CPF: ***.***.247-25')).toBeInTheDocument();
    expect(summary.getByText('Cartão de Crédito')).toBeInTheDocument();
  });

  it('should keep the summary without buyer when the profile cannot be loaded', async () => {
    getProfileMock.mockRejectedValue(new Error('offline'));
    renderCheckout();

    await screen.findByRole('button', { name: 'Pagar R$167,00' });
    expect(screen.queryByText('Dados do comprador')).not.toBeInTheDocument();
  });

  it('should offer installments up to the checkout limit with the value of each one', async () => {
    renderCheckout();
    await screen.findByRole('button', { name: 'Pagar R$167,00' });

    const installments = screen.getByLabelText('Parcelas');
    expect(within(installments).getAllByRole('option')).toHaveLength(CHECKOUT_MAX_INSTALLMENTS);
    expect(
      within(installments).getByRole('option', { name: /^2x de R\$\s83,50$/ }),
    ).toBeInTheDocument();
  });

  it('should take a logged company on the shared course route to the company confirmation', async () => {
    const user = userEvent.setup();
    getProfileMock.mockResolvedValue(companyProfile);
    renderCheckout(`/checkout/${COURSE_ID}`, {}, companyUser);
    await screen.findByRole('button', { name: 'Pagar R$167,00' });
    await fillValidCard(user);

    await user.click(screen.getByRole('button', { name: 'Pagar R$167,00' }));

    expect(await screen.findByText(/^\/empresa\/checkout\/confirmacao/)).toBeInTheDocument();
  });

  describe('seats', () => {
    it('should show the seats package with the total of the configured seat price and the company', async () => {
      getProfileMock.mockResolvedValue(companyProfile);
      renderCheckout('/empresa/checkout/assentos?quantidade=10', {}, companyUser);

      expect(await screen.findByRole('button', { name: 'Pagar R$790,00' })).toBeInTheDocument();
      expect(screen.getByText('Pacote de 10 Assentos Corporativos')).toBeInTheDocument();
      expect(await screen.findByText('Hostel Centro Histórico ME')).toBeInTheDocument();
      expect(screen.getByText('CNPJ: **.***.***/0001-24')).toBeInTheDocument();
      expect(getPublicCourseByIdMock).not.toHaveBeenCalled();
    });

    it('should buy the seats with only the quantity, the payment method and the installments', async () => {
      const user = userEvent.setup();
      createOrderMock.mockResolvedValue({
        ...placedOrder,
        itemType: 'SEATS',
        courseId: null,
        seatsQuantity: 10,
        amount: 790,
      });
      renderCheckout('/empresa/checkout/assentos?quantidade=10', {}, companyUser);
      await screen.findByRole('button', { name: 'Pagar R$790,00' });
      await fillValidCard(user);

      await user.click(screen.getByRole('button', { name: 'Pagar R$790,00' }));

      expect(createOrderMock).toHaveBeenCalledWith({
        itemType: 'SEATS',
        seatsQuantity: 10,
        paymentMethod: 'CARD',
        installments: 1,
      });
      expect(await screen.findByText(/^\/empresa\/checkout\/confirmacao/)).toBeInTheDocument();
    });

    it.each(['', '?quantidade=0', '?quantidade=-3', '?quantidade=2.5', '?quantidade=abc'])(
      'should refuse an invalid quantity (%s) with a way back to the catalog',
      async (search) => {
        renderCheckout(`/empresa/checkout/assentos${search}`, {}, companyUser);

        expect(await screen.findByRole('alert')).toHaveTextContent(
          'Informe uma quantidade de assentos válida.',
        );
        expect(screen.getByRole('link', { name: 'Voltar ao catálogo' })).toHaveAttribute(
          'href',
          '/empresa/cursos',
        );
        expect(getSeatPriceMock).not.toHaveBeenCalled();
      },
    );

    it('should let the company retry when the seat price cannot be loaded', async () => {
      const user = userEvent.setup();
      getSeatPriceMock.mockRejectedValueOnce(
        new OrderServiceError(0, 'Não foi possível carregar o valor dos assentos.'),
      );
      renderCheckout('/empresa/checkout/assentos?quantidade=5', {}, companyUser);

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Não foi possível carregar o valor dos assentos.',
      );
      await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

      expect(await screen.findByRole('button', { name: 'Pagar R$395,00' })).toBeInTheDocument();
    });
  });

  it('should show the logged user in the layout when there is a session', async () => {
    renderCheckout(`/checkout/${COURSE_ID}`, {}, sessionUser);

    await screen.findByRole('button', { name: 'Pagar R$167,00' });

    expect(screen.getAllByText('João Pedro Alves').length).toBeGreaterThan(0);
    expect(screen.queryByText('Jorge Amado')).not.toBeInTheDocument();
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
