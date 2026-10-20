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

| Área | Papéis permitidos |
| --- | --- |
| `/admin/**` | `ADMIN` |
| `/empresa/**` | `COMPANY` |
| `/meus-cursos`, `/aluno/**`, `/meu-perfil` | `STUDENT`, `EMPLOYEE` |
| `/checkout/**` | `STUDENT`, `COMPANY` |

Sem sessão, a aplicação redireciona para `/login` preservando a rota em `state.returnTo`. Com uma sessão sem permissão, o usuário é enviado ao painel padrão do próprio perfil.

Destinos padrão após login:

| Papel | Destino |
| --- | --- |
| `STUDENT` e `EMPLOYEE` | `/meus-cursos` |
| `COMPANY` | `/empresa/colaboradores` |
| `ADMIN` | `/admin/cursos` |

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
- retorno para a rota protegida;
- erro `401`;
- erro `403`;
- falha de rede;
- serviços migrados de `X-User-Id`;
- componente `PasswordInput`.

Também foram executados com sucesso:

- checagem de tipos TypeScript;
- build de produção do Vite;
- lint, Stylelint e `git diff --check`.

## O que ainda falta

### Confirmar e integrar o contrato final do backend

O backend não estava acessível durante a implementação. A camada está concentrada em `src/services/authService.ts`, mas precisa ser validada contra os endpoints reais:

- `POST /api/v1/auth/login`;
- `GET /api/v1/auth/me`.

O frontend aceita `data.accessToken` ou `data.token`, mas pressupõe um objeto `data.user` com os campos:

```ts
{
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'COMPANY' | 'STUDENT' | 'EMPLOYEE';
  avatarUrl?: string | null;
  status?: string;
}
```

Se o backend usar nomes ou envelopes diferentes, o ajuste deve ser feito apenas no `authService` e, se necessário, no mapeamento de resposta.

### Validar integração real

Depois que os endpoints estiverem disponíveis, validar manualmente:

1. Login com cada perfil.
2. Restauração da sessão após recarregar a página.
3. Token expirado ou inválido.
4. Redirecionamento após acessar uma rota protegida sem sessão.
5. Redirecionamento após tentativa de compra de curso.
6. Logout pela Navbar e pela Sidebar.
7. Respostas `401` em serviços já autenticados.

### Cobertura adicional recomendada

Ainda é recomendável incluir testes de integração para:

- `ProtectedRoute` com cada combinação de papel e rota;
- restauração bem-sucedida e falha de sessão no `AuthContext`;
- saída pelo menu da Navbar;
- resposta `401` em uma tela que já possui dados carregados.

### Telas ainda em construção

Alguns destinos usados pelos menus e redirecionamentos, como `/empresa/colaboradores` e `/meu-perfil`, podem continuar usando a página `UnderConstruction` até que suas histórias específicas sejam implementadas. As permissões de acesso para essas rotas já estão configuradas.
