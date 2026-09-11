# NEXA

> "Transforme o caos em pequenas ações."

NEXA é uma plataforma pessoal de organização, foco e produtividade voltada para pessoas com dificuldade de planejamento, gerenciamento do tempo, memória e início de tarefas. Este repositório é uma implementação **real e funcional**: autenticação de verdade, banco de dados persistente, e os fluxos principais (criar tarefa → aparecer no dashboard → concluir → refletir nas estatísticas) funcionam de ponta a ponta.

NEXA é uma ferramenta de apoio à organização. **Não realiza diagnósticos, não trata TDAH e não substitui acompanhamento profissional de saúde.**

## Stack e por que essas escolhas

| Camada | Tecnologia | Motivo |
|---|---|---|
| Frontend/Backend | Next.js 16 (App Router) + TypeScript | Um único projeto full-stack: páginas, API routes e server components no mesmo lugar, com tipagem ponta a ponta. |
| Estilo | Tailwind CSS v4 | Consistência visual rápida sem CSS solto pelo projeto. |
| Banco de dados | Prisma ORM + **SQLite** em desenvolvimento | Banco real, arquivo único, zero infraestrutura externa para rodar este projeto localmente. O schema é compatível com PostgreSQL — para produção, troque `provider = "sqlite"` por `"postgresql"` em `prisma/schema.prisma` e aponte `DATABASE_URL` para um Postgres real (nenhum outro código muda). |
| Autenticação | NextAuth.js (Auth.js) v5, credentials + JWT | Sessões seguras sem reinventar hashing/cookies. |
| Senhas de conta | bcrypt (12 rounds) | Nunca texto puro. |
| Senha mestra do Cofre | Argon2id (`@node-rs/argon2`) | Algoritmo recomendado atualmente para hashing de senha de alta sensibilidade. |
| Criptografia do Cofre | AES-256-GCM, chave derivada via scrypt | Ver seção "Cofre" abaixo. |
| Ícones | lucide-react | Leve, consistente. |

## Como rodar localmente

```bash
npm install
npx prisma migrate deploy   # cria o banco SQLite (prisma/dev.db) a partir das migrações
npm run db:seed             # opcional: popula um usuário de demonstração
npm run dev
```

Login de demonstração (criado pelo seed): **matheus@nexa.app** / **nexa1234**

Variáveis de ambiente (`.env`, veja `.env.example`):

```
DATABASE_URL="file:./dev.db"
AUTH_SECRET="gere com: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
```

## Arquitetura

```
src/
  app/
    (auth)/          login, registro, recuperar-senha, redefinir-senha
    (app)/            todas as telas autenticadas (dashboard, tarefas, foco, cofre, ...)
    api/              rotas de API (uma pasta por recurso)
    onboarding/       fluxo de primeiro acesso
    privacidade/      página pública de privacidade e segurança
  components/
    ui/               componentes base (Button, Input, Card, Modal, Select...)
    layout/            sidebar, bottom nav, topbar
    tasks/, ...         componentes específicos de cada domínio
  lib/                utilidades puras: validação (zod), criptografia, geradores de texto/plano,
                       cn(), rate limiter — tudo sem efeito colateral, testável
  server/             lógica de acesso a dados/regras de negócio usada pelas páginas e rotas
                       (priorização, dashboard, deadlines, gamificação, hábitos...)
  auth.ts             configuração central do NextAuth
  middleware.ts       proteção de rotas (redireciona não-logados para /login)
prisma/
  schema.prisma       schema completo do banco
  seed.js             dados de demonstração
```

Nenhuma tela usa dados mockados no frontend: todo componente client-side que lista, cria, edita ou completa algo faz uma chamada real a uma API route, que lê/escreve no banco via Prisma.

## O que está implementado (funcional, não protótipo)

- **Contas**: cadastro, login, logout, recuperação de senha (fluxo real com token de uso único; como este ambiente não tem serviço de e-mail configurado, o link de redefinição é devolvido na resposta da API em vez de enviado por e-mail — deixado explícito no código).
- **Onboarding** de 3 perguntas, salvo no perfil do usuário.
- **Dashboard** com próxima ação, prioridades do dia, prazos e estatísticas reais.
- **Modo AGORA**: mostra só a próxima ação, uma de cada vez.
- **Tarefas**: CRUD completo, subtarefas, categorias, matérias, prioridade, prazo, duração estimada.
- **Task Break**: gera subtarefas por modelos de palavra-chave (não é uma IA generativa — está documentado em `src/lib/task-break.ts`), editável antes de salvar.
- **Brain Dump**: categorização automática por palavra-chave (`src/lib/brain-dump.ts`), revisão antes de salvar.
- **Calendário** mensal com arrastar-e-soltar para mudar prazos.
- **Deadline Radar** com alerta de sobrecarga da semana.
- **TimeSense/Time Timer/Focus Mode**: timers reais (2–45 min + personalizado), sons ambiente **gerados** via Web Audio API (não são gravações — documentado em `src/lib/ambient-sound.ts`), sessões persistidas no banco.
- **Procrastination Rescue** e **"Tenho um tempinho"**: micro-ações e busca de tarefas curtas por tempo disponível.
- **Habit Garden**: hábitos com streak, estágio visual, sem punição por falha.
- **Gamificação**: XP, níveis, conquistas desbloqueadas por uso real, missões diárias.
- **Anotações**: CRUD simples, favoritos, busca — deliberadamente separado do Cofre.
- **Cofre (Secure Vault)**: ver seção dedicada abaixo.
- **Estudos**: matérias, provas com planejador de estudos automático até a data.
- **Alarmes**: CRUD real + verificação em segundo plano enquanto o app está aberto no navegador (limitação de navegador documentada na própria tela — uma versão nativa seria necessária para alarmes com o app fechado).
- **Assistente NEXA**: baseado em regras (planejador de provas, quebra de tarefas, busca por tempo livre) — deixado explícito que não é um chat de IA generativa livre.
- **Busca global** (não inclui o Cofre).
- **Configurações**: perfil, tema, alterar senha, encerrar todas as sessões, exclusão de conta.
- **PWA**: manifest, ícones, service worker com cache do app shell (nunca cacheia respostas de `/api/*`).

