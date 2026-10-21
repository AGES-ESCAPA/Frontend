# GitHub Copilot Code Review — Escapa! Frontend

## Contexto

Frontend da plataforma de cursos e qualificação profissional em Turismo e Hospitalidade.

**Stack:** React 18, TypeScript (strict), Vite 5, React Router 6, Radix UI, lucide-react, CSS
Modules com tokens em `src/index.css`, Vitest + React Testing Library, ESLint, Stylelint,
Prettier, Docker (nginx), GitHub Actions e GitLab CI. Node 20.

**Objetivo do review:** apontar bugs, riscos, quebras de contrato com o backend, problemas de
acessibilidade e testes que não validam nada, com sugestões concretas e priorizadas por impacto.
Formatação, lint e tokens de CSS já são cobertos pelo Prettier, ESLint e Stylelint na CI.

Convenções completas em `AGENTS.md`.

---

## Camadas (violação = bloqueante)

- **`pages/` e `components/`** — estado de tela e renderização. **Nunca** fazem `fetch` direto
  nem conhecem URL da API.
- **`hooks/`** — estado assíncrono reutilizável. Chamam serviços, expõem `status`
  (`'loading' | 'success' | 'error'`), dados e `errorMessage`, e cancelam a requisição com
  `AbortController` no cleanup do `useEffect`.
- **`services/`** — todas as chamadas HTTP. Única camada que conhece endpoints, headers e o
  envelope da API.
- **`utils/`** — funções puras (formatação, mapeamento API → modelo da tela). Sem React.

---

## Prioridades de Revisão

1. **Corretude & bugs** — efeito sem cleanup (requisição que atualiza estado depois de
   desmontar), dependências erradas em `useEffect`/`useMemo`, estado derivado duplicado,
   `key` instável em listas, datas/fusos (`formatLongDate` não pode deslocar o dia), valores
   monetários.
2. **Contrato com o backend** — ver seção própria.
3. **Acessibilidade** — controles interativos com papel e nome acessível (`button`, `link`,
   `aria-label` quando não há texto), `alt` em imagens, foco visível, `aria-current`/
   `aria-expanded` corretos, nada clicável feito com `div` sem teclado.
4. **Testes** — ver seção própria.
5. **Responsividade** — layout quebrando em `< 640px`, scroll horizontal, alvo de toque menor
   que `44px`.
6. **Manutenibilidade** — componente fazendo mapeamento de API no JSX, lógica duplicada que já
   existe em `utils/` ou `hooks/`, dead code.

---

## Convenções do projeto (apontar quando violadas)

- **URL e headers da API:** serviços usam `getApiBaseUrl()` (`runtimeEnv.ts`) e
  `adminHeaders()` / `studentHeaders()` (`api.ts`). Sinalize `import.meta.env.VITE_API_BASE_URL`
  lido direto, `X-User-Id` montado à mão ou `fetch` fora de `services/`.
- **Erros da API:** a mensagem vem de `readApiErrorMessage(response)` com um fallback em
  português. Quando a tela reage ao status (403/404), o serviço lança erro com `status`
  (`StudentLessonError`, `StudentCurriculumError`).
- **TypeScript:** sem `any` (use `unknown` + narrowing), `import type` para tipos.
- **Exports e imports:** named exports; aliases (`@components/`, `@services/`, `@hooks/`,
  `@utils/`) e tipos via `@/types/...`; componentes importados pelo barrel
  (`@components/ui`). Componente novo precisa entrar no `index.ts` da pasta.
- **Rotas:** página nova entra no `AppRouter.tsx` com `React.lazy`.
- **CSS:** só tokens de `src/index.css` (o Stylelint bloqueia valores fixos); estilo em
  `.module.css`, não `style={{ }}` inline.
- **Ícones:** apenas `lucide-react`.

---

## Contrato com o backend

- Sucesso no envelope `ApiResponse` (`success`, `data`, `message`); erro no `ApiError`
  (`status`, `error`, `message`, `path`, `timestamp`).
- O header `X-User-Id` é provisório até o login com JWT (US-23); a troca para
  `Authorization: Bearer` deve acontecer só em `api.ts`.
- Mudança de campo, de rota ou de formato de resposta precisa estar alinhada com o backend
  (cite o PR/issue do backend).

---

## Testes

- Todo componente, hook, serviço e utilitário novo tem teste (`.test.tsx` / `.test.ts`).
- Páginas e hooks mockam o **serviço** (`vi.mock('@services/...')`); serviços mockam o `fetch`
  com `vi.stubGlobal` e restauram no `afterEach`. Sinalize global atribuído à mão
  (`URL.createObjectURL = ...`, `Object.defineProperty(navigator, ...)`) sem restaurar.
- Consultas por papel/nome acessível (`getByRole`, `getByLabelText`); `userEvent` em vez de
  `fireEvent` para interação; `findBy*`/`waitFor` em vez de `setTimeout` real.
- **Aponte testes que passam mesmo com o código quebrado:**
  - ausência conferida com um dado que o teste nunca passou (ex.: `queryByText('(247)')` sem
    passar `reviewsCount`);
  - nome do teste promete um comportamento que o corpo não verifica (ex.: "mantém filtros
    independentes" sem clicar em nenhum filtro; "recebe foco pelo teclado" usando `.focus()`);
  - asserts vagos quando o valor é conhecido (`toBeDefined()`, `toBeTruthy()`, `length > 0`,
    `toHaveTextContent('R$')`);
  - teste duplicado de outro com nome diferente.
- Rejeições com `await expect(...).rejects`, não `try/catch`.
- Mudança que cria `if`/ternário novo sem teste do outro caminho (erro, vazio, carregando).

---

## O que NÃO comentar

- Formatação, ordem de imports e regras já cobertas por Prettier, ESLint e Stylelint.
- Os default exports legados de `FilterTabs` e `ReferenceAndExternalLinks` (só aponte em
  arquivo novo).
- Endpoints que respondem sem `ApiResponse` (lista e filtros públicos de cursos): o formato é
  combinado com o backend.
- Avisos `React Router Future Flag Warning` no log de testes.
- Pedidos de teste para arquivos só de tipos (`src/types/`) ou dados mockados estáticos
  (`src/data/`), que ficam fora da cobertura.
