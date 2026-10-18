# AGENTS.md — escapa! Frontend

> Este arquivo é lido por agentes de IA (Copilot, Cursor, Gemini, Claude, etc.) para entender o contexto do projeto e seguir as convenções do time. **Leia-o completamente antes de sugerir ou gerar código.**

## Contexto do Projeto

**escapa!** é uma plataforma digital de **cursos e qualificação profissional em Turismo e Hospitalidade**.

- **Origem de Acesso**: Acessada através de um link no website institucional existente da ESCAPA (o site institucional não faz parte deste repositório e não será alterado).
- **Página Inicial**: Apresenta a plataforma e exibe o catálogo de cursos disponíveis para aquisição e consulta.
- **Perfis de Usuário & Login**: Suporte a clientes individuais (profissionais/alunos) e clientes corporativos (empresas/agências parceiras - B2B).
- **Consumo de Aulas**: Conteúdos em texto, imagens e vídeos integrados via player (YouTube / Vimeo).
- **Controle & Certificação**: Acompanhamento de progresso, download de materiais complementares e emissão de certificados digitais.
- **Administração**: Painel para cadastro de cursos, módulos, aulas e gestão de usuários.

**🚫 Fora do escopo do projeto**: site institucional externo, cursos ao vivo, fórum/comunidade, integração com IA/trilhas inteligentes, plataforma multilíngue, pagamentos integrados.

## Infraestrutura

A aplicação é **containerizada** e será publicada em um cluster **k3s** gerenciado por **Terraform**:

- Build: `Dockerfile` multi-stage (Node 20 Alpine → nginx Alpine)
- Orquestração local: `docker-compose.yml`
- CI/CD: **GitHub Actions** (`.github/workflows/ci.yml`) e GitLab CI (`.gitlab-ci.yml`)
- Templates de PR/MR: `.github/pull_request_template.md` e `.gitlab/merge_request_templates/Default.md`

## Arquitetura de Pastas e Responsabilidades

```
src/
├── assets/           → Arquivos estáticos (imagens, SVGs, fontes)
├── components/
│   ├── ui/           → Componentes atômicos, muitos sobre Radix UI (Button, ConfirmDialog, Table...)
│   ├── layout/       → Casca da aplicação (Sidebar, Navbar, Footer, AuthenticatedLayout)
│   └── course/       → Componentes do domínio de cursos (CourseHeader, LessonVideoPlayer...)
├── contexts/         → React Contexts globais (vazio por enquanto; AuthContext virá com o login)
├── data/             → Dados mockados enquanto o endpoint real não existe (ex.: publicCourses.ts)
├── hooks/            → Estado assíncrono reutilizável (usePublicCourses, useStudentLesson...)
├── pages/            → Uma pasta por rota (NomeDaPagina.tsx + .module.css + .test.tsx)
├── routes/           → AppRouter.tsx (rotas com React.lazy + Suspense)
├── services/         → Chamadas HTTP ao backend (api.ts, courseService, lessonService...)
├── test/             → setup.ts do Vitest
├── types/            → Tipos e interfaces TypeScript compartilhados
├── utils/            → Funções puras sem estado (formatters, mapPublicCourse...)
└── index.css         → Tokens e variáveis globais do Design System
```

Cada componente tem sua pasta (`Nome.tsx`, `Nome.module.css`, `Nome.test.tsx`) e é reexportado no
`index.ts` da pasta-mãe, então importe pelo barrel: `import { Button } from '@components/ui'`.

### 📌 Diretrizes de Arquitetura:

1. **Páginas (`src/pages/`)**: Cuidam do estado da tela, formulários e renderização de componentes. **Nunca fazem `fetch` direto**.
2. **Serviços (`src/services/`)**: Centralizam todas as chamadas HTTP para o backend. As páginas e hooks chamam os serviços.
3. **Hooks (`src/hooks/`)**: Centralizam lógicas de negócio e estados assíncronos compartilhados entre múltiplas telas.
4. **Utils (`src/utils/`)**: Conversão de resposta da API para o modelo da tela (ex.: `mapPublicCourse.ts`) e formatação. Funções puras, sem React.

