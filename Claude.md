# Claude.md — Escapa! Frontend

## Sobre o Projeto

**Escapa!** é uma plataforma digital de **cursos e qualificação profissional em Turismo e Hospitalidade**.

- Acessada através de um link externo no website institucional da ESCAPA (o site institucional não faz parte deste repositório).
- **Página Inicial**: Apresenta a plataforma e o catálogo de cursos disponíveis para compra/inscrição.
- **Perfis de Usuário**: Alunos individuais e empresas/parceiros comerciais (B2B).
- **Aulas e Conteúdo**: Vídeos (Vimeo/YouTube), textos, imagens, controle de progresso e certificados digitais.
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
- **Telas e estado visual**: `src/pages/` (cada página tem sua pasta com `.tsx`, `.module.css` e `.test.tsx`).
- **Requisições para o Backend**: `src/services/` (páginas nunca fazem `fetch` direto, chamam o `service`).
- **Lógica e estados compartilhados**: `src/hooks/`.
- **Componentes visuais reutilizáveis**: `src/components/ui/` (Radix UI).

---

## Regras de Código e Estilo

### 1. 🎨 Design System — Variáveis CSS Obrigatórias (VALIDADO NO COMMIT)

**Toda cor, tamanho e espaçamento em arquivos `.css` DEVE usar uma variável CSS de `src/index.css`.**  
O **Stylelint** bloqueia commits com cores hexadecimais brutas.

```css
/* ✅ CORRETO */
.card { color: var(--color-primary); background-color: var(--color-accent); padding: var(--space-4); border-radius: var(--radius-lg); }

/* ❌ BLOQUEADO pelo Stylelint */
.card { color: #1a1a2e; background-color: #c9a84c; padding: 16px; border-radius: 8px; }
```

### 2. Padrões de Código
- **Componentes**: Function components com named export (`export const MyComponent = () => ...`).
- **TypeScript**: Proibido uso de `any`. Use tipagens explícitas ou `unknown` com narrowing.
- **Imports**: Utilize sempre os aliases configurados (`@components/`, `@pages/`, `@services/`, `@hooks/`, `@utils/`, `@types/`, `@contexts/`).
- **Testes**: Todo componente e utilitário deve ter teste unitário correspondente (`.test.tsx` / `.test.ts`).

### 3. Commits e Branches
- **Commits**: `<tipo>(<id_clickup>): <descrição curta>` (ex: `feat(86a1b2c): add course catalog cards`)
- **Branches**: Criadas a partir de **`develop`** no formato `<tipo>/<id_clickup>-<descricao>`
- **Merge Requests**: Sempre direcionados para a branch **`develop`**.

---

*Última atualização: Agosto/2026*
