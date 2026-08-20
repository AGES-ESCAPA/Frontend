# Claude.md — escapa! Frontend

## Sobre o Projeto

**escapa!** é uma plataforma digital de **cursos e qualificação profissional em Turismo e Hospitalidade**.

- Acessada através de um link externo no website institucional da ESCAPA (o site institucional não faz parte deste repositório).
- **Página Inicial**: Apresenta a plataforma e o catálogo de cursos disponíveis para compra/inscrição.
- **Perfis de Usuário**: Alunos individuais e empresas/parceiros comerciais (B2B).
- **Aulas e Conteúdo**: Vídeos (Vimeo/YouTube), textos, imagens, controle de progresso e certificados digitais.
- **Painel Administrativo**: Gestão de cursos, módulos, aulas e usuários.
- **CI/CD**: **GitHub Actions** (`.github/workflows/ci.yml`) e GitLab CI (`.gitlab-ci.yml`)
- **Templates**: `.github/pull_request_template.md` e `.gitlab/merge_request_templates/Default.md`
- **Fora do escopo**: cursos ao vivo, fórum, integração com IA, multilíngue, pagamentos integrados.

---

## Arquitetura de Pastas e Responsabilidades

```
src/
├── assets/           # Arquivos estáticos (imagens, fontes, SVGs)
├── components/
│   ├── ui/           # Wrappers sobre primitivas Radix UI (Button, Dialog, etc.)
│   └── layout/       # Componentes estruturais (Sidebar, Header, Footer)
├── contexts/         # React Contexts globais (AuthContext, etc.)
├── hooks/            # Custom hooks reutilizáveis (useAuth, useCourseProgress, etc.)
├── pages/            # Uma pasta por rota principal (Home, Login, Dashboard, etc.)
├── routes/           # Configuração central do React Router (AppRouter.tsx)
├── services/         # Chamadas a APIs externas e backend (courseService, authService)
├── test/             # Setup global do Vitest (setup.ts)
├── types/            # Interfaces e tipos TypeScript compartilhados
├── utils/            # Funções puras e helpers reutilizáveis (formatCurrency, formatDuration)
└── index.css         # Design Tokens e variáveis globais
```

### Onde colocar o código:
- **Telas e estado visual**: `src/pages/` (cada página tem sua pasta com `.tsx`, `.module.css` e `.test.tsx`). **Nunca faz `fetch` direto**.
- **Requisições para o Backend**: `src/services/` (páginas chamam funções de serviço).
- **Lógica e estados compartilhados**: `src/hooks/`.
- **Componentes visuais reutilizáveis**: `src/components/ui/` (Radix UI) e `src/components/layout/`.

---

## Regras de Código e Estilo

### 1. 🎨 Design System — Variáveis CSS Obrigatórias (Style Guide Oficial)

**Toda cor, tamanho, espaçamento ou tipografia em arquivos `.css` DEVE usar uma variável CSS de `src/index.css`.**  
O **Stylelint** bloqueia commits com valores hardcoded.

```css
/* ✅ CORRETO */
.card {
  color: var(--color-text-primary);
  background-color: var(--color-surface-raised);
  padding: var(--space-4);
  border-radius: var(--radius-lg);
}

.title {
  font-family: var(--font-family-base);
  font-size: var(--text-h3);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.button {
  background-color: var(--color-primary-500);
  color: var(--color-white);
  font-size: var(--text-body-3);
  font-weight: var(--font-weight-semibold);
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-md);
}

/* ❌ BLOQUEADO pelo Stylelint */
.card { color: #f4f5f6; background-color: #0f0f1f; padding: 16px; border-radius: 8px; }
.title { font-size: 32px; font-weight: 700; }
.button { background-color: #2b6fe7; color: #ffffff; padding: 12px 24px; }
```

#### 🎨 Tokens de Cor:
- **Primária**: `--color-primary-100` a `900` (`500: #2b6fe7` base de ação, `400: #5290ff` hover)
- **Secundária**: `--color-secondary-100` a `900` (`500: #8d63cc` base secundária)
- **Neutros**: `--color-neutral-100` a `900`
- **Status**: `--color-success-100..500` (`400: #22a061`), `--color-info-100..500` (`300: #1adbff`), `--color-warning-100..500` (`300: #eead2b`), `--color-error-100..500` (`300: #e23645`)
- **Superfícies**: `--color-surface` (`#0c0c1a`), `--color-surface-raised` (`#0f0f1f`), `--color-surface-overlay`
- **Textos**: `--color-text-primary` (`#f4f5f6`), `--color-text-secondary` (`#c7ccd1`), `--color-text-muted` (`#848f9a`)

#### 🔤 Tokens de Tipografia (Fonte Inter):
- **Família**: `var(--font-family-base)` ou `var(--font-sans)`
- **Pesos**: `--font-weight-regular` (400), `--font-weight-medium` (500), `--font-weight-semibold` (600), `--font-weight-bold` (700)
- **Títulos (Headings — Sempre Bold / 700)**:
  - `--text-h1` (48px / 3rem), `--text-h2` (40px / 2.5rem), `--text-h3` (32px / 2rem), `--text-h4` (24px / 1.5rem), `--text-h5` (20px / 1.25rem), `--text-h6` (18px / 1.125rem)
- **Corpo (Body)**:
  - `--text-body-1` (18px / 1.125rem), `--text-body-2` (16px / 1rem - Base), `--text-body-3` (14px / 0.875rem), `--text-body-4` (12px / 0.75rem), `--text-body-5` (10px / 0.625rem)

#### 🎨 Ícones Oficiais (Lucide Icons):
- Use a biblioteca `lucide-react` para ícones do sistema (`import { Play, Award, User } from 'lucide-react'`).
- Padrão: grid 24x24px, traço 2px, cantos arredondados 2px (compatível com Figma).
- O Radix UI fornece a casca acessível (Dialog, Dropdown) e o Lucide fornece os ícones visuais.

#### 📱 Responsividade Obrigatória:
- **Mobile (`< 640px`)**: layout em coluna única, botões com toque acessível, **sem scroll horizontal**.
- **Tablet (`640px - 1023px`)**: grids adaptados de 2 colunas, sidebars recolhíveis.
- **Desktop (`>= 1024px`)**: layout completo com sidebar e grids expandidos.

---

### 2. Padrões de Código
- **Componentes**: Function components com named export (`export const MyComponent = () => ...`).
- **TypeScript**: Proibido uso de `any`. Use tipagens explícitas ou `unknown` com narrowing.
- **Imports**: Utilize sempre os aliases configurados (`@components/`, `@pages/`, `@services/`, `@hooks/`, `@utils/`, `@types/`, `@contexts/`).
- **Testes**: Todo componente e utilitário deve ter teste unitário correspondente (`.test.tsx` / `.test.ts`).

### 3. Commits e Branches
- **Commits**: `<tipo>(#<issue_id>): <descrição curta>` (ex: `feat(#12): add course catalog cards`)
- **Branches**: Criadas a partir de **`develop`** no formato `<tipo>/#<issue_id>-<descricao>` (ex: `feat/#12-course-catalog`)
- **Pull Requests**: Sempre direcionados para a branch **`develop`** com `Closes #<id>` na descrição para fechamento automático.

---

*Última atualização: Agosto/2026*