---

## Regras para Agentes de IA

### ⚠️ Regras Invioláveis

1. **Nunca use `any` em TypeScript.** Use `unknown` e faça narrowing.
2. **Nunca gere default exports.** Use sempre named exports. (`FilterTabs` e `ReferenceAndExternalLinks` ainda têm default export por legado; não copie o padrão.)
3. **Nunca manipule o DOM diretamente.** Use refs do React (`useRef`).
4. **Nunca faça chamadas de API direto nos componentes.** Extraia para `src/services/`.
5. **Nunca importe com caminhos relativos longos** (`../../../`). Use os aliases (`@components/`, `@hooks/`, `@pages/`, `@services/`, `@utils/`, `@contexts/`). Para tipos, use **`@/types/...`** (padrão do código): o alias `@types/` se confunde com os pacotes `@types/*` do npm.
6. **NUNCA escreva cores, tamanhos, tipografia ou espaçamentos hardcoded em CSS.**

---

### 🎨 Regra de Design System — Variáveis CSS Obrigatórias (Style Guide Oficial)

**Todo valor de cor, tamanho, espaçamento ou tipografia em arquivos `.css` DEVE usar uma variável CSS definida em `src/index.css`.**  
Esta regra é validada automaticamente pelo **Stylelint** (`npm run stylelint`).

```css
/* ✅ CORRETO — usa variáveis do style guide oficial */
.title {
  font-family: var(--font-family-base);
  font-size: var(--text-h2);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-4);
}

.button {
  color: var(--color-white);
  background-color: var(--color-primary-500);
  font-size: var(--text-body-3);
  font-weight: var(--font-weight-semibold);
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-md);
  transition: background-color var(--transition-fast);
}

.button:hover {
  background-color: var(--color-primary-400);
}

/* ❌ PROIBIDO — valores hardcoded serão bloqueados pelo Stylelint */
.title {
  font-size: 40px;
  font-weight: 700;
  color: #f4f5f6;
  margin-bottom: 16px;
}

.button {
  color: #ffffff;
  background-color: #2b6fe7;
  font-size: 0.875rem;
  padding: 12px 24px;
  border-radius: 6px;
}
```

#### 🎨 1. Tokens de Cores do Style Guide Oficial:

- **Primária**: `--color-primary-100` até `--color-primary-900` (`500: #2b6fe7` é a base de ação)
- **Secundária**: `--color-secondary-100` até `--color-secondary-900` (`500: #8d63cc` é a base secundária)
- **Neutros**: `--color-neutral-100` até `--color-neutral-900`
- **Sucesso**: `--color-success-100` até `--color-success-500` (`400: #22a061`)
- **Info**: `--color-info-100` até `--color-info-500` (`300: #1adbff`)
- **Atenção**: `--color-warning-100` até `--color-warning-500` (`300: #eead2b`)
- **Erro**: `--color-error-100` até `--color-error-500` (`300: #e23645`)
- **Superfícies**: `--color-surface` (`#0c0c1a`), `--color-surface-raised` (`#0f0f1f`), `--color-surface-overlay`
- **Textos**: `--color-text-primary` (`#f4f5f6`), `--color-text-secondary` (`#c7ccd1`), `--color-text-muted` (`#848f9a`)
- **Bordas**: `--color-border` (`#2e3338`), `--color-border-subtle`, `--color-border-focus` (`#2b6fe7`)

#### 🔤 2. Tokens de Tipografia Oficial (Fonte: Inter):

- **Família de Fonte**: `var(--font-family-base)` ou `var(--font-sans)`
- **Pesos de Fonte**:
  - Regular: `var(--font-weight-regular)` (400)
  - Medium: `var(--font-weight-medium)` (500)
  - Semibold: `var(--font-weight-semibold)` (600)
  - Bold: `var(--font-weight-bold)` (700)
