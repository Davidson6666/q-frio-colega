# Decisões

## Escopo: ferramenta pessoal, não produto

O prompt original descrevia um SaaS (planos, créditos, pagamentos, CRM, agente de vendas, portfólio público). O uso real é pessoal: filtrar lojas por estado e cidade que não têm site ou têm o site quebrado. Por isso foram removidos Supabase, cadastro, onboarding, planos, créditos e a landing, e o app virou uma tela única protegida por senha.

Foi reaproveitado do que já existia: o tema claro/escuro, os componentes base, a validação de telefone e a lógica de status.

## Escolhas

| Decisão | Motivo |
|---|---|
| Fonte padrão: **Overture Maps**; **Google Places** fica opcional (`PLACES_PROVIDER`) | Sem conta nem cartão (a conta Google com faturamento não pôde ser criada). O OpenStreetMap foi medido e descartado: Campo Mourão tinha 2 lojas de roupa no mapa, Maringá 3, e Curitiba 41 barbearias/salões com só 2 com site cadastrado, e os servidores públicos da Overpass falharam em mais da metade das consultas. O Overture tem cerca de 3.400 lugares com confiança >= 0,5 só em Campo Mourão (176 salões, 48 barbearias, 118 lojas de roupa, 75 dentistas), com telefone e site. |
| O Overture só entra com confiança >= 0,5 | Cerca de um quarto dos registros de Campo Mourão ficava abaixo disso e costuma ser antigo ou lixo. |
| Uma cidade inteira é baixada uma vez e guardada em disco; o tipo de loja é filtrado localmente | A consulta direto no bucket leva de 20 a 40 s. Guardando a cidade, os tipos seguintes são instantâneos. A pasta `.cache/` tem uma subpasta por versão dos dados, então uma versão nova refaz o download sozinha. |
| Cidade grande demais (acima de 50.000 registros) filtra o tipo de loja já na consulta | Medido em Curitiba: guardar a cidade inteira cortaria registros pela confiança e perderia lojas do tipo pedido sem avisar. Nesse caso cada tipo novo custa 10 a 40 s, mas a lista fica completa. |
| O app avisa quantas lojas existem quando a lista é cortada em 500 | Curitiba tem mais de 500 barbearias. Cortar em silêncio enganaria quem acha que viu tudo. |
| Nos dados do Overture, "Só rede social" inclui quem tem página (Facebook, Instagram) mas nenhum site; "Sem site" é quem não tem nem isso. Há um filtro "Sem site próprio" que junta os dois | Boa parte dos registros vem de páginas do Meta, então quase toda loja tem uma rede social. Separar os dois estados é mais verdadeiro, e o filtro combinado serve ao objetivo real de achar quem não tem site. |
| Webmail (Yahoo, Gmail, UOL...) e buscadores no campo de site contam como "sem site"; páginas de agendamento e formulários contam como "só rede social" | Aparecem nos dados (um salão com `yahoo.com.br` como site, uma barbearia com página do EasyBarber). Nenhum é site próprio. |
| O tipo de loja é uma lista fixa de categorias do Overture (`niches.ts`); texto fora da lista busca no nome da loja | O Overture usa categorias em inglês, não texto livre. Só entram ids vistos em dados reais: um id errado falha em silêncio. O app avisa quando caiu na busca por nome. |
| O DuckDB (módulo nativo) fica fora do pacote (`serverExternalPackages`) | Módulos nativos não podem ser empacotados pelo Next. Foi testado no build de produção. |
| A versão do Overture vem do índice oficial (STAC) e é a mais recente; há uma versão de reserva no código e `OVERTURE_RELEASE` para fixar | Versões antigas somem do bucket depois de um tempo, então fixar uma pode quebrar a busca. |
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
| A cidade é uma lista (seleção) preenchida com todos os municípios do estado escolhido, em ordem alfabética (IBGE, cache de dias) | Evita erro de digitação e garante que o nome bate com o do IBGE, que o Overture usa para achar a cidade. A ordenação usa a regra do português, então "Ângulo" fica entre as cidades com A. Se a lista não carregar, o campo vira texto livre para a ferramenta não travar. |
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

## Possível site e sites institucionais

