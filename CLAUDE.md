# CLAUDE.md

## Projeto

Garimpo: SaaS de prospecção para freelancers brasileiros. A especificação original (fases, planos, modelo de dados) foi fornecida pelo autor; as decisões tomadas estão em `docs/DECISOES.md`.

- Trabalhar **por fases** (oito fases: fundação, planos e créditos, busca e análise, IA, leads e agente, portfólio, pagamentos, acabamento) e parar ao fim de cada uma para validação.
- Interface 100% em português do Brasil. Código, nomes e comentários em inglês.
- TypeScript estrito. Validação de toda entrada com Zod, no servidor.
- Segredos só em `.env.local` (nunca no código). Chaves de API só no servidor.
- Planos, créditos e limites vivem em `src/config/plans.ts` e em nenhum outro lugar.
- Commits pequenos, Conventional Commits.

## Convenções técnicas

- Next 16 com **Cache Components**: tudo que lê `cookies()`/`searchParams` fica dentro de `<Suspense>`. Sem `new Date()`/`Math.random()` no render. A documentação do Next está em `node_modules/next/dist/docs`.
- Convenção `proxy.ts` (não `middleware.ts`).
- Tema por variáveis CSS em `src/app/globals.css`; um único acento esmeralda; sem `dark:` espalhado.
- Ícones: Phosphor (`@phosphor-icons/react/dist/ssr` em Server Components). Fonte: Geist.
- Texto da interface sem travessão (em dash) e sem emoji.
- Antes de commitar: `npm run typecheck && npm run lint && npm test`.

## Skills disponíveis

Lista de todas as skills disponíveis neste ambiente. Invocar com `/<nome>` ou pela ferramenta Skill. Skills de plugins usam o formato `plugin:skill`.

## Design e frontend

| Skill | Descrição |
|---|---|
| `brandkit` | Geração de imagens de brand-kit premium: brand-guidelines, sistemas de logo, identidade visual. |
| `design-taste-frontend` | Frontend anti-slop para landing pages, portfólios e redesigns; evita interfaces com cara de template. |
| `design-taste-frontend-v1` | Versão original (v1) da taste-skill, mantida por compatibilidade. |
| `gpt-taste` | UX/UI e motion avançado com GSAP: ScrollTriggers, bento grids, tipografia editorial, estrutura AIDA. |
| `high-end-visual-design` | Design de nível agência: fontes, espaçamento, sombras, cards e animações que passam sensação de premium. |
| `image-to-code` | Gera primeiro as imagens de design e depois implementa o site para corresponder a elas. |
| `imagegen-frontend-mobile` | Geração de imagens de telas e fluxos de apps mobile (iOS/Android). Só imagens, sem código. |
| `imagegen-frontend-web` | Geração de referências de design web, uma imagem horizontal por seção. |
| `industrial-brutalist-ui` | Interfaces brutalistas: grids rígidos, estética de terminal militar, dashboards densos. |
| `minimalist-ui` | Interfaces editoriais limpas: monocromático quente, bento grids planos, sem gradientes. |
| `redesign-existing-projects` | Audita e eleva sites/apps existentes a qualidade premium sem quebrar funcionalidade. |
| `stitch-design-taste` | Gera arquivos DESIGN.md para o Google Stitch com padrões anti-genéricos. |
| `web-design-guidelines` | Revisão de UI quanto a acessibilidade, UX e boas práticas (Web Interface Guidelines). |
| `modern-web-guidance:modern-web-guidance` | Boas práticas modernas de HTML/CSS/JS client-side. Executar primeiro em tarefas web. |
| `modern-web-guidance:chrome-extensions` | Orientação para extensões do Chrome. |
| `claude-mem:design-is` | Auditoria de design contra os dez princípios de Dieter Rams, com plano de ação. |

## Vercel, React e deploy

| Skill | Descrição |
|---|---|
| `deploy-to-vercel` | Faz deploy de apps e sites na Vercel (preview ou produção). |
| `vercel-cli-with-tokens` | Deploy e gestão na Vercel via CLI com tokens de acesso. |
| `vercel-optimize` | Otimização de custo e performance em projetos deployados na Vercel. |
| `vercel-composition-patterns` | Padrões de composição React: compound components, render props, contexts. |
| `vercel-react-best-practices` | Otimização de performance de React e Next.js. |
| `vercel-react-native-skills` | Boas práticas de React Native e Expo. |
| `vercel-react-view-transitions` | Animações com a View Transition API do React. |

## Código, revisão e qualidade

| Skill | Descrição |
|---|---|
| `init` | Cria um CLAUDE.md com documentação do codebase. |
| `code-review` | Revisão do diff atual ou de um PR (níveis low a max, e `ultra` na nuvem). |
| `simplify` | Revisa o código alterado e aplica melhorias de reuso, simplificação e eficiência. |
| `security-review` | Revisão de segurança das mudanças pendentes no branch atual. |
| `run` | Executa o app do projeto para ver uma mudança funcionando. |
| `full-output-enforcement` | Força saída completa, sem truncamento nem placeholders. |
| `claude-api` | Referência da API Claude / Anthropic SDK: modelos, preços, tool use, caching. |
| `writing-guidelines` | Revisão de docs e prosa quanto ao guia de escrita. |

## Configuração e automação do Claude Code

