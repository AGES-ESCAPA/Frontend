# AGENTS.md — escapa! Frontend

> Este arquivo é lido por agentes de IA (Copilot, Cursor, Gemini, Claude, etc.) para entender o contexto do projeto e seguir as convenções do time. **Leia-o completamente antes de sugerir ou gerar código.**

## Contexto do Projeto

**escapa!** é uma plataforma digital de **turismo de luxo** com dois produtos integrados:

1. **Landing Page Institucional**: Voltada ao cliente final (B2C). Apresenta destinos, diferenciais da marca e captação de leads.

2. **Plataforma de Cursos (SaaS)**:
   - **B2B**: Treinamento de agentes de viagem e parceiros comerciais.
   - **B2C**: Cursos abertos com conteúdos de IA, inovação, hospitalidade e marketing.
   - Conteúdo em texto, imagens e vídeo (Vimeo preferencial / YouTube para previews).
   - Controle de progresso, download de materiais, emissão de certificados.
   - Administração: cadastro de cursos e controle de usuários.

**Fora do escopo atual**: cursos ao vivo, fórum, trilhas por IA, multilíngue, pagamentos.

## Infraestrutura

A aplicação é **containerizada** e será publicada em um cluster **k3s** gerenciado por **Terraform**:
- Build: `Dockerfile` multi-stage (Node 20 → nginx alpine)
- Orquestração local: `docker-compose.yml`
- CI/CD: GitLab CI (`.gitlab-ci.yml`)

## Regras para Agentes de IA

### ⚠️ Regras Invioláveis

1. **Nunca use `any` em TypeScript.** Use `unknown` e faça narrowing.
2. **Nunca gere default exports.** Use sempre named exports.
3. **Nunca manipule o DOM diretamente.** Use refs do React (`useRef`).
4. **Nunca coloque lógica de negócio em componentes.** Extraia para `src/hooks/` ou `src/services/`.
5. **Nunca importe com caminhos relativos longos** (`../../../`). Use os aliases (`@components/`, `@hooks/`, etc.).
6. **NUNCA escreva cores, tamanhos ou valores de espaçamento hardcoded em CSS.** Veja regra detalhada abaixo.

---

### 🎨 Regra de Design System — Variáveis CSS Obrigatórias

**Todo valor de cor, tamanho, espaçamento ou tipografia em arquivos `.css` DEVE usar uma variável CSS definida em `src/index.css`.**

Esta regra é validada automaticamente pelo **Stylelint** no pre-commit e na CI (`npm run stylelint`). Commits com cores hardcoded serão **bloqueados**.

```css
/* ✅ CORRETO — usa variáveis do design system */
.button {
  color: var(--color-accent);
  font-size: var(--text-sm);
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-md);
  transition: background-color var(--transition-fast);
}

/* ❌ PROIBIDO — valores hardcoded serão bloqueados pelo Stylelint */
.button {
  color: #c9a84c;
  font-size: 0.875rem;
  padding: 12px 24px;
  border-radius: 6px;
  transition: background-color 150ms ease;
}
```

#### Tokens disponíveis em `src/index.css`:

| Categoria | Exemplos de variáveis |
|---|---|
| **Cores de marca** | `--color-accent`, `--color-accent-light`, `--color-info`, `--color-primary` |
| **Cores de sistema** | `--color-gray-50` … `--color-gray-900`, `--color-blue-500`, `--color-amber-300` |
| **Superfícies** | `--color-surface`, `--color-surface-raised`, `--color-border` |
| **Texto** | `--color-text-primary`, `--color-text-secondary`, `--color-text-muted` |
| **Status** | `--color-success`, `--color-warning`, `--color-error` |
| **Tipografia** | `--text-xs` … `--text-6xl`, `--font-weight-medium` … `--font-weight-bold` |
| **Espaçamento** | `--space-1` … `--space-16`, `--spacing` |
| **Containers** | `--container-xs`, `--container-lg`, `--container-3xl` … `--container-7xl` |
| **Bordas** | `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`, `--radius-2xl`, `--radius-full` |
| **Transições** | `--transition-fast`, `--transition-base`, `--transition-slow`, `--ease-in-out` |
| **Sombras/Blur** | `--shadow-sm`, `--shadow-md`, `--shadow-glow`, `--blur-sm`, `--blur-md` |
| **Fontes** | `--font-sans`, `--font-mono`, `--font-serif` |

