# Garimpo

Ferramenta pessoal para achar lojas que precisam de site. Você escolhe **estado, cidade e tipo de loja**, e ela lista os estabelecimentos já classificados:

| Situação | Quando |
|---|---|
| Sem site | Nenhum site nem rede social cadastrados nos dados |
| Só rede social | O único link é Instagram, Facebook, WhatsApp, Linktree, iFood, diretório, página de agendamento ou o site da marca de uma franquia |
| Possível site | Sem site nos dados, mas um endereço montado a partir do nome responde com uma página que cita o nome **e** a cidade ou o telefone, ou que liga para a rede social da própria loja. É uma pista, não uma certeza |
| Site institucional | Órgão público (escola estadual, prefeitura): não é cliente em potencial, então não é avaliado |
| Site com problema | Domínio inexistente, conexão recusada, 404, erro 500, certificado vencido ou de outro domínio, loop de redirecionamento |
| Site lento | Mais de 4 s para começar a responder |
| Ruim no celular | Abre, mas sem a meta `viewport` |
| Verificar manualmente | O site bloqueou o teste automático ou não respondeu: **não dá para afirmar** que está fora do ar |
| Site ok | Abre normalmente |

Dá para filtrar por situação, ordenar, marcar "já entrei em contato" (fica salvo no navegador), abrir WhatsApp, mapa e site, e exportar a lista em CSV.

## Como rodar

```bash
npm install
cp .env.example .env.local   # opcional em desenvolvimento
npm run dev                  # http://localhost:3000
```

Não precisa de conta nem de chave: sem configurar nada, ele usa o Overture Maps (grátis).

## De onde vêm as lojas

**Overture Maps (padrão, grátis).** Conjunto de dados aberto de lugares que reúne fontes como Meta, Microsoft e Foursquare. Ao buscar uma cidade pela primeira vez, o app baixa os lugares dela (cerca de 20 a 40 s) e guarda em `.cache/`; depois disso, trocar o tipo de loja nessa cidade é instantâneo. Em cidades muito grandes (como Curitiba), o app consulta cada tipo de loja separadamente, então cada tipo novo leva de 10 a 40 s.

O que ele **não** tem, e o que isso significa:

- **Sem nota nem avaliações.** O cartão não mostra nota e a ordenação por nota some.
- **Não sabe se a loja fechou.** Algumas podem ter fechado. Use o link "Mapa" ou "Pesquisar" para conferir.
- **Dados mensais, não em tempo real.** A versão em uso aparece embaixo dos resultados.
- **Quase toda loja tem página no Facebook**, porque boa parte dos registros vem de lá. Por isso "Só rede social" é a situação mais comum e "Sem site" é rara. Use o filtro **"Sem site próprio"**, que junta as duas.
- **Uma loja pode ter site que não aparece nos dados.** O cartão traz um link "Pesquisar" no Google para conferir antes de abordar.

Foi medido, em Campo Mourão: o Overture tem cerca de 3.400 lugares com confiança de 0,5 ou mais (42 barbearias, 177 salões, 82 dentistas); o OpenStreetMap tinha 2 lojas de roupa. Detalhes em [docs/DECISOES.md](docs/DECISOES.md).

