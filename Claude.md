# escapa! — Frontend

## Sobre o Projeto

**escapa!** é uma plataforma digital de **turismo de luxo** que combina:

- **Landing page institucional** — apresenta destinos, pacotes e a proposta de valor da marca para clientes finais.
- **SaaS de cursos (B2B/B2C)** — plataforma estilo Udemy voltada para treinamentos de agentes de viagem (B2B) e cursos abertos ao público (B2C). Inclui suporte a players de vídeo via **Vimeo** e **YouTube**.
- **Integração com IA** — módulos de recomendação personalizada de destinos e conteúdos, e assistente conversacional para suporte ao aluno.

## Stack Técnica

| Camada | Tecnologia |
|---|---|
| Framework | React 18 + Vite + TypeScript |
| Roteamento | React Router Dom v6 |
| Componentes | Radix UI (primitivas acessíveis) |
| Testes | Vitest + React Testing Library |
| Lint | ESLint + Prettier |
| Pre-commit | Husky + lint-staged |
| CI/CD | GitLab CI (`quality` stage: lint, format, test) |

## Estrutura de Diretórios

```
src/
├── assets/           # Imagens, fontes, ícones e SVGs estáticos
├── components/
│   ├── ui/           # Wrappers sobre primitivas Radix UI (Button, Dialog, etc.)
│   └── layout/       # Componentes estruturais (Sidebar, Header, Footer)
├── contexts/         # React Contexts (AuthContext, ThemeContext, etc.)
├── hooks/            # Custom hooks reutilizáveis (useAuth, useMediaQuery, etc.)
├── pages/            # Uma pasta por rota principal (Home, Login, Dashboard, etc.)
├── routes/           # Configuração central do React Router
├── services/         # Chamadas a APIs externas (REST, Vimeo, IA, etc.)
├── test/             # Setup global do Vitest (setup.ts)
├── types/            # Interfaces e tipos TypeScript compartilhados
└── utils/            # Funções puras e helpers reutilizáveis
```

## Infraestrutura

A aplicação é **containerizada** e projetada para rodar em **k3s** (Kubernetes leve) gerenciado por **Terraform**:

| Artefato | Propósito |
|---|---|
| `Dockerfile` | Build multi-stage: Node 20 Alpine → nginx Alpine |
| `nginx/nginx.conf` | SPA routing + cache de assets + `/health` endpoint |
| `docker-compose.yml` | Teste local da imagem de produção |
| `.gitlab-ci.yml` | Pipeline de qualidade (lint, stylelint, format, test) |

## Regras de Código e Estilo

### 1. 🎨 Design System — Variáveis CSS Obrigatórias (VALIDADO NO COMMIT)

**Toda cor, tamanho e espaçamento em arquivos `.css` DEVE usar uma variável CSS de `src/index.css`.**  
O **Stylelint** bloqueia commits com cores hexadecimais brutas.

```css
/* ✅ CORRETO */
.card { color: var(--color-accent); padding: var(--space-4); border-radius: var(--radius-lg); }

/* ❌ BLOQUEADO pelo Stylelint */
.card { color: #c9a84c; padding: 16px; border-radius: 8px; }
```

**Tokens disponíveis** (ver `src/index.css` para lista completa):
- Cores de marca: `--color-accent`, `--color-info`, `--color-primary`, `--color-secondary`
- Grays: `--color-gray-50` até `--color-gray-900`
- Blues: `--color-blue-50`, `--color-blue-500`, `--color-blue-600`, `--color-blue-700`
- Status: `--color-success`, `--color-warning`, `--color-error`
- Texto: `--color-text-primary`, `--color-text-secondary`, `--color-text-muted`
- Tipografia: `--text-xs` até `--text-6xl` (com `--text-*--line-height`)
- Pesos: `--font-weight-medium` / `--font-weight-semibold` / `--font-weight-bold`
- Espaço: `--space-1` até `--space-16` (base `--spacing: 0.25rem`)
- Containers: `--container-xs` até `--container-7xl`
- Bordas: `--radius-sm` até `--radius-full`
- Transições: `--transition-fast`, `--transition-base`, `--transition-slow`

### 2. Nomenclatura

- **Componentes**: PascalCase (`CourseCard.tsx`, `SidebarNav.tsx`)
- **Hooks customizados**: camelCase com prefixo `use` (`useAuth.ts`, `useCourseProgress.ts`)
- **Funções utilitárias e serviços**: camelCase (`formatCurrency.ts`, `videoService.ts`)
- **Constantes**: SCREAMING_SNAKE_CASE (`MAX_RETRY_ATTEMPTS`, `API_BASE_URL`)
- **Interfaces TypeScript**: PascalCase com prefixo `I` apenas quando necessário para evitar conflito de nomes

### 2. Componentes

- Prefira **function components** com **arrow functions**.
- Cada componente deve ter seu próprio arquivo. Evite múltiplos componentes no mesmo arquivo.
- Exporte componentes como **named export** (não default) para facilitar o autocomplete:
  ```tsx
  // ✅ Correto
  export const CourseCard = () => { ... };

  // ❌ Evitar
  export default function CourseCard() { ... }
  ```
- Defina os tipos das props com `interface` acima do componente no mesmo arquivo.

### 3. Imports

- Use os **path aliases** configurados (`@components/`, `@pages/`, etc.) ao invés de imports relativos longos (`../../../`).
- Separe os imports em grupos (libs externas → internos) com uma linha em branco entre eles. O Prettier cuidará da formatação, mas a ordem é sua responsabilidade.
- Use `import type` para importar apenas tipos TypeScript:
  ```ts
  import type { Course } from '@types/course';
  ```

### 4. TypeScript

- **Evite `any`** — se necessário, use `unknown` e faça type narrowing.
- Prefira `interface` para contratos de objetos e `type` para unions/intersections.
- Sempre tipar os retornos de funções de serviço/hook quando não forem triviais.

### 5. Gerenciamento de Estado

- **Estado local simples**: `useState`
- **Lógica complexa no mesmo componente**: `useReducer`
- **Estado compartilhado entre componentes**: React Context (`src/contexts/`)
- Evite prop drilling além de 2 níveis. Use Context ou extraia o estado.

### 6. Testes

- Coloque os arquivos de teste ao lado do componente: `Button.tsx` → `Button.test.tsx`
- Siga a filosofia do Testing Library: **teste comportamentos, não implementações**.
- Use `describe` para agrupar, `it` para casos individuais.
- Todo componente de UI deve ter ao menos um teste de renderização básica.

### 7. Commits

- Siga o padrão **Conventional Commits**: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`.
- Mensagens em **inglês**.
- Exemplo: `feat(courses): add video progress tracking hook`

### 8. Roteamento

- Todas as rotas são centralizadas em `src/routes/AppRouter.tsx`.
- Use **lazy loading** (`React.lazy + Suspense`) para páginas, reduzindo o bundle inicial.
- Rotas protegidas devem usar o componente `ProtectedRoute` (a ser criado em `src/routes/`).

---

*Última atualização: Agosto/2026*
