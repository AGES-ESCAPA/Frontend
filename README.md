# Escapa! — Plataforma de Cursos (Frontend)

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
- [Estratégia de Branches](#-estratégia-de-branches)
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
- **Componentes Base**: [Radix UI](https://www.radix-ui.com/) (primitivas acessíveis)
- **Estilização**: CSS Modules com Design System em Variáveis CSS
- **Testes Unitários**: [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/)
- **Qualidade de Código**: [ESLint](https://eslint.org/), [Prettier](https://prettier.io/) e [Stylelint](https://stylelint.io/)
- **Git Hooks**: [Husky](https://typicode.github.io/husky/) + [lint-staged](https://github.com/lint-staged/lint-staged)
- **CI/CD**: GitLab CI (Pipeline paralela: `lint`, `stylelint`, `format`, `test`)
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
   git clone https://tools.ages.pucrs.br/2026-2/2jk-4jk/escapa/frontend.git
   cd frontend
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
| `npm run test` | Executa todos os testes unitários uma vez com o Vitest. | Antes de commitar ou abrir Merge Request. |
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

Antes de abrir um **Merge Request** ou dar **push**, execute o checklist no seu terminal. Se todos passarem, a pipeline da CI passará sem problemas:

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

Utilizamos o padrão **Conventional Commits** com o **ID da tarefa no ClickUp**:

### Formato:
```
<tipo>(<id_clickup>): <descrição clara>
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
- `feat(86a1b2c): add course catalog cards and filters`
- `feat(86a1b2d): implement company login tab`
- `fix(86a1b2e): fix video player progress update callback`
- `test(86a1b2f): add unit tests for formatCurrency helper`

---

## 🌿 Estratégia de Branches

Adotamos o fluxo com branch de integração **`develop`** e branch de produção **`main`**:

```
 main (Produção estável)
   ↑ (Merge Request revisado)
 develop (Ambiente de desenvolvimento integrado)
   ↑ (Merge Request com validação da CI)
 ├── feat/86a1b2c-catalogo-cursos
 ├── feat/86a1b2d-login-empresa
 └── fix/86a1b2e-progresso-aula
```

### Nomenclatura das branches:
```
<tipo>/<id_clickup>-<breve-descricao>
```

### Passo a passo para desenvolver uma tarefa:
```bash
# 1. Atualize a branch develop local
git checkout develop
git pull origin develop

# 2. Crie sua branch a partir da develop
git checkout -b feat/86a1b2c-catalogo-cursos

# 3. Desenvolva, rode os testes e faça os commits
git add .
git commit -m "feat(86a1b2c): create course catalog layout and cards"

# 4. Envie sua branch para o GitLab
git push -u origin feat/86a1b2c-catalogo-cursos

# 5. Abra o Merge Request no GitLab apontando como destino a branch DEVELOP
```

---

## 🎨 Regras do Design System (CSS)

> ⚠️ **Atenção:** **NUNCA** utilize valores de cores hexadecimais (`#c9a84c`, `#ffffff`), tamanhos fixos ou espaçamentos arbitrários diretamente nos arquivos `.css` ou `.module.css`.

Utilize **SEMPRE** as variáveis CSS declaradas em [`src/index.css`](src/index.css). O **Stylelint** bloqueará o commit caso cores hexadecimais sejam inseridas diretamente.

```css
/* ✅ CORRETO — utiliza variáveis do design system */
.button {
  color: var(--color-primary);
  background-color: var(--color-accent);
  font-size: var(--text-sm);
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-md);
  transition: background-color var(--transition-fast);
}

/* ❌ PROIBIDO — bloqueado pelo Stylelint */
.button {
  color: #1a1a2e;
  background-color: #c9a84c;
  font-size: 14px;
  padding: 12px 24px;
}
```

---

## 🐳 Containerização com Docker

Para testar localmente como a aplicação roda no container de produção Nginx (que será publicado no cluster **k3s**):

```bash
docker compose up --build
```
Acesse em: [http://localhost:8080](http://localhost:8080) | Healthcheck: [http://localhost:8080/health](http://localhost:8080/health)