Licença dos dados: aberta (a maioria das fontes do tema Places usa a CDLA Permissive 2.0). Confira a licença e a atribuição atuais em [docs.overturemaps.org](https://docs.overturemaps.org/attribution/).

**Google Places (opcional, pago).** Traz nota, avaliações e site cadastrado pelo dono, mas exige conta com faturamento. Para usar, coloque `PLACES_PROVIDER=google` e a `GOOGLE_PLACES_API_KEY` no `.env.local`. Custos em [docs/CUSTOS.md](docs/CUSTOS.md).

### Senha

`APP_PASSWORD` protege a ferramenta e `SESSION_SECRET` (32+ caracteres aleatórios, gere com o comando do `.env.example`) assina o cookie de login. Sem uma das duas:

- em desenvolvimento, sem senha o login fica desligado;
- **em produção, o app recusa tudo** (falha fechada).

O login vale por 7 dias. Trocar a senha ou o `SESSION_SECRET` derruba todas as sessões abertas. Só tentativas de senha erradas contam para o bloqueio (5 por 15 min por endereço, 30 no total).

## O que dá e o que não dá para garantir

Medido em Campo Mourão (1.143 lojas de 14 tipos, 260 sites), conferindo no Chromium:

- **"Site com problema" é confiável.** O navegador não abriu nenhum dos 92 sites marcados, e 14 de 15 marcados "verificar manualmente" também não abriram. Ainda assim: confira o link antes de abordar. Houve um falso alarme provável (um site de grande marca que bloqueia robôs), e alguns "sites" eram diretórios ou páginas de plataforma, não o site da loja. Perto de **1 em cada 3 sites cadastrados estava morto**, porque os dados são antigos: a loja pode ter fechado ou ido para o Instagram.
- **"Sem site próprio" não é garantia.** O dado não conhece todos os sites. Adivinhando o domínio pelo nome em 80 lojas "sem site", cerca de 1 em cada 10 tinha site próprio. Por isso o app procura **possíveis sites** nas lojas sem site:
  - **Forte** (nome + cidade/telefone na página, ou link para a rede social da loja): a loja sai de "Sem site próprio" e vai para "Possível site".
  - **Fraca** (só o título da página bate com o nome): a loja **continua** em "Sem site próprio" e o cartão mostra um aviso. Nomes genéricos ("Bar dos Amigos", "Bella Pizza") existem em todo o Brasil e uma sugestão fraca pode ser outra empresa.
  - Em restaurantes de Campo Mourão: de 134 lojas sem site, 11 tiveram sugestão, mas **só 1 forte**. Em duas amostras espaçadas de 150 lojas sem site: 4 e 3 sugestões fortes, todas plausíveis, e 2 e 5 fracas, entre elas algumas ambíguas (uma "Igreja Metodista" que caiu no site de uma região da igreja, uma rede de farmácias). Os números variam com a amostra. A busca perde sites cujo texto na página inicial não cita cidade nem telefone (muitos geram isso com JavaScript) e nomes feitos só de palavras genéricas.
- **Lojas fechadas:** o dado não informa. Use "Mapa" e "Pesquisar".

## Limites a conhecer

- Cada busca mostra no máximo **500 lojas**; se existirem mais, o app avisa quantas são e mostra as de dados mais confiáveis. O Google, se usado, entrega no máximo 60 por busca.
- A checagem olha só a **página inicial** de cada site, a partir do servidor. Sites protegidos contra robôs (Cloudflare e similares) aparecem como "Verificar manualmente".
- A checagem roda **na região do servidor**. Se for hospedar, escolha uma região no Brasil (na Vercel, `gru1` em São Paulo); de longe, sites brasileiros ficam mais lentos e mais propensos a bloqueio.
- O Overture precisa de **disco gravável** para o cache (`.cache/`) e de um servidor Node comum. Em hospedagem serverless sem disco persistente, cada busca refaz o download. Para uso pessoal, rodar na sua máquina ou numa VPS pequena funciona melhor.
- O limite de buscas por dia (só Google) e o de tentativas de senha são por instância do servidor: valem como freio, não como garantia.

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` / `npm start` | Build e servidor de produção |
| `npm run lint` | ESLint |
| `npm run typecheck` | Tipos de rota + TypeScript |
| `npm test` | Testes (Vitest) |

## Como é feito

```
src/
  app/
    page.tsx            tela única: formulário + resultados
    entrar/             login por senha
    api/search          busca de lojas (Overture ou Google)
    api/check           checa os sites (em lotes, com proteção SSRF)
    api/cities          municípios do estado (IBGE)
  components/search/    formulário, filtros, cartão, orquestração
  lib/analysis/         classificação de URL, checagem de site, SSRF
  lib/geo/              estados, cidades e contornos (IBGE)
  lib/places/           Overture (DuckDB), Google, tipos de loja e mapeamento
  lib/access.ts         senha e sessão (HMAC)
  proxy.ts              exige login em tudo, menos /entrar
```

**Segurança:** como o servidor visita endereços digitados por terceiros no Google Maps, a checagem bloqueia loopback, redes privadas e o endereço de metadados da nuvem (169.254.169.254), revalida a cada redirecionamento e confere o IP no momento da conexão (contra DNS rebinding). Detalhes em [docs/DECISOES.md](docs/DECISOES.md).
