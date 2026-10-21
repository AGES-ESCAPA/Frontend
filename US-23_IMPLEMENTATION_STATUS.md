# US-23 — Status da Implementação

Este documento registra o estado da implementação das issues relacionadas ao login unificado e à autenticação da plataforma:

- #111 — Componente `PasswordInput`
- #112 — Sessão do usuário e rotas protegidas
- #113 — Integração e estados do login

## Implementado

### #111 — Campo de senha

O componente `PasswordInput` já estava implementado e foi reutilizado na tela de login.

- Campo inicia ocultando a senha e alterna entre `password` e `text`.
- Usa os ícones `Eye` e `EyeOff` do `lucide-react`.
- O botão de alternância não submete o formulário, funciona com teclado e possui atributos de acessibilidade.
- Aceita `autoComplete`; o login usa `current-password`.
- Mantém o comportamento visual de `invalid` e suporta `forwardRef`.

### Sessão e autenticação

Foram criados os tipos e a camada de autenticação:

- `src/types/auth.ts`: papéis `ADMIN`, `COMPANY`, `STUDENT` e `EMPLOYEE`, além do tipo de usuário autenticado.
- `src/services/authService.ts`: chamadas para `POST /auth/login` e `GET /auth/me`.
- `src/contexts/AuthContext.tsx`: estado global da sessão.

O `AuthContext` expõe:

- `user`
- `isAuthenticated`
- `isRestoring`
- `login(token, user)`
- `logout()`

O token é persistido no `localStorage` usando a chave `access_token`. Ao iniciar a aplicação, um token salvo é validado por `/auth/me`. Um retorno `401` remove o token e encerra a sessão.

### Chamadas autenticadas à API

Os antigos helpers `adminHeaders()` e `studentHeaders()` foram removidos.

- `authHeaders()` cria o header `Authorization: Bearer <token>`.
- `authenticatedFetch()` centraliza chamadas autenticadas e notifica a sessão em respostas `401`.
- Os serviços de cursos administrativos, módulos, aulas, currículo e matrículas foram migrados para esse fluxo.
- O header provisório `X-User-Id` e as variáveis de ambiente associadas foram removidos.

### Rotas e autorização

Foram adicionados:

- `src/routes/ProtectedRoute.tsx`
- `src/routes/access.ts`

As regras implementadas são:

| Área                                       | Papéis permitidos     |
| ------------------------------------------ | --------------------- |
| `/admin/**`                                | `ADMIN`               |
| `/empresa/**`                              | `COMPANY`             |
| `/meus-cursos`, `/aluno/**`, `/meu-perfil` | `STUDENT`, `EMPLOYEE` |
| `/checkout/**`                             | `STUDENT`, `COMPANY`  |

Sem sessão, a aplicação redireciona para `/login` preservando a rota em `state.returnTo`. Com uma sessão sem permissão, o usuário é enviado ao painel padrão do próprio perfil.

Destinos padrão após login:

| Papel                  | Destino                  |
| ---------------------- | ------------------------ |
| `STUDENT` e `EMPLOYEE` | `/meus-cursos`           |
| `COMPANY`              | `/empresa/colaboradores` |
| `ADMIN`                | `/admin/cursos`          |

### Tela de login

A tela provisória com botões por perfil foi substituída por um formulário com:

- e-mail e senha;
- `PasswordInput`;
- botão `Entrar` com estado de carregamento;
- bloqueio contra envio duplo;
- links para recuperação de senha e cadastro;
- mensagem genérica para `401`;
- mensagem de conta desativada para `403`;
- toast para falha de rede ou erro inesperado;
- ação `Tentar novamente` no toast de falha de rede;
- retorno à rota de origem ou à compra pendente em `escapa:purchase-redirect`.

Usuários já autenticados que acessam `/login` são enviados ao painel correspondente ao seu perfil.

### Layout, perfil e logout

O `AuthenticatedLayout` passa a priorizar os dados do usuário da sessão para exibir nome, papel, e-mail e avatar. Dados mockados permanecem apenas como fallback para testes isolados de componentes.