- **Títulos (Headings — Sempre com peso `--font-weight-bold` / 700)**:
  - `--text-h1`: 48px (`3rem`)
  - `--text-h2`: 40px (`2.5rem`)
  - `--text-h3`: 32px (`2rem`)
  - `--text-h4`: 24px (`1.5rem`)
  - `--text-h5`: 20px (`1.25rem`)
  - `--text-h6`: 18px (`1.125rem`)
- **Textos de Corpo (Body)**:
  - `--text-body-1`: 18px (`1.125rem`)
  - `--text-body-2`: 16px (`1rem` - Base padrão)
  - `--text-body-3`: 14px (`0.875rem`)
  - `--text-body-4`: 12px (`0.75rem`)
  - `--text-body-5`: 10px (`0.625rem` - XSmall)

#### 📏 3. Espaçamentos e Bordas:

- **Espaçamentos**: `--space-1` (4px), `--space-2` (8px), `--space-3` (12px), `--space-4` (16px), `--space-5` (20px), `--space-6` (24px), `--space-8` (32px), `--space-10` (40px), `--space-12` (48px), `--space-16` (64px), `--space-20` (80px)
- **Border Radius**: `--radius-sm` (4px), `--radius-md` (6px), `--radius-lg` (8px), `--radius-xl` (12px), `--radius-2xl` (16px), `--radius-full` (9999px)

#### 🎨 4. Ícones Oficiais (Lucide Icons):

- Use **exclusivamente** o pacote `lucide-react` para ícones (`import { Play, Check, BookOpen } from 'lucide-react'`).
- Padrão Figma: grid `24x24px`, stroke `2px`, cantos arredondados `2px`.
- **Radix UI vs Lucide**: Radix UI gerencia a acessibilidade e estado (Dialog, DropdownMenu), e Lucide React fornece os ícones visuais dentro deles.

---

### 📱 Regra Obrigatória de Responsividade (Mobile, Tablet, Desktop e Web)

**Todo componente, página ou layout gerado DEVE ser 100% responsivo**, cobrindo perfeitamente:

- **Mobile (Celulares)**: `< 640px` (`--breakpoint-mobile`)
  - Layout em coluna única, botões e toques acessíveis (`min-height: 44px`), sidebars colapsadas em drawers, **nunca permitir scroll horizontal**.
- **Tablet**: `640px` a `1023px` (`--breakpoint-tablet`)
  - Grids de 2 colunas, sidebars compactas/recolhíveis, tipografia ajustada.
- **Desktop / Laptop / Web**: `>= 1024px` (`--breakpoint-laptop` / `--breakpoint-desktop`)
  - Layout completo com sidebar expansível e grids de 3 a 4 colunas.
- **Wide / Telas Grandes**: `> 1280px` (`--breakpoint-wide`)
  - Conteúdo delimitado por `--container-7xl` (`1280px`).

---

### ✅ Padrões Obrigatórios de Código

> Os exemplos abaixo são simplificados: consulte `CourseInstructor`, `curriculumService`,
> `usePublicCourseDetails` e os testes deles para a versão real.

#### 1. Componentes

```tsx
import styles from './CourseInstructor.module.css';

interface CourseInstructorProps {
  instructor: { name: string; role: string; avatarUrl?: string | null };
}

export const CourseInstructor = ({ instructor }: CourseInstructorProps) => (
  <section className={styles.card} aria-labelledby="course-instructor-title">
    <h2 id="course-instructor-title">Sobre o Instrutor</h2>
    {instructor.avatarUrl ? (
      <img src={instructor.avatarUrl} alt={`Foto de ${instructor.name}`} />
    ) : (
      <span aria-hidden="true">{instructor.name.charAt(0)}</span>
    )}
    <p>{instructor.name}</p>
  </section>
);
```

