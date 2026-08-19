# AGENTS.md — Escapa! Frontend

> Este arquivo é lido por agentes de IA (Copilot, Cursor, Gemini, Claude, etc.) para entender o contexto do projeto e seguir as convenções do time. **Leia-o completamente antes de sugerir ou gerar código.**

## Contexto do Projeto

**Escapa!** é uma plataforma digital de **cursos e qualificação profissional em Turismo e Hospitalidade**.

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
├── utils/            → Helpers e funções puras sem estado (formatCurrency, formatDuration...)
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
6. **NUNCA escreva cores, tamanhos ou valores de espaçamento hardcoded em CSS.**

---

### 🎨 Regra de Design System — Variáveis CSS Obrigatórias

**Todo valor de cor, tamanho, espaçamento ou tipografia em arquivos `.css` DEVE usar uma variável CSS definida em `src/index.css`.**  
Esta regra é validada automaticamente pelo **Stylelint** (`npm run stylelint`).

```css
/* ✅ CORRETO — usa variáveis do design system */
.button {
  color: var(--color-primary);
  background-color: var(--color-accent);
  font-size: var(--text-sm);
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-md);
  transition: background-color var(--transition-fast);
}

/* ❌ PROIBIDO — valores hardcoded serão bloqueados pelo Stylelint */
.button {
  color: #1a1a2e;
  background-color: #c9a84c;
  font-size: 0.875rem;
  padding: 12px 24px;
}
```

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

- Formato de Commit: `<tipo>(<id_clickup>): <descrição curta>` (ex: `feat(86a1b2c): add course filters`)
- Branches: criadas a partir de **`develop`** no formato `<tipo>/<id_clickup>-<breve-descricao>`
- Merge Requests sempre apontando para a branch **`develop`**.

---

*Última atualização: Agosto/2026*