A Navbar agora possui menu de perfil com:

- `Meu perfil`;
- `Sair`.

O logout remove o token, limpa a sessão e permite que o guard redirecione o usuário para `/login`.

## Testes e validações executadas

Foram adicionados ou atualizados testes para:

- `authService`;
- montagem do header Bearer e tratamento de `401`;
- login com sucesso;
- destinos padrão de `STUDENT`, `EMPLOYEE`, `COMPANY` e `ADMIN`;
- retorno para a rota protegida;
- retorno para uma compra pendente;
- erro `401`;
- erro `403`;
- falha de rede com nova tentativa e preservação do formulário;
- bloqueio contra envios duplicados;
- restauração de sessão em `/login`;
- logout com limpeza de sessão e redirecionamento;
- serviços migrados de `X-User-Id`;
- componente `PasswordInput`.

Também foram executados com sucesso:

- checagem de tipos TypeScript;
- build de produção do Vite;
- lint, Stylelint e `git diff --check`.

## O que ainda falta

### Confirmar e integrar o endpoint de restauração de sessão

A camada está concentrada em `src/services/authService.ts`; a restauração de sessão ainda precisa ser validada contra os endpoints reais:

- `POST /api/v1/auth/login`;
- `GET /api/v1/auth/me`.

O contrato de `POST /auth/login` foi conferido no backend atual: o token vem em
`data.accessToken` e o papel vem em `data.user.profile`. O `authService` converte
esse campo para o modelo interno `user.role`, mantendo o restante do frontend
independente desse detalhe. A API local foi iniciada e respondeu normalmente ao
health check. No entanto, em 20 de outubro de 2026, `GET /api/v1/auth/me`
respondeu `404`, inclusive com um token Bearer enviado. Esse endpoint continua
dependente da Backend #41; sem ele, a restauração da sessão após recarregar a
página não pode ser validada de ponta a ponta.

O frontend usa `data.accessToken` e trata `data.user` no formato definido pelo
contrato:

```ts
{
  id: string;
  name: string;
  email: string;
  profile: 'ADMIN' | 'COMPANY' | 'STUDENT' | 'EMPLOYEE';
  avatarUrl?: string | null;
  status?: string;
}
```

Se o backend usar nomes ou envelopes diferentes, o ajuste deve ser feito apenas no `authService` e, se necessário, no mapeamento de resposta.

### Validar integração real

Depois que a Backend #41 disponibilizar `/auth/me`, validar manualmente:

1. Login com cada perfil.
2. Restauração da sessão após recarregar a página.
3. Token expirado ou inválido.
4. Redirecionamento após acessar uma rota protegida sem sessão.
5. Redirecionamento após tentativa de compra de curso.
6. Logout pela Navbar e pela Sidebar.
7. Respostas `401` em serviços já autenticados.

O health check em `http://localhost:8080/api/v1/health` respondeu `200` durante
esta verificação. A validação integrada segue bloqueada exclusivamente pela
ausência de `/auth/me` e pela migração das rotas autenticadas do backend para
Bearer token, ambas previstas na Backend #41.

### Cobertura adicional recomendada

Foram incluídos testes para restauração válida e inválida no `AuthContext`,
resposta `401` em chamada autenticada, `ProtectedRoute` sem sessão/com perfil
sem permissão/com perfil permitido e logout com redirecionamento. Ainda vale fazer
um teste de integração de uma tela completa contra a API quando a Backend #41
estiver disponível.

Durante essa revisão, o contexto compartilhado foi movido para
`src/contexts/authContextDefinition.ts`. A versão anterior usava
`AuthContext.tsx` e `authContext.ts`, nomes que entram em conflito em sistemas
de arquivos sem distinção entre maiúsculas e minúsculas, como o Windows.

### Telas ainda em construção

Alguns destinos usados pelos menus e redirecionamentos, como `/empresa/colaboradores` e `/meu-perfil`, podem continuar usando a página `UnderConstruction` até que suas histórias específicas sejam implementadas. As permissões de acesso para essas rotas já estão configuradas.