---

### ✅ Padrões Obrigatórios de Código

#### Componentes

```tsx
import type { FC } from 'react';
import styles from './CourseCard.module.css'; // CSS Module — sem valores hardcoded

interface CourseCardProps {
  title: string;
  thumbnailUrl: string;
  duration: number; // em segundos
  onEnroll: () => void;
}

export const CourseCard: FC<CourseCardProps> = ({ title, thumbnailUrl, duration, onEnroll }) => {
  return (
    <article className={styles.card}>
      <img src={thumbnailUrl} alt={title} className={styles.thumbnail} />
      <h2 className={styles.title}>{title}</h2>
      <button onClick={onEnroll} className={styles.btn} aria-label={`Matricular em ${title}`}>
        Matricular
      </button>
    </article>
  );
};
```

#### Hooks Customizados

```ts
// src/hooks/useCourseProgress.ts
import { useState, useEffect } from 'react';
import type { CourseProgress } from '@types/course';

export const useCourseProgress = (courseId: string): CourseProgress => {
  const [progress, setProgress] = useState<CourseProgress>({ completed: 0, total: 0 });

  useEffect(() => {
    // lógica de fetch aqui, não no componente
  }, [courseId]);

  return progress;
};
```

#### Serviços (API calls)

```ts
// src/services/courseService.ts
import type { Course } from '@types/course';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export const getCourseById = async (id: string): Promise<Course> => {
  const response = await fetch(`${API_BASE}/courses/${id}`);
  if (!response.ok) throw new Error(`Failed to fetch course ${id}`);
  return response.json() as Promise<Course>;
};
```

#### Testes

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CourseCard } from './CourseCard';

describe('CourseCard', () => {
  it('should render the course title', () => {
    render(<CourseCard title="Turismo na Toscana" thumbnailUrl="" duration={3600} onEnroll={vi.fn()} />);
    expect(screen.getByText('Turismo na Toscana')).toBeInTheDocument();
  });

  it('should call onEnroll when the button is clicked', async () => {
    const onEnroll = vi.fn();
    render(<CourseCard title="Test" thumbnailUrl="" duration={0} onEnroll={onEnroll} />);
    await userEvent.click(screen.getByRole('button', { name: /matricular em test/i }));
    expect(onEnroll).toHaveBeenCalledOnce();
  });
});
```

### Roteamento

- O arquivo central de rotas é `src/routes/AppRouter.tsx`.
- Todas as páginas devem ser carregadas com **lazy loading**:
  ```tsx
  const Dashboard = lazy(() => import('@pages/Dashboard/Dashboard').then(m => ({ default: m.Dashboard })));
  ```
- Rotas que exigem autenticação devem ser envolvidas por `<ProtectedRoute>` (a criar em `src/routes/`).

### Variáveis de Ambiente

- Prefixo obrigatório: `VITE_` para exposição ao cliente.
- Nunca hardcode URLs, chaves ou segredos. Use `import.meta.env.VITE_*`.
- Documente no `.env.example`.

### Acessibilidade (a11y)

- Use `aria-label` em elementos interativos sem texto visível suficiente.
- Use primitivas do **Radix UI** — já vêm com ARIA integrado.
- Prefira `<button>` e `<a>` semânticos. Evite `<div>` clicáveis.

### Commits

Formato: `<tipo>(<escopo>): <descrição curta em inglês>`

Tipos: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`

Exemplo: `feat(courses): add video progress tracking hook`

---

## Arquitetura de Pastas

```
src/
├── assets/           → arquivos estáticos (imagens, fontes, SVGs)
├── components/
│   ├── ui/           → wrappers sobre Radix UI (Button, Dialog, Toast…)
│   └── layout/       → componentes estruturais (Sidebar, Header, Footer)
├── contexts/         → React Contexts globais
├── hooks/            → custom hooks reutilizáveis
├── pages/            → uma pasta por rota (NomeDaPagina.tsx + .module.css + .test.tsx)
├── routes/           → AppRouter.tsx + ProtectedRoute.tsx
├── services/         → integração com APIs externas
├── test/             → setup.ts do Vitest
├── types/            → tipos e interfaces TypeScript globais
└── utils/            → helpers e funções puras
```

---

*Última atualização: Agosto/2026*