#### 2. Serviços (API calls em `src/services/`)

Nunca leia `import.meta.env.VITE_API_BASE_URL` direto nem monte o header `X-User-Id` à mão: use
`getApiBaseUrl()` (lê a configuração injetada em runtime pelo nginx) e `adminHeaders()` /
`studentHeaders()` de `api.ts`.

```ts
// src/services/curriculumService.ts
import { getApiBaseUrl } from '@services/runtimeEnv';
import { readApiErrorMessage, studentHeaders, type ApiResponse } from '@services/api';
import type { StudentCurriculum } from '@/types/curriculum';

const API_BASE_URL = getApiBaseUrl();

export class StudentCurriculumError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'StudentCurriculumError';
    this.status = status;
  }
}

export const getStudentCurriculum = async (
  courseId: string,
  signal?: AbortSignal,
): Promise<StudentCurriculum> => {
  const response = await fetch(`${API_BASE_URL}/student/courses/${courseId}/curriculum`, {
    method: 'GET',
    headers: studentHeaders(),
    signal,
  });

  if (!response.ok) {
    throw new StudentCurriculumError(
      response.status,
      (await readApiErrorMessage(response)) ?? 'Não foi possível carregar o conteúdo do curso.',
    );
  }

  const json: ApiResponse<StudentCurriculumResponse> = await response.json();
  return mapStudentCurriculum(json.data); // resposta da API → modelo da tela
};
```

#### 3. Hooks de dados

Hooks expõem `status: 'loading' | 'success' | 'error'` (`LoadStatus`), os dados e `errorMessage`.
A requisição recebe o `signal` de um `AbortController` cancelado no cleanup do `useEffect`, e o
erro de cancelamento é ignorado (ver `usePublicCourseDetails`).

#### 4. Testes Unitários

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CourseCompletionMessage } from './CourseCompletionMessage';

