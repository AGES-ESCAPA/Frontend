# US-21 — Cadastro de aluno individual

## Fluxo implementado

- O link **Começar Agora** da página inicial abre `/cadastro`.
- A escolha **Pessoa Física** abre a rota pública `/cadastro/usuario`.
- **Voltar** retorna explicitamente à escolha do tipo; **Entrar** abre o login.
- O retorno é preservado no percurso por `state.returnTo`, pela query `returnTo`
  ou por `escapa:purchase-redirect`, nessa ordem. URLs externas e destinos que
  retornariam ao próprio login/cadastro são ignorados.
- Depois do cadastro, `AuthContext.login(token, user, expiresIn)` inicia a sessão.
  O destino é a página de retorno, quando disponível, ou `/aluno/cursos`.
- A confirmação de sucesso permanece visível depois da navegação.

## Formulário e contrato

`authService.registerStudent` envia `POST /auth/register/student` usando a URL
base de runtime, que já inclui `/api/v1`. A chamada é pública, com JSON, sem
cookies ou header de identificação de usuário.

| Campo                | Regra                                                                                          |
| -------------------- | ---------------------------------------------------------------------------------------------- |
| Nome completo        | Obrigatório; até 255 caracteres após trim.                                                     |
| CPF                  | Obrigatório; máscara, dígitos verificadores e rejeição de sequências repetidas.                |
| E-mail               | Obrigatório; formato válido, até 255 caracteres; enviado sem espaços externos e em minúsculas. |
| Telefone / WhatsApp  | Opcional; quando preenchido, 10 ou 11 dígitos com DDD.                                         |
| Senha                | Pelo menos oito caracteres, sem aceitar somente espaços; preservada exatamente.                |
| Confirmação de senha | Deve ser idêntica à senha; não é enviada à API.                                                |

CPF e telefone são enviados como strings, somente com números. Os dois campos
de senha possuem controles independentes de visibilidade. CPF e e-mail são
revalidados durante a edição; campos incompletos também são verificados ao sair
do campo e ao enviar. Os validadores e as máscaras existentes são reutilizados.

O envio pendente bloqueia os campos e novos envios, exibindo carregamento.
Conflitos de CPF/e-mail aparecem no campo correspondente. Erros conhecidos de
validação são traduzidos, inclusive quando concatenados pela API; mensagens
desconhecidas de HTTP 400 permanecem disponíveis no formulário. Falhas de rede
exibem toast e preservam os valores. O POST não possui repetição automática.

O foco vai para o primeiro campo inválido, e cada mensagem fica associada ao
respectivo input por `aria-describedby`. As ações possuem área mínima de toque
definida no Design System.

## Sessão e dependência da US-23

A branch foi criada a partir de `origin/develop`, com a US-23 já integrada.
São reutilizados o AuthContext, o login, o mapeamento de perfil, a restauração
por `/auth/me`, as rotas protegidas e o header Bearer existentes.

O contexto recebeu um terceiro argumento opcional em `login`: `expiresIn`, em
segundos. Para o cadastro, a expiração recebida é persistida em
`access_token_expires_at`; o token permanece na chave existente `access_token`.
A sessão é encerrada ao expirar e não é restaurada se o prazo já tiver passado.
A assinatura anterior `login(token, user)` continua compatível.

## Validação

Os testes de tela mockam o serviço. Os testes de serviço mockam `fetch`,
verificando URL, headers, payload, resposta e falhas. São cobertos:

- Campos obrigatórios, CPF/e-mail inválidos, telefone opcional e senha curta.
- Colagem de valores mascarados e visibilidade independente das senhas.
- Bloqueio de senhas diferentes e revalidação da confirmação.
- Sessão, expiração e destino após sucesso, com e sem retorno de compra.
- Preservação do retorno ao voltar e ao mudar para o login.
- Conflitos HTTP 409 de e-mail e CPF, com foco e erro associado ao campo.
- Erro HTTP 400, erro de rede, preservação dos valores e tentativa manual.
- Bloqueio de envio duplo e rejeição de respostas inesperadas.
- Navegação do botão Começar Agora para a escolha de cadastro.

Comandos de verificação, em Node 20:

```sh
npm run test:coverage
npm run lint
npm run stylelint
npm run format:check
npm run build
```

Também foram feitos testes HTTP contra o backend local em `localhost:8080`:
cadastro sem telefone (`201`), consulta de sessão com Bearer (`200`), conflito
de e-mail (`409`), conflito de CPF (`409`) e rejeição de CPF inválido (`400`).
Foi criado um único usuário sintético para essa verificação:
`us21-test-c9714b97b766@example.com`, id
`cedd086a-6225-40a2-ad6f-9e01c8b3efb5`. Senha e token não são registrados no
relatório ou nos logs.

## Homologação pendente

O layout usa largura fluida, formulário em coluna e largura máxima do Design
System, sem alturas fixas no cartão. A conferência visual em navegador nas
larguras de celular, tablet e desktop permanece pendente: não havia navegador
conectado disponível para automação nesta sessão. Conferir também teclado
virtual, zoom e mensagens de erro longas nessas larguras.

Não há decisão funcional bloqueante: telefone opcional, política de senha e
destino padrão seguem o contrato e a task de integração fornecidos. Qualquer
mudança nessas regras deve ser alinhada com o backend.
