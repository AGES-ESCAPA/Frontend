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
│   ├── ui/           → Primitivas e componentes atômicos Radix UI (Button, Dialog, Toast...)
│   └── layout/       → Componentes estruturais de casca (Sidebar, Header, Footer)
├── contexts/         → React Contexts globais (ex: AuthContext)
├── hooks/            → Custom hooks reutilizáveis (useAuth, useCourseProgress...)
├── pages/            → Uma pasta por rota (NomeDaPagina.tsx + .module.css + .test.tsx)
├── routes/           → AppRouter.tsx com Lazy Loading + ProtectedRoute.tsx
├── services/         → Comunicação e requisições HTTP para a API backend (courseService, authService...)
├── test/             → setup.ts do Vitest
├── types/            → Tipos e interfaces TypeScript compartilhados
├── utils/            # Helpers e funções puras sem estado (formatCurrency, formatDuration...)
└── index.css         → Tokens e variáveis globais do Design System
```

### 📌 Diretrizes de Arquitetura:
1. **Páginas (`src/pages/`)**: Cuidam do estado da tela, formulários e renderização de componentes. **Nunca fazem `fetch` direto**.
2. **Serviços (`src/services/`)**: Centralizam todas as chamadas HTTP para o backend. As páginas e hooks chamam os serviços.
3. **Hooks (`src/hooks/`)**: Centralizam lógicas de negócio e estados assíncronos compartilhados entre múltiplas telas.

---

## Regras para Agentes de IA

### ⚠️ Regras Invioláveis

1. **Nunca use `any` em TypeScript.** Use `unknown` e faça narrowing.
2. **Nunca gere default exports.** Use sempre named exports.
3. **Nunca manipule o DOM diretamente.** Use refs do React (`useRef`).
4. **Nunca faça chamadas de API direto nos componentes.** Extraia para `src/services/`.
5. **Nunca importe com caminhos relativos longos** (`../../../`). Use os aliases (`@components/`, `@hooks/`, `@pages/`, `@services/`, `@utils/`, `@types/`, `@contexts/`).
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

#### 1. Componentes

```tsx
import type { FC } from 'react';
import styles from './CourseCard.module.css';

interface CourseCardProps {
  title: string;
  thumbnailUrl: string;
  duration: number; // em segundos
  onSelect: () => void;
}

export const CourseCard: FC<CourseCardProps> = ({ title, thumbnailUrl, duration, onSelect }) => {
  return (
    <article className={styles.card}>
      <img src={thumbnailUrl} alt={title} className={styles.thumbnail} />
      <h2 className={styles.title}>{title}</h2>
      <button onClick={onSelect} className={styles.btn} aria-label={`Ver detalhes de ${title}`}>
        Ver Curso
      </button>
    </article>
  );
};
```

#### 2. Serviços (API calls em `src/services/`)

```ts
// src/services/courseService.ts
import type { Course } from '@types/course';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export const getCourseById = async (id: string): Promise<Course> => {
  const response = await fetch(`${API_BASE}/courses/${id}`);
  if (!response.ok) throw new Error(`Falha ao buscar curso ${id}`);
  return response.json() as Promise<Course>;
};
```

#### 3. Testes Unitários

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CourseCard } from './CourseCard';

describe('CourseCard', () => {
  it('should render the course title', () => {
    render(<CourseCard title="Hospitalidade de Luxo" thumbnailUrl="" duration={3600} onSelect={vi.fn()} />);
    expect(screen.getByText('Hospitalidade de Luxo')).toBeInTheDocument();
  });

  it('should call onSelect when the button is clicked', async () => {
    const onSelect = vi.fn();
    render(<CourseCard title="Test" thumbnailUrl="" duration={0} onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('button', { name: /ver detalhes de test/i }));
    expect(onSelect).toHaveBeenCalledOnce();
  });
});
```

---

### Commits & Branches

- Formato de Commit: `<tipo>(#<issue_id>): <descrição curta>` (ex: `feat(#12): add course filters`)
- Branches: criadas a partir de **`develop`** no formato `<tipo>/#<issue_id>-<breve-descricao>` (ex: `feat/#12-course-filters`)
- Pull Requests / Merge Requests sempre apontando para a branch **`develop`** com `Closes #<id>` na descrição.

---

*Última atualização: Agosto/2026*