describe('CourseCompletionMessage', () => {
  it('shows the completed course name', () => {
    render(
      <CourseCompletionMessage
        courseTitle="Experiências Imersivas na Prática"
        onViewOtherCourses={vi.fn()}
        onViewCertificate={vi.fn()}
      />,
    );

    expect(screen.getByText('Experiências Imersivas na Prática')).toBeInTheDocument();
  });

  it('calls onViewCertificate when that button is clicked', async () => {
    const onViewCertificate = vi.fn();
    render(
      <CourseCompletionMessage
        courseTitle="Curso"
        onViewOtherCourses={vi.fn()}
        onViewCertificate={onViewCertificate}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Ver Certificado' }));

    expect(onViewCertificate).toHaveBeenCalledOnce();
  });
});
```

---

### 🧩 Convenções de Implementação

- **Contrato com o backend**: sucesso vem no envelope `ApiResponse` (`success`, `data`, `message`) e erro no `ApiError` (`status`, `error`, `message`, `path`, `timestamp`); leia a mensagem de erro com `readApiErrorMessage`. Alguns endpoints **não** usam o envelope de propósito (lista e filtros públicos de cursos, regras do curso, change-log, busca de pré-requisitos): não "corrija" o parse desses sem combinar com o backend.
- **Identificação do usuário é provisória**: até o login com JWT (US-23), rotas `/admin` e `/student` exigem o header `X-User-Id`, montado só por `adminHeaders()` / `studentHeaders()`. Quando o JWT entrar, a troca acontece apenas em `api.ts`.
- **Erros com status**: quando a tela precisa reagir ao status HTTP (403 sem acesso, 404 não encontrado), o serviço lança uma classe de erro própria com `status` (`StudentLessonError`, `StudentCurriculumError`).
- **Mapeamento fora do componente**: converter a resposta da API para o modelo da tela fica no serviço ou em `src/utils/` (ex.: `mapPublicCourseToCardProps`), nunca no JSX.
- **Rotas novas** entram em `AppRouter.tsx` com `React.lazy`. Rota de menu sem tela ainda cai em `UnderConstruction`.
- **Ambiente**: o projeto roda em **Node 20** (mesma versão da CI e do `Dockerfile`).

---

### 🧪 Testes

> Guia passo a passo (onde criar, exemplos de componente/página/serviço, como rodar e como ler a
> cobertura) no `README.md`, seção **"Testes Unitários: como criar, rodar e ver a cobertura"**.

- **Onde mockar**: páginas e hooks mockam o **serviço** (`vi.mock('@services/courseService')`); testes de serviço mockam o **`fetch`** com `vi.stubGlobal('fetch', ...)` e limpam com `vi.unstubAllGlobals()` / `vi.restoreAllMocks()` no `afterEach`. Não atribua globais à mão (`URL.createObjectURL = vi.fn()`): use `vi.stubGlobal` ou `vi.spyOn`, que são restaurados.
- **Consultas**: prefira `getByRole` / `getByLabelText` com nome acessível. Use `container.querySelector`, `data-testid` e `className` só quando não houver papel acessível ou quando a classe for o próprio comportamento testado.
- **Interação**: use `userEvent` (com `await`). Chamar `.focus()` à mão não testa teclado: use `user.tab()` / `user.keyboard(...)`.
- **Assíncrono**: use `findBy*` / `waitFor`. Não espere com `setTimeout` real; para debounce e timers use `vi.useFakeTimers()`.
- **Rejeições**: `await expect(promise).rejects.toThrow(...)` / `.rejects.toMatchObject(...)`, sem `try/catch` no teste.
- **Rotas**: componentes com `Link` ou `useNavigate` são renderizados dentro de `MemoryRouter`; para conferir a navegação, renderize a rota de destino ou um `LocationProbe` com `useLocation`.
- **`localStorage`**: o `src/test/setup.ts` restaura o `localStorage` do jsdom (o Node 25 substitui o global por um objeto vazio). Não remova esse trecho.

#### Asserts que validam de verdade (evite falso positivo)

- **Teste de ausência precisa de um cenário em que o elemento existiria se o código estivesse errado.** Ex.: para "não mostra o rating sem `rating`", passe `reviewsCount` e confira que ele não aparece; procurar um texto que o teste nunca passou passa sempre.
- **O nome do teste descreve o que é verificado.** Se o nome diz "mantém filtros independentes", o teste precisa clicar num filtro e conferir o outro; se diz "aria-label", confira o atributo `aria-label`.
- **Confira o valor esperado**, não só que algo existe: evite `toBeDefined()`, `toBeTruthy()`, `length > 0` e `toHaveTextContent('R$')` quando o valor exato é conhecido.
- **Cubra os caminhos de erro e de carregamento** (branch), não só o caminho feliz.
- Não escreva teste que só repete outro com nome diferente.

#### Cobertura

- `npm run test:coverage` mostra a tabela no terminal (a coluna **Uncovered Line #s** lista as linhas não executadas) e gera `coverage/index.html` com o detalhe linha a linha.
- A cobertura mede só `src/` sem testes, `main.tsx`, `types/` e dados mockados estáticos (ver `exclude` em `vitest.config.ts`). Arquivo novo **só de dados**, sem lógica, entra nessa lista.
- A CI roda os testes com cobertura e publica o relatório (resumo no GitHub Actions, artifact `coverage/` e relatório de linhas no MR do GitLab).

---

### Commits & Branches

- Formato de Commit: `<tipo>(#<issue_id>): <descrição curta>` (ex: `feat(#12): add course filters`)
- Branches: criadas a partir de **`develop`** no formato `<tipo>/#<issue_id>-<breve-descricao>` (ex: `feat/#12-course-filters`)
- Pull Requests / Merge Requests sempre apontando para a branch **`develop`** com `Closes #<id>` na descrição.

---

_Última atualização: Outubro/2026_