| Decisão | Motivo |
|---|---|
| Para lojas sem site nos dados, o app monta até 4 endereços a partir do nome (`pizzariafornetto.com.br`, `.com`, e a parte distintiva do nome) e confere se a página é da loja | Medido: cerca de 1 em cada 10 lojas "sem site" tinha site próprio que o dado não conhecia. O cliente nunca envia endereços, só nomes; o servidor monta os domínios e usa a mesma proteção contra SSRF da checagem. |
| **Forte** = nome + cidade ou telefone na página, **ou** a página liga para a rede social que o dado já conhece da loja | Uma loja homônima em outra cidade não consegue imitar isso. O sinal de rede social está testado só na lógica: não disparou em nenhum caso real da medição. |
| **Fraca** = só o título da página (ou o nome do site) contém o nome inteiro da loja; vale apenas em `.com.br` e com nome de 9+ letras | A primeira versão aceitava o título em qualquer domínio e gerou falsos claros (`mendes.com`, `babykids.com`, `orthodontic.com`, uma igreja que caiu num site nacional). Nome com palavra só nunca basta: "Pet shop Búfalo" casaria com uma associação de criadores de búfalo. |
| Só a evidência **forte** tira a loja de "Sem site próprio"; a fraca fica como aviso no cartão | Em restaurantes de Campo Mourão, 10 de 11 sugestões eram fracas, quase todas de nomes genéricos. Esconder um lead por uma sugestão que pode ser de outra empresa custa mais que uma conferência a mais. |
| Palavras genéricas ("barbearia", "central", "dr"...) e a própria cidade não contam como nome; nomes só com palavras genéricas não geram candidato | Evidência por palavra comum não prova nada. Custo: "Center Clínica" não é encontrada. |
| Site de **governo** (`.gov.br`, `.jus.br`...) vira "Site institucional" e não é avaliado | Uma escola pública não compra site, e o site dela estar fora do ar não é um lead. |
| Site de **marca** (Ipiranga, bancos, redes de loja) conta como "sem site próprio", não como site da loja, e não é verificado | Um posto franqueado que lista só `ipiranga.com.br` não tem site próprio: é um lead. A primeira versão os chamava de "institucionais", o que escondia justamente esses leads. Antes disso, o Ipiranga aparecia como "site com problema" (erro 503 de bloqueio contra robôs). A lista de marcas é parcial. |
| Diretórios (Guia Mais, Apontador, TripAdvisor...) contam como "só rede social" | São listagens da loja, não um site dela. |

## Pendências conhecidas
- A busca de "possível site" só enxerga o texto da página inicial. Sites que montam o endereço e o telefone com JavaScript, ou que bloqueiam robôs, só entram pela evidência fraca (título) ou ficam de fora.
- O app visita até 4 endereços por loja sem site, então uma busca grande demora mais (restaurantes de Campo Mourão: cerca de 1 minuto no total).
- O filtro de cidade do Overture exige que o endereço traga a cidade igual à escolhida (sem acento e sem diferenciar maiúsculas). Lugares sem cidade no endereço, ou com o nome de um distrito, ficam de fora. Medido em Campo Mourão: cerca de 0,1% dos registros. É o preço de não misturar cidades vizinhas, que dividem o mesmo retângulo no mapa.
- O Overture não informa se a loja fechou (o campo de situação vem vazio nesta versão) nem traz nota ou avaliações.
- A atribuição dos dados (Overture Maps Foundation e as fontes) está só descrita no README; se um dia for publicado, confira o que o Overture exige.
- O cache em disco não tem limpeza automática: versões antigas em `.cache/overture/` podem ser apagadas à mão.
- Sem CSP definida. O script inline do tema (`theme-script.tsx`) precisaria de nonce se uma for adicionada.
- O limite diário de buscas e os de tentativas de senha são por instância do servidor.
- Um cookie de sessão copiado continua válido até vencer (7 dias) ou até trocar a senha ou o `SESSION_SECRET`: não há revogação individual, porque não há banco.
- Sem teste automatizado de interface commitado: o fluxo completo foi verificado manualmente com Playwright (busca simulada + verificação real de sites), mas depende de internet e de sites de terceiros, então não entrou na suíte.
- A primeira busca em uma cidade grande leva de 35 a 45 s (consulta da cidade inteira para descobrir que ela é grande demais, mais a consulta do tipo de loja). Tentei acelerar tirando o `ORDER BY`, mas as medições variaram demais (de 4 a 33 s para a mesma consulta) para provar ganho, então não entrou. Só o tamanho do cache melhorou: uma cidade grande guarda apenas um marcador.