## Cofre — como a criptografia funciona

O Cofre é a área do app com maior sensibilidade e tem uma camada de segurança própria, separada da senha da conta:

1. Ao configurar o Cofre, o usuário define uma **senha mestra**. O servidor armazena apenas um **hash Argon2id** dela (`src/lib/crypto.ts`) — nunca o texto puro.
2. Cada item do Cofre é cifrado com **AES-256-GCM**. A chave simétrica é derivada via **scrypt** a partir da senha mestra + um salt exclusivo do usuário (`User.vaultSalt`).
3. A chave derivada **nunca é persistida** — ela existe apenas em memória do servidor durante o tempo da requisição que está cifrando/decifrando um item, e é descartada em seguida.
4. No cliente, a senha mestra fica apenas em uma variável de estado em memória do React enquanto o Cofre está desbloqueado, nunca em `localStorage`/`sessionStorage`. Um recarregamento de página exige desbloquear de novo.
5. A listagem de itens do Cofre nunca retorna o segredo — só metadados. O segredo só é decifrado sob demanda, quando o usuário clica em "Mostrar" ou "Copiar" (endpoint dedicado `POST /api/vault/items/[id]/reveal`).
6. Copiar um segredo agenda uma tentativa de limpeza da área de transferência ~20s depois (best-effort; nem todo navegador permite isso silenciosamente).

**Isto não é uma arquitetura de conhecimento-zero completa** (isso exigiria toda a cifragem acontecendo no navegador via WebCrypto, sem o servidor nunca ver a senha mestra em texto puro). Aqui o servidor recebe a senha mestra por HTTPS a cada operação sensível para derivar a chave, usa-a, e a descarta. É uma arquitetura "server-assisted": mais simples de implementar corretamente, ainda assim garante que a senha mestra nunca é persistida e que os dados em repouso no banco estão cifrados. Evoluir para zero-knowledge completo (cifragem 100% client-side) é o próximo passo natural se o Cofre for para produção.

Consequência importante, comunicada ao usuário na tela de configuração do Cofre: **se a senha mestra for esquecida, não há como recuperar o conteúdo cifrado** — não existe uma senha mestra universal guardada pela equipe.

## Segurança geral

- Toda rota de API verifica a sessão e a posse do recurso (`userId` do registro == `session.user.id`) antes de ler/escrever — nunca confia apenas na UI.
- Rate limiting em memória (`src/lib/rate-limit.ts`) em login, troca de senha e desbloqueio/criação de itens do Cofre. É um limitador simples de processo único — para múltiplas instâncias em produção, trocar por um armazenamento compartilhado (Redis).
- Validação de entrada com Zod em toda rota que recebe body.
- Prisma parametriza todas as queries (sem risco de SQL injection por concatenação de strings).
- `sessionVersion` no usuário permite invalidar todas as sessões JWT ativas ("sair de todos os dispositivos") sem depender de uma tabela de sessões no banco.
- Log de eventos de segurança (login, falha de login, troca de senha, desbloqueio do Cofre, logout remoto) visível ao próprio usuário em Configurações.

Nenhum sistema é "impossível de invadir" — antes de qualquer uso real em produção, este projeto precisaria de revisão de segurança dedicada, testes de penetração e, no mínimo, 2FA (não implementado nesta fase).

## O que fica fora do escopo desta entrega (e por quê)

A especificação original cobre ~70 seções — um produto do tamanho de um SaaS completo. Priorizei entregar **fundamentos + foco + organização + estudos + memória + gamificação + segurança do Cofre** com qualidade real de ponta a ponta, em vez de superficializar tudo. Ficaram de fora, deliberadamente:

- **Voice Brain** (entrada por voz) e **Snap Task** (foto → tarefa via OCR/IA de visão): exigem uma API de transcrição/visão computacional de terceiros com chave de API — a integração ficaria fácil de plugar (o Brain Dump já separa "texto bruto → organização", bastaria alimentar esse mesmo pipeline a partir de uma transcrição).
- **Focus Room / Focus Buddy** (salas de foco compartilhadas, tempo real): exige infraestrutura de WebSocket/presença que não cabia nesta fase.
- **Flashcards e Simulados** com repetição espaçada: o módulo de Estudos (matérias, provas, planejador automático) está pronto; flashcards/questões ficariam como uma extensão natural do mesmo schema (`Subject`/`Exam`).
- **Assistente de IA generativo com chat livre**: o assistente atual é baseado em regras determinísticas (reaproveita os mesmos geradores do Task Break e do planejador de provas) e está claramente rotulado como tal. Plugar um LLM de verdade exigiria uma chave de API de backend (nunca exposta ao frontend) — a estrutura já isola essa lógica em `src/lib/task-break.ts` e `src/lib/study-plan.ts`, prontas para serem chamadas por uma rota de IA no lugar de, ou além das regras.
- **2FA, painel administrativo, alarmes nativos de SO**: não implementados nesta fase; o schema e a arquitetura não impedem adicioná-los depois.

## Scripts úteis

```bash
npm run dev              # ambiente de desenvolvimento
npm run build && npm run start   # build de produção
npm run db:seed          # popula dados de demonstração
npx prisma studio        # explorar o banco visualmente
npx prisma migrate dev   # criar uma nova migração após mudar o schema
```