| Skill | Descrição |
|---|---|
| `update-config` | Configura o harness via settings.json: hooks, permissões, variáveis de ambiente. |
| `keybindings-help` | Personaliza atalhos de teclado (`~/.claude/keybindings.json`). |
| `fewer-permission-prompts` | Adiciona uma allowlist a `.claude/settings.json` para reduzir prompts de permissão. |
| `plugin-authoring` | Cria mods (painéis, status line, toasts, hooks) como plugin de hooks. |
| `loop` | Executa um prompt ou comando em intervalo recorrente. |
| `schedule` | Cria e gerencia agentes agendados na nuvem (routines). |
| `claude-code-setup:claude-automation-recommender` | Recomenda hooks, subagentes, skills, plugins e MCP servers para o projeto. |

## claude-mem (memória e planejamento)

| Skill | Descrição |
|---|---|
| `claude-mem:mem-search` | Busca na memória persistente entre sessões. |
| `claude-mem:how-it-works` | Explica como o claude-mem captura e injeta observações. |
| `claude-mem:make-plan` | Cria um plano de implementação faseado. |
| `claude-mem:do` | Executa um plano faseado usando subagentes. |
| `claude-mem:learn-codebase` | Lê todos os arquivos de código-fonte para conhecer o projeto. |
| `claude-mem:smart-explore` | Busca estrutural de código com AST (tree-sitter), econômica em tokens. |
| `claude-mem:pathfinder` | Mapeia o codebase em fluxogramas por feature e propõe arquitetura unificada. |
| `claude-mem:knowledge-agent` | Cria e consulta bases de conhecimento a partir das observações. |
| `claude-mem:timeline-report` | Gera o relatório narrativo "Journey Into [Project]". |
| `claude-mem:weekly-digests` | Gera resumos narrativos semana a semana do projeto. |
| `claude-mem:standup` | Standup somente leitura entre worktrees, branches ou PRs. |
| `claude-mem:babysit` | Acompanha um PR até estar pronto para merge. |
| `claude-mem:oh-my-issues` | Agrupa issues do GitHub por causa raiz em planos-mestre. |
| `claude-mem:mode-creator` | Cria e ativa modos personalizados do claude-mem. |
| `claude-mem:cloud-sync` | Configura ou verifica a sincronização em nuvem do claude-mem (cmem.ai Pro). |
| `claude-mem:ccs-align` | Executa o ciclo horário do assento CCS Align. |
| `claude-mem:version-bump` | Versionamento semântico e release de plugins. |
| `claude-mem:what-the` | Explicação em linguagem simples de algo técnico. |
| `claude-mem:wowerpoint` | Transforma um documento em um deck de slides em PDF. |

## Dados e análise

| Skill | Descrição |
|---|---|
| `data:analyze` | Responde perguntas de dados, de consultas rápidas a análises completas. |
| `data:explore-data` | Perfila e explora um dataset (qualidade, distribuições, padrões). |
| `data:sql-queries` | SQL correto e performático em vários dialetos de warehouse. |
| `data:write-query` | Escreve SQL otimizado para o seu dialeto. |
| `data:statistical-analysis` | Estatística descritiva, tendências, outliers e testes de hipótese. |
| `data:validate-data` | QA de uma análise antes de compartilhar. |
| `data:data-visualization` | Visualizações em Python (matplotlib, seaborn, plotly). |
| `data:create-viz` | Gráficos de qualidade de publicação com Python. |
| `data:build-dashboard` | Dashboard HTML interativo com gráficos, filtros e tabelas. |
| `data:data-context-extractor` | Gera ou melhora uma skill de análise específica da empresa. |
| `dataviz` | Guia para qualquer gráfico, dashboard ou visualização, em qualquer meio. |

## Artifacts

| Skill | Descrição |
|---|---|
| `artifact-design` | Fundamentos de design para Artifacts. Carregar antes de escrever qualquer artifact. |
| `artifact-diagramming` | Como desenhar diagramas legíveis (SVG inline) em Artifacts. |
| `artifact-capabilities` | Capacidades de runtime de um Artifact: estado, dados, arquivos, câmera, etc. |

## Produtividade

| Skill | Descrição |
|---|---|
| `productivity:start` | Inicializa o sistema de produtividade e abre o dashboard. |
| `productivity:task-management` | Gestão de tarefas via arquivo TASKS.md. |
| `productivity:update` | Sincroniza tarefas e atualiza a memória a partir da atividade atual. |
| `productivity:memory-management` | Memória em duas camadas (CLAUDE.md + diretório memory/). |
| `anthropic-skills:morning` | Brief matinal em HTML ou como tarefa recorrente. |
| `anthropic-skills:import-memory` | Importa memória exportada de outro assistente de IA. |

## Documentos e arquivos

| Skill | Descrição |
|---|---|
| `anthropic-skills:docx` | Cria, lê e edita documentos Word (.docx, .dotx). |
| `anthropic-skills:pdf` | Trabalha com arquivos PDF. |
| `anthropic-skills:pptx` | Cria e edita apresentações PowerPoint. |
| `anthropic-skills:xlsx` | Cria e edita planilhas Excel. |
| `anthropic-skills:docs` | Documentos (Claude Docs). |
| `anthropic-skills:google-workspace` | Integração com Google Workspace. |
| `anthropic-skills:skill-creator` | Cria novas skills. |

## Sites B12

| Skill | Descrição |
|---|---|
| `b12-claude-plugin:website-generator` | Gera um site profissional com IA a partir de uma descrição. |
| `b12-claude-plugin:b12-website-editor` | Edita um site B12 existente pelo navegador. |
