# Decisões

## Escopo: ferramenta pessoal, não produto

O prompt original descrevia um SaaS (planos, créditos, pagamentos, CRM, agente de vendas, portfólio público). O uso real é pessoal: filtrar lojas por estado e cidade que não têm site ou têm o site quebrado. Por isso foram removidos Supabase, cadastro, onboarding, planos, créditos e a landing, e o app virou uma tela única protegida por senha.

Foi reaproveitado do que já existia: o tema claro/escuro, os componentes base, a validação de telefone e a lógica de status.

## Escolhas

| Decisão | Motivo |
|---|---|
| Fonte de dados: **Google Places (New)** | Único campo de site confiável. OpenStreetMap é gratuito, mas muita loja com site não tem o campo preenchido, o que geraria muito falso "sem site". |
| Acesso por **senha única** (`APP_PASSWORD`) e cookie assinado com **`SESSION_SECRET`** separado, sem banco | Cada busca gasta a chave do Google. Se o cookie fosse assinado com a própria senha, quem copiasse o cookie poderia testar senhas offline e sem limite. O cookie leva data de emissão (vale 7 dias) e uma impressão digital da senha, então trocar a senha ou o segredo derruba as sessões. Sem senha ou segredo em produção, o app recusa tudo. |
| Só tentativas de senha **erradas** contam para o bloqueio, com um teto global além do por endereço | O cabeçalho de IP pode ser forjado fora de plataformas que o sobrescrevem, então o limite por endereço sozinho seria contornável. Login correto não gasta tentativas. |
| Sem banco de dados | Nada precisa persistir no servidor. "Já contatei" fica no `localStorage` do navegador. Em contrapartida, não sincroniza entre aparelhos. |
| Busca primeiro, checagem dos sites depois, em lotes | A lista aparece rápido e os cartões se atualizam conforme os sites são verificados. Cada requisição fica curta, o que importa em hospedagem serverless. |
| Timeout ou 5xx persistente vira **"Verificar manualmente"**, não "com problema" | Sites atrás de Cloudflare ou que bloqueiam IPs de datacenter parecem fora do ar para o servidor mas abrem para pessoas. Afirmar "quebrado" nesses casos seria falso. Só é "com problema" o que é inequívoco: DNS inexistente, conexão recusada, 404/410, certificado vencido ou de outro domínio, loop de redirecionamento, ou 500 que persiste após nova tentativa. |
| Cadeia de certificado incompleta vira "Verificar manualmente" | O Node não busca certificados intermediários como os navegadores fazem, então esses sites costumam abrir normalmente para o visitante. |
| 401/403/429 ou desafio anti-robô vira "Verificar manualmente" e **não** é repetido | Repetir não resolve, e o bloqueio não diz nada sobre o site para pessoas. |
| Um timeout é tentado de novo uma única vez | Falha isolada de rede não deve condenar um site. |
| Outros 4xx (400, 405, 406, 451, 999…) viram "Verificar manualmente" | Servidores costumam rejeitar clientes automáticos com esses códigos. Só 404 e 410 indicam página inexistente. |
| "Site lento" só vale se uma **segunda medição** concordar | Uma leitura lenta pode ser partida a frio ou servidor distante. Vale a melhor das duas leituras. |
| Cookies são mantidos entre redirecionamentos | Muitos sites redirecionam para gravar um cookie e voltar. Sem isso pareceriam um loop, mas no navegador abrem normalmente. |
| Filtro "só dentro da cidade" ligado por padrão | A busca de texto do Google devolve cidades vizinhas. O filtro lê o trecho do endereço que antecede o estado ("..., Campo Mourão - PR,"), ignorando acentos e maiúsculas, então "Rua dos Santos" em Campinas não passa por Santos. Endereços fora do formato conhecido caem num teste mais frouxo (cidade e estado aparecem no endereço). |
| O limite diário de buscas só conta buscas que o Google respondeu | Chave errada ou queda do Google não devem gastar o limite. A janela é de 24 h corridas, não "por dia" de calendário. |
| Lista de cidades vem do IBGE (cache de dias) | Autocompleta e evita erro de digitação; se a API falhar, o campo continua aceitando texto livre. |
| CSV com `;`, BOM e prefixo `'` em células que começam com `=`, `+`, `-` ou `@` | É o formato que o Excel em português abre sem bagunçar acentos e colunas. Nomes de loja vêm de terceiros, então precisam ser neutralizados contra injeção de fórmula. |
| Imagens de teste e dados de exemplo foram removidos | A tela mostra só resultados reais da sua busca. |
| shadcn/ui não foi usado via CLI | O CLI falhou na instalação (regra `allow-scripts` do npm local). Os componentes em `src/components/ui` seguem o mesmo padrão (cva + tokens). |
| `npm audit` reporta 5 vulnerabilidades "high" | Todas em dependências de desenvolvimento (cadeia do `eslint-config-next`). Em produção: 0. `npm audit fix --force` faria downgrade do Next para 14, então não foi aplicado. |

## Segurança da checagem de sites (SSRF)

O servidor busca URLs que terceiros digitaram no Google Maps, então:

- Bloqueia loopback, redes privadas, CGNAT, link-local (incluindo `169.254.169.254`), multicast e reservados, em IPv4 e IPv6 (inclusive `::ffff:127.0.0.1` e a forma hexadecimal).
- O IP é validado **dentro da própria conexão** (`lookup` do `http.request`), então o IP verificado é o IP usado. Isso impede DNS rebinding.
- Cada redirecionamento é revalidado, com no máximo 5.
- Só `http` e `https`; sem compressão (nada de bombas de descompressão); corpo limitado a 2 MB; 8 s no total por tentativa.
- Existem opções que desligam a proteção (`allowPrivateNetwork`, `unsafeAllowHosts`), mas são só para testes e **nenhuma rota da API as passa**.

## Pendências conhecidas

- Sem CSP definida. O script inline do tema (`theme-script.tsx`) precisaria de nonce se uma for adicionada.
- O limite diário de buscas e os de tentativas de senha são por instância do servidor.
- Um cookie de sessão copiado continua válido até vencer (7 dias) ou até trocar a senha ou o `SESSION_SECRET`: não há revogação individual, porque não há banco.
- Sem teste automatizado de interface commitado: o fluxo completo foi verificado manualmente com Playwright (busca simulada + verificação real de sites), mas depende de internet e de sites de terceiros, então não entrou na suíte.
