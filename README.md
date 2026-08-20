# 🌴 escapa! — Plataforma de Cursos (Frontend)

Frontend da plataforma de **Educação Continuada da ESCAPA**, voltada para qualificação profissional em **Turismo e Hospitalidade**.

A plataforma é acessada a partir de um link no website institucional da ESCAPA (o site institucional existente é externo e não faz parte do escopo deste repositório).

---

## 📋 Sumário

- [Visão Geral e Contexto](#-visão-geral-e-contexto)
- [Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [Estrutura de Pastas e Onde Desenvolver](#-estrutura-de-pastas-e-onde-desenvolver)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação e Setup](#-instalação-e-setup)
- [Comandos Disponíveis (Scripts npm)](#-comandos-disponíveis-scripts-npm)
- [Fluxo de Validação de Tarefas (Evite falhas na CI)](#-fluxo-de-validação-de-tarefas-evite-falhas-na-ci)
- [Padrão de Commits](#-padrão-de-commits)
- [Estratégia de Branches & Pull Requests](#-estratégia-de-branches--pull-requests)
- [Regras do Design System (CSS)](#-regras-do-design-system-css)
- [Containerização com Docker](#-containerização-com-docker)

---

## 🎯 Visão Geral e Contexto

### O que é a plataforma?
Uma plataforma web responsiva dedicada à qualificação, aperfeiçoamento e treinamento de profissionais e empresas do setor de turismo e hospitalidade.

### Funcionalidades no Escopo:
- **Página Inicial da Plataforma**: Apresentação da plataforma e catálogo de cursos disponíveis para consulta e aquisição (conteúdos de hospitalidade, marketing, inovação e tendências do turismo).
- **Autenticação e Perfis**: Login dedicado para usuários individuais (profissionais/alunos) e clientes do tipo empresa (B2B/parceiros).
- **Consumo de Aulas**: Aulas compostas por conteúdos de texto, imagens e vídeos integrados via player (YouTube / Vimeo).
- **Acompanhamento**: Controle de progresso do aluno por aula e módulo.
- **Materiais e Certificados**: Download de materiais complementares e emissão de certificados digitais de conclusão.
- **Painel Administrativo**: Cadastro e gestão de cursos, módulos, aulas e controle de usuários.

### 🚫 Fora do Escopo:
- A landing page/site institucional principal da ESCAPA (já existente e externa a este projeto).
- Cursos com transmissão ao vivo.
- Fórum ou comunidade interna entre alunos.
- Trilhas de aprendizagem personalizadas por IA ou assistentes inteligentes de IA.
- Plataforma multilíngue.
- Gateway de pagamento direto dentro da aplicação.

---

## 📁 Estrutura de Pastas e Onde Desenvolver

Para manter o projeto organizado e de fácil manutenção por toda a equipe, cada camada tem uma responsabilidade bem definida:

```
src/
├── assets/           # Arquivos estáticos (SVGs, logos, imagens, ícones)
├── components/
│   ├── ui/           # Componentes atômicos e genéricos (Button, Modal, Input, Toast)
│   └── layout/       # Componentes estruturais de casca da tela (Sidebar, Header, Footer)
├── contexts/         # React Contexts para estados globais (ex: AuthContext)
├── hooks/            # Custom Hooks para lógica reutilizável e assíncrona
├── pages/            # Páginas da aplicação e sua orquestração de tela
├── routes/           # Configuração de rotas (AppRouter) e proteção (ProtectedRoute)
├── services/         # Funções de chamada HTTP para a API do backend
├── test/             # Configurações globais de teste (setup.ts)
├── types/            # Tipos e interfaces TypeScript compartilhados
├── utils/            # Funções auxiliares puras (formatadores, validadores, etc.)
├── index.css         # Design System e Variáveis CSS globais
└── main.tsx          # Ponto de entrada da aplicação React
```

### 🧭 Guia Prático: Onde colocar meu código?

#### 1. `src/pages/` — Telas da Aplicação
- **O que vai aqui:** Cada rota tem sua própria pasta (ex: `pages/Home/`, `pages/Login/`, `pages/CoursePlayer/`).
- **Conteúdo da pasta:**
  - `NomeDaPagina.tsx`: Componente visual da página, formulários, orquestração de estados locais e chamadas aos hooks/services.
  - `NomeDaPagina.module.css`: Estilos isolados daquela página (sempre usando variáveis de `index.css`).
  - `NomeDaPagina.test.tsx`: Testes unitários da interface da página.
- **Regra:** A página gerencia o estado da visualização (ex: "está carregando?", "mostrar modal?"), mas **não faz `fetch()` direto**. Ela chama funções da pasta `services/` ou hooks de `hooks/`.

#### 2. `src/services/` — Comunicação com o Backend (API)
- **O que vai aqui:** Arquivos como `courseService.ts`, `authService.ts`, `userService.ts`.
- **Regra:** Contém apenas funções assíncronas que realizam requisições HTTP (`fetch` / `axios`) para a API backend, tratando headers, tokens e serialização de dados.
- **Exemplo:** Se você precisa listar os cursos na tela de catálogo, crie `courseService.getCourses()` em `services/courseService.ts` e chame essa função dentro da sua página ou hook.

#### 3. `src/hooks/` — Lógica de Negócio e Estados Reutilizáveis
- **O que vai aqui:** Custom hooks como `useAuth.ts`, `useCourseProgress.ts`, `useDebounce.ts`.
- **Regra:** Se uma lógica de estado ou efeito colateral precisa ser reutilizada em mais de uma página (ou for complexa demais para ficar dentro do componente da página), extraia para um custom hook.

#### 4. `src/components/ui/` — Componentes Visuais Básicos (Baseados no Radix UI)
- **O que vai aqui:** Botões, Modais/Dialogs, Dropdowns, Tooltips, Toasts, Inputs de formulário.
- **Regra:** Devem ser componentes **agnósticos de regra de negócio**, focados em acessibilidade e reutilização visual através de props.

#### 5. `src/components/layout/` — Estrutura de Layout
- **O que vai aqui:** Componentes que formam o esqueleto da aplicação, como a `Sidebar` colapsável da área do aluno, `Navbar` e `Footer`.

#### 6. `src/contexts/` — Estado Global
- **O que vai aqui:** Contextos React que precisam ser acessados em qualquer parte da árvore de componentes, como o `AuthContext` (dados do usuário logado, tipo de conta: individual ou empresa, e token JWT).

#### 7. `src/types/` — Modelos de Dados e Tipagens TypeScript
- **O que vai aqui:** Interfaces de entidades compartilhadas, como `course.ts` (modelo de curso e aula), `user.ts` (modelo de usuário e empresa), `api.ts` (respostas padrão da API).

#### 8. `src/utils/` — Funções Puras e Formatadores
- **O que vai aqui:** Funções utilitárias sem efeitos colaterais e sem estado, como `formatCurrency` (formata R$), `formatDuration` (formata minutos/horas) e validadores de CPF/CNPJ.

---

## 🛠️ Tecnologias Utilizadas

- **Framework**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Roteamento**: [React Router v6](https://reactrouter.com/)
- **Componentes Base**: [Radix UI](https://www.radix-ui.com/) (primitivas acessíveis sem estilo fixo)
- **Ícones Oficiais**: [Lucide React](https://lucide.dev/) (padrão de traço 24x24px, 2px stroke, consistente com o Figma)
- **Estilização**: CSS Modules com Design System em Variáveis CSS
- **Testes Unitários**: [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/)
- **Qualidade de Código**: [ESLint](https://eslint.org/), [Prettier](https://prettier.io/) e [Stylelint](https://stylelint.io/)
- **Git Hooks**: [Husky](https://typicode.github.io/husky/) + [lint-staged](https://github.com/lint-staged/lint-staged)
- **CI/CD**: [GitHub Actions](https://github.com/features/actions) (Pipeline paralela: `lint`, `stylelint`, `format`, `test`, `build`) e GitLab CI (espelho)
- **Containerização**: Docker (Multi-stage build Node 20 → Nginx Alpine)

---

## ⚙️ Pré-requisitos

- **Node.js** na versão **20 LTS** ou superior ([Download Node.js](https://nodejs.org/))
- **npm** na versão **10** ou superior
- **Git** ([Download Git](https://git-scm.com/))
- **Docker** *(opcional, para testar a imagem de produção)*

---

## 🚀 Instalação e Setup

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/AGES-ESCAPA/Frontend.git
   cd Frontend
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente:**
   ```bash
   cp .env.example .env.local
   ```

4. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   Acesse a aplicação em [http://localhost:3000](http://localhost:3000).

---

## 💻 Comandos Disponíveis (Scripts npm)

| Comando | O que faz? | Quando usar? |
|---|---|---|
| `npm run dev` | Inicia o servidor local com Hot Reload na porta `3000`. | Durante todo o desenvolvimento local. |
| `npm run test` | Executa todos os testes unitários uma vez com o Vitest. | Antes de commitar ou abrir Pull Request. |
| `npm run test:watch` | Executa os testes em modo interativo (reexecuta ao salvar). | Enquanto desenvolve ou cria testes. |
| `npm run test:coverage` | Gera relatório de cobertura de código em `coverage/`. | Para verificar a cobertura de testes do código criado. |
| `npm run lint` | Valida regras de TypeScript e React com ESLint. | Para identificar erros de tipos e boas práticas. |
| `npm run lint:fix` | Corrige automaticamente erros identificados pelo ESLint. | Quando houver problemas simples de formatação/imports. |
| `npm run stylelint` | Valida se o CSS segue o Design System e **bloqueia cores hex brutas**. | Antes de commitar alterações em arquivos `.css`. |
| `npm run stylelint:fix` | Corrige problemas automáticos de formatação de CSS. | Para ajustar detalhes de CSS rapidamente. |
| `npm run format:check` | Verifica se os arquivos seguem o padrão do Prettier. | Para conferir formatação sem alterar os arquivos. |
| `npm run format` | Formata todo o código do projeto com o Prettier. | Para padronizar arquivos antes do commit. |
| `npm run build` | Compila o TypeScript (`tsc -b`) e gera a build de produção em `dist/`. | Para checar se o código compila sem erros para deploy. |
| `npm run preview` | Sobe um servidor local com os arquivos compilados de `dist/`. | Para inspecionar o comportamento real da build final. |

---

## ✅ Fluxo de Validação de Tarefas (Evite falhas na CI)

Antes de abrir um **Pull Request** ou dar **push**, execute o checklist no seu terminal. Se todos passarem, a pipeline do GitHub Actions passará sem problemas:

```bash
# 1. Validação de TypeScript e React
npm run lint

# 2. Validação de regras de CSS (Design System)
npm run stylelint

# 3. Validação de formatação
npm run format:check

# 4. Execução dos testes unitários
npm run test

# 5. Validação da compilação de produção
npm run build
```

> 💡 **Comando único para rodar todas as validações:**
> ```bash
> npm run lint && npm run stylelint && npm run format:check && npm run test && npm run build
> ```

---

## 📝 Padrão de Commits

Utilizamos o padrão **Conventional Commits** referenciando a **Issue do GitHub**:

### Formato:
```
<tipo>(#<issue_id>): <descrição clara>
```

### Tipos:
- `feat`: Nova funcionalidade (ex: nova tela, novo componente, nova integração).
- `fix`: Correção de bug.
- `docs`: Mudanças na documentação (`README.md`, etc.).
- `style`: Ajustes puramente visuais ou formatações.
- `refactor`: Refatoração sem alteração de comportamento.
- `test`: Adição ou ajuste de testes unitários.
- `chore`: Manutenção de dependências, builds ou configurações.

### Exemplos:
- `feat(#12): add course catalog cards and filters`
- `feat(#15): implement company login tab`
- `fix(#23): fix video player progress update callback`
- `test(#8): add unit tests for formatCurrency helper`

---

## 🌿 Estratégia de Branches & Pull Requests

Adotamos o fluxo com branch de integração **`develop`** e branch de produção **`main`**:

```
 main (Produção estável)
   ↑ (Pull Request revisado)
 develop (Ambiente de desenvolvimento integrado)
   ↑ (Pull Request com validação do GitHub Actions)
 ├── feat/#12-catalogo-cursos
 ├── feat/#15-login-empresa
 └── fix/#23-progresso-aula
```

### Nomenclatura das branches:
```
<tipo>/#<issue_id>-<breve-descricao>
```

**Exemplos:**
- `feat/#12-catalogo-cursos`
- `feat/#15-login-empresa`
- `fix/#23-progresso-aula`

### Passo a passo para desenvolver uma tarefa:
```bash
# 1. Atualize a branch develop local
git checkout develop
git pull origin develop

# 2. Crie sua branch a partir da develop referenciando a issue
git checkout -b feat/#12-catalogo-cursos

# 3. Desenvolva, rode os testes e faça os commits
git add .
git commit -m "feat(#12): create course catalog layout and cards"

# 4. Envie sua branch para o GitHub
git push -u origin feat/#12-catalogo-cursos

# 5. Abra o Pull Request no GitHub apontando como destino a branch DEVELOP
#    (No PR, coloque "Closes #12" para fechar a issue automaticamente após o merge!)
```

---

## 🎨 Regras do Design System (Style Guide Oficial)

> ⚠️ **Atenção:** **NUNCA** utilize valores de cores hexadecimais (`#2b6fe7`, `#ffffff`), tamanhos fixos ou espaçamentos arbitrários diretamente nos arquivos `.css` ou `.module.css`.

Utilize **SEMPRE** as variáveis CSS declaradas em [`src/index.css`](src/index.css). O **Stylelint** bloqueará o commit caso cores hexadecimais sejam inseridas diretamente.

```css
/* ✅ CORRETO — utiliza variáveis do style guide */
.button {
  color: var(--color-white);
  background-color: var(--color-primary-500);
  font-size: var(--text-sm);
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-md);
  transition: background-color var(--transition-fast);
}

.button:hover {
  background-color: var(--color-primary-400);
}

/* ❌ PROIBIDO — bloqueado pelo Stylelint */
.button {
  color: #ffffff;
  background-color: #2b6fe7;
  font-size: 14px;
  padding: 12px 24px;
}
```

### 🎨 Tabela de Tokens do Style Guide Oficial

| Categoria | Variáveis CSS Disponíveis | Valores Hex / Descrição |
|---|---|---|
| **Primária** | `--color-primary-100` até `--color-primary-900` | `100: #e5efff`, `200: #bdd4ff`, `300: #8ab4ff`, `400: #5290ff`, **`500: #2b6fe7` (base)**, `600: #003aa3`, `700: #1c1c38`, `800: #0f0f1f`, `900: #0c0c1a` |
| **Secundária** | `--color-secondary-100` até `--color-secondary-900` | `100: #f1ecf9`, `200: #dacdef`, `300: #bea7e2`, `400: #9f7dd4`, **`500: #8d63cc` (base)**, `600: #6739ad`, `700: #49287b`, `800: #2f1a4f`, `900: #170d26` |
| **Neutros** | `--color-neutral-100` até `--color-neutral-900` | `100: #f4f5f6`, `200: #e3e6e8`, `300: #c7ccd1`, `400: #a5adb6`, `500: #848f9a`, `600: #65707b`, `700: #49525a`, `800: #2e3338`, `900: #17191c` |
| **Sucesso** | `--color-success-100` até `--color-success-500` | `100: #d5f6e6`, `200: #96e9bf`, `300: #42d78c`, `400: #22a061`, `500: #145d38` |
| **Info** | `--color-info-100` até `--color-info-500` | `100: #ccf7ff`, `200: #5be5ff`, `300: #1adbff`, `400: #00a3c2`, `500: #005e70` |
| **Atenção** | `--color-warning-100` até `--color-warning-500` | `100: #f8edd0`, `200: #f5d189`, `300: #eead2b`, `400: #b37c0f`, `500: #684808` |
| **Erro** | `--color-error-100` até `--color-error-500` | `100: #f9d2d6`, `200: #ef8f97`, `300: #e23645`, `400: #aa1824`, `500: #620e15` |
| **Base** | `--color-white`, `--color-black` | `#ffffff`, `#000000` |

### ⚡ Aliases Semânticos de Uso Rápido
- **Superfícies**: `--color-surface` (`#0c0c1a`), `--color-surface-raised` (`#0f0f1f`), `--color-surface-overlay`
- **Textos**: `--color-text-primary` (`#f4f5f6`), `--color-text-secondary` (`#c7ccd1`), `--color-text-muted` (`#848f9a`)
- **Bordas**: `--color-border` (`#2e3338`), `--color-border-focus` (`#2b6fe7`)
- **Ações**: `--color-primary` (`--color-primary-500`), `--color-primary-hover` (`--color-primary-400`), `--color-secondary` (`--color-secondary-500`)

---

## 🔤 Tipografia Oficial (Fonte: Inter)

A fonte padrão da aplicação é a **Inter** (`--font-family-base`). Não utilize fontes arbitrárias ou tamanhos hardcoded.

### 1. Títulos (Headings — Peso Bold 700)
| Nível | Token CSS | Tamanho | Peso Padrão |
|---|---|---|---|
| **Heading 1** | `--text-h1` | `3rem` (48px) | Bold (700) |
| **Heading 2** | `--text-h2` | `2.5rem` (40px) | Bold (700) |
| **Heading 3** | `--text-h3` | `2rem` (32px) | Bold (700) |
| **Heading 4** | `--text-h4` | `1.5rem` (24px) | Bold (700) |
| **Heading 5** | `--text-h5` | `1.25rem` (20px) | Bold (700) |
| **Heading 6** | `--text-h6` | `1.125rem` (18px) | Bold (700) |

### 2. Textos de Corpo (Body)
Cada tamanho de corpo pode ser combinado com os pesos: **Regular (400)**, **Medium (500)**, **Semibold (600)** ou **Bold (700)**.

| Nível | Token CSS | Tamanho |
|---|---|---|
| **Body 1** | `--text-body-1` | `1.125rem` (18px) |
| **Body 2** | `--text-body-2` (Base) | `1rem` (16px) |
| **Body 3** | `--text-body-3` | `0.875rem` (14px) |
| **Body 4** | `--text-body-4` | `0.75rem` (12px) |
| **Body 5 / XSmall** | `--text-body-5` | `0.625rem` (10px) |

### 3. Pesos de Fonte
- `--font-weight-regular`: `400`
- `--font-weight-medium`: `500`
- `--font-weight-semibold`: `600`
- `--font-weight-bold`: `700`

---

## 📱 Responsividade Obrigatória (Mobile, Tablet, Desktop e Web)

A aplicação deve ser **100% responsiva** e se adaptar perfeitamente a qualquer resolução de tela (smartphones, tablets, notebooks e monitores ultrawide).

### 📐 Breakpoints Padrão

| Dispositivo / Viewport | Breakpoint Token | Largura | Comportamento Esperado |
|---|---|---|---|
| **Mobile (Celulares)** | `--breakpoint-mobile` | `< 640px` | Layout em coluna única, menus colapsados (hambúrguer/drawer), botões e toques acessíveis (`min-height: 44px`). |
| **Tablet** | `--breakpoint-tablet` | `640px` a `1023px` | Grids de 2 colunas, sidebars compactas/recolhíveis, tipografia balanceada. |
| **Desktop / Laptop** | `--breakpoint-laptop` / `--breakpoint-desktop` | `1024px` a `1280px` | Layout completo com sidebar lateral fixa/expansível, grids de 3 a 4 colunas. |
| **Wide / Telas Grandes** | `--breakpoint-wide` | `> 1280px` | Conteúdo centralizado com largura máxima delimitada por `--container-7xl` (`1280px`). |

### 💡 Boas Práticas de Responsividade:
1. **Mobile-First ou Desktop-First consistente**: Use `min-width` ou `max-width` seguindo os breakpoints do design system.
2. **Imagens e Vídeos**: Sempre com `max-width: 100%` e `height: auto` para evitar quebras horizontais de página.
3. **Nenhum scroll horizontal indesejado**: Teste sempre os componentes em resoluções de `360px` (mobile) a `1920px` (desktop).

---

## 🎨 Ícones Oficiais (Lucide Icons)

A biblioteca oficial de ícones adotada no projeto é a **[Lucide React](https://lucide.dev/)** (`lucide-react`), que é a mesma utilizada pelo time de design no **Figma**.

### 📐 Padrões de Design dos Ícones:
- **Grid base**: `24x24px`
- **Espessura de traço (stroke)**: `2px`
- **Cantos arredondados (corner radius)**: `2px`
- **Alinhamento**: Centralizado

### 🚀 Como utilizar nos componentes:
```tsx
import { Play, CheckCircle, BookOpen, Lock, User } from 'lucide-react';

export const CourseLessonItem = () => (
  <div>
    <BookOpen size={20} color="var(--color-primary-500)" />
    <span>Introdução à Hospitalidade</span>
  </div>
);
```

### 🤝 Radix UI vs Lucide Icons:
- **Radix UI**: Fornece os componentes funcionais acessíveis (modais, menus, abas, accordions).
- **Lucide React**: Fornece os ícones gráficos que são colocados dentro dos botões, menus e cards.

---

## 🐳 Containerização com Docker

Para testar localmente como a aplicação roda no container de produção Nginx (que será publicado no cluster **k3s**):

```bash
docker compose up --build
```
Acesse em: [http://localhost:8080](http://localhost:8080) | Healthcheck: [http://localhost:8080/health](http://localhost:8080/health)
