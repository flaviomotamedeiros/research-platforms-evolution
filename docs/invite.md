# Invitation (ready to send)

## WhatsApp / message

> **Prezados,** 👋
>
> Estou testando uma **nova forma de colaboração em pesquisa via Claude Code**.
> Estou escrevendo um artigo e uma das etapas é a execução de um experimento.
> Em vez de marcarmos uma reunião para eu explicar todos os passos e as ideias
> do artigo, estou usando o Claude para fazer esse repasse.
>
> **Toda a conversa que tive com o Claude Code e tudo que foi construído está
> documentado no repositório do GitHub.** Assim, o próprio Claude consegue tirar
> todas as suas dúvidas e orientar você na execução do experimento — do zero, no
> seu ritmo.
>
> 📌 **O experimento:** modernização de sistemas legados do setor público
> (Moodle, GLPI, Redmine) — aqueles que a instituição não pode desligar nem
> reescrever do zero. A ideia é extrair os "contratos de domínio" dos plugins e
> reimplementar numa stack moderna, sem big-bang. **Eu já validei a
> metodologia**, mas quero que o experimento seja **executado nos três sistemas**
> (Moodle, GLPI e Redmine), com dados de escala institucional real (~3–4 anos de
> uso) e validação rigorosa (mesmo dataset no legado e na reimplementação,
> comparando as saídas).
>
> ⚙️ **A stack já está definida** — deve ser a mesma que especifiquei e que já
> está no repositório: monorepo pnpm + TypeScript, Next.js (App Router, sem
> NestJS), Prisma, PostgreSQL no Neon (um banco por sistema), Tailwind, e os
> pacotes compartilhados `platform-kit` / `plugin-sdk` / `domain-kit`. Não é para
> trocar a stack — é para seguir a que está lá. O Claude te orienta.
>
> 🤝 **Como contrapartida, vou adicionar os interessados como coautores do
> artigo** — tanto por ajudarem no experimento em si, quanto por participarem de
> algo maior: validar o uso do Claude para **sincronizar o trabalho de equipes
> de pesquisadores** na escrita de artigos.
>
> **Como começar (você não precisa ler nada — o Claude te guia):**
> 1. Instale o Claude Code e clone o repositório:
>    `git clone https://github.com/flaviomotamedeiros/research-platforms-evolution.git`
> 2. Abra o Claude Code na pasta do projeto e rode:
>    - `/experiment` — o Claude explica tudo e te configura
>    - `/experiment-step 1` … `/experiment-step 5` — executa os 5 passos
>    - `/experiment-status` — revisa o progresso e salva na sua branch
>
> Ele cria uma branch `researcher/seu-nome`, salva os resultados em `results/` e
> abre um Pull Request quando estiver pronto. Qualquer dúvida, o Claude — ou eu —
> respondemos. Topa participar? 🚀

## The command sequence, in short

| Command | What it does |
|---------|--------------|
| `/experiment` | Onboards you: explains the project, checks your setup, creates your branch, helps you pick a platform. Run this first. |
| `/experiment-step <1–5>` | Guides one methodology step for your platform and helps you produce and commit the deliverable. |
| `/experiment-status` | Reviews what's done vs. the five steps and saves your results to your branch. |

No file-reading required — Claude reads the repo (`docs/DESIGN-NOTES.md`,
`docs/RESEARCH-REPLICATION.md`, `docs/COLLABORATION.md`) and drives the whole
thing conversationally.
