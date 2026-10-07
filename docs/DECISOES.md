# Decisões

Registro de decisões tomadas onde o prompt original era ambíguo ou deixava uma escolha em aberto.

## Fase 1

| Decisão | Motivo |
|---|---|
| Nome provisório do produto: **Garimpo** (`src/config/site.ts`) | O prompt deixava `[NOME_DO_PRODUTO]` em aberto. Trocar em um arquivo atualiza o app inteiro. |
| Pro tem limite de **10 projetos** no portfólio | O prompt define Free = 3 e King = ilimitado, mas não o Pro. Ajustar em `src/config/plans.ts`. |
| `plans.ts` criado na Fase 1 (não na 2) | A landing precisa dos preços. A lógica de créditos continua na Fase 2. |
| shadcn/ui não foi usado via CLI | O CLI falhou na instalação (regra `allow-scripts` do npm local) e tentaria instalar um pacote errado. Os componentes (`src/components/ui`) seguem o mesmo padrão (cva + tokens) e já saem com o design próprio. |
| Revelação ao rolar feita em CSS (`animation-timeline: view()`), sem biblioteca de animação | Versão com JS deixava o conteúdo invisível no HTML do servidor. Em navegadores sem suporte o conteúdo simplesmente aparece. A dependência `motion` foi removida. |
| Tema: segue o sistema; o botão alterna entre "sistema" e "o oposto" (dois estados) | Recomendação do guia `modern-web-guidance`. A escolha fixada vai para `localStorage` e é aplicada antes da primeira pintura. |
| `proxy.ts` (não `middleware.ts`) | Convenção do Next 16. O proxy só roda em `/app`, `/onboarding`, `/login` e `/cadastro`, então a landing continua 100% estática. |
| Proteção em três camadas: `proxy.ts` → `AuthGate` no layout de `/app` → RLS | O proxy é só a primeira barreira. O `AuthGate` revalida a sessão no servidor de autenticação. |
| Usuário **não** pode alterar `plan`, `credits_balance` nem `credits_renew_at` | Policy de update por linha não basta (daria para fazer `update profiles set plan='king'`). A migration revoga o update por coluna e libera só nome, WhatsApp, serviços e cidade. |
| Onboarding completo = tem serviços e cidade | Evita coluna extra `onboarded`; deriva do próprio perfil. |
| WhatsApp salvo em formato canônico (`5544999998888`) | É exatamente o que o link `wa.me` espera (Fase 4). |
| Itens de menu de fases futuras aparecem desabilitados com "Em breve" | Evita links que levam a 404. |
| `?plano=pro` nos links de preço ainda não é lido | Será usado no checkout (Fase 7). |
| Páginas de privacidade e termos são provisórias | Texto jurídico real é entregável da Fase 8 e precisa de revisão de advogado. |
| Imagens da landing vêm do Picsum (aleatórias) e estão marcadas como decorativas (`alt=""`) | São placeholders. Substituir por imagens reais antes do lançamento. |
| `npm audit` reporta 5 vulnerabilidades "high" | Todas em dependências de desenvolvimento (cadeia do `eslint-config-next`). Em produção: 0. `npm audit fix --force` faria downgrade do Next para 14, então não foi aplicado. |

## Pendências conhecidas

- **Testes de RLS** (usuário A não lê dados do usuário B) exigem um projeto Supabase real. Entram assim que houver um (a tabela `profiles` já tem as policies).
- Sem CSP definida ainda. Quando for adicionada (Fase 8), o script inline do tema (`theme-script.tsx`) precisará de nonce.
- Limite de tentativas de login: por enquanto só o do próprio Supabase Auth.
