# Garimpo

Ferramenta para achar lojas que precisam de site. Você escolhe **estado, cidade e tipo de loja** e ela lista os estabelecimentos já classificados: sem site, só com rede social, com site quebrado, lento ou ruim no celular.

Repositório: <https://github.com/Davidson6666/q-frio-colega>

---

# <ins>**COMO COLOCAR PRA RODAR NA SUA MÁQUINA**</ins>

> **Leia só esta parte primeiro.** Com isso o projeto já abre no seu computador. O resto do arquivo é para quem vai usar a fundo ou publicar.

## <ins>**1) O QUE INSTALAR (só uma vez)**</ins>

| Programa | Para quê | Onde baixar | Como conferir que instalou |
|---|---|---|---|
| **Node.js** (versão <ins>**20.9 ou mais nova**</ins>; a versão **LTS** do site serve) | roda o projeto | <https://nodejs.org> | `node --version` |
| **Git** | baixa o projeto | <https://git-scm.com/downloads> | `git --version` |

**Só isso.** Não precisa de conta, de chave, de banco de dados nem de Docker.

Depois de instalar, <ins>**feche e abra o terminal de novo**</ins> (senão ele não enxerga os programas novos).

## <ins>**2) OS COMANDOS (copie e cole no terminal)**</ins>

Abra o terminal: no **Windows**, o **PowerShell**; no **Mac/Linux**, o **Terminal**. Cole os quatro comandos, <ins>**um de cada vez**</ins>, esperando cada um terminar:

```bash
git clone https://github.com/Davidson6666/q-frio-colega.git
cd q-frio-colega
npm install
npm run dev
```

Quando aparecer algo como `Ready`, abra no navegador: <ins>**http://localhost:3000**</ins>

## <ins>**3) O QUE ESPERAR**</ins>

- O <ins>**`npm install`**</ins> demora de 1 a alguns minutos na primeira vez. É normal.
- Depois do <ins>**`npm run dev`**</ins> o terminal fica "preso" mostrando mensagens. **É assim mesmo**: é o servidor rodando. Deixe essa janela aberta enquanto usa.
- <ins>**Precisa de internet**</ins>: a primeira busca em cada cidade baixa os dados dela e leva de 20 a 40 segundos. Depois é rápido.
- No seu computador <ins>**não pede senha**</ins>.

## <ins>**4) NO DIA A DIA**</ins>

| Quero... | Comando |
|---|---|
| **Parar** o programa | `Ctrl + C` no terminal |
| **Abrir de novo** outro dia | `cd q-frio-colega` e depois `npm run dev` |
| **Atualizar** para a versão mais nova | `git pull` e depois `npm install` |
| **Rodar os testes** | `npm test` |

## <ins>**SE DER ERRO**</ins>

- **`node` ou `npm` "não é reconhecido"**: feche e abra o terminal. Se continuar, instale o Node de novo.
- **`git` "não é reconhecido"**: instale o Git e abra o terminal de novo.
- **Erro estranho no `npm install`**: rode `node --version` e confira se é **20.9 ou mais nova**.
- **A porta 3000 está ocupada**: o terminal avisa e usa outra. Abra o endereço que ele mostrar.
- **Aparece "Não foi possível baixar os dados"**: confira a internet e tente de novo.

### Para servir com senha (como em produção)

Em vez de `npm run dev`, use `npm run build` e depois `npm start`, com as variáveis `APP_PASSWORD` e `SESSION_SECRET` definidas (veja [as variáveis](#variáveis-de-ambiente)). Sem elas, o app recusa tudo nesse modo.

---

**Neste arquivo, mais abaixo:** [Como usar](#como-usar) · [Publicar na Vercel](#publicar-na-vercel) · [Variáveis de ambiente](#variáveis-de-ambiente) · [Como adicionar coisas](#como-adicionar-coisas) · [O que dá e o que não dá para garantir](#o-que-dá-e-o-que-não-dá-para-garantir) · [Limites](#limites-a-conhecer)

---

## Como usar

1. Abra o endereço e entre com a senha (peça para quem publicou).
2. Escolha o **estado**. A lista de **cidades** aparece sozinha, em ordem alfabética (dá para digitar a inicial para pular).
3. Escolha o **tipo de loja** na lista de sugestões (barbearia, salão de beleza, restaurante...). Se digitar outra coisa, a busca procura no nome da loja.
4. Clique em **Buscar lojas**. A **primeira busca em cada cidade leva de 20 a 40 segundos**; depois disso, trocar o tipo de loja na mesma cidade é instantâneo.
5. Use os filtros por situação. O mais útil costuma ser **"Sem site próprio"**, que junta quem não tem nada e quem só tem rede social.
6. Em cada cartão há WhatsApp, mapa, rede social, site e o botão **Pesquisar** (busca a loja no Google). Marque **"Já entrei em contato"** para não repetir (fica salvo só no seu navegador).
7. **Exportar CSV** baixa a lista filtrada (abre direto no Excel).

### O que cada situação significa

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

**Regra de ouro: confira antes de abordar.** Os dados são antigos e podem estar errados. Veja [o que dá e o que não dá para garantir](#o-que-dá-e-o-que-não-dá-para-garantir).

---

## Publicar na Vercel

> **Atenção: ainda não foi testado na Vercel.** O app foi desenvolvido e verificado rodando em uma máquina com Node comum. Veja [o que provavelmente vai dar problema](#o-que-provavelmente-vai-dar-problema-na-vercel) antes de contar com isso.

### Passo a passo

Os nomes dos menus da Vercel mudam de vez em quando, então use isto como roteiro, não como cópia exata.

1. Entre em [vercel.com](https://vercel.com) com a conta do GitHub e clique em **Add New > Project**.
2. Escolha o repositório `Davidson6666/q-frio-colega`. Se ele for privado, autorize a Vercel a ver esse repositório quando ela pedir.
3. O framework (**Next.js**) é detectado sozinho. Não mude os comandos de build.
4. Antes de clicar em **Deploy**, abra **Environment Variables** e crie as duas variáveis abaixo (valem para Production e Preview):
   - `APP_PASSWORD`: a senha que todos vão usar para entrar.
   - `SESSION_SECRET`: um texto aleatório de 32+ caracteres. Gere com:
     ```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
     ```
5. Clique em **Deploy**.
6. Depois do primeiro deploy, em **Settings > Functions**, escolha a região **São Paulo (`gru1`)** e faça um novo deploy. Os sites brasileiros respondem melhor e bloqueiam menos a partir dela.
7. Abra o endereço, entre com a senha e faça uma busca.

**Sem `APP_PASSWORD` e `SESSION_SECRET` o app recusa tudo** em produção. É de propósito: sem senha qualquer pessoa na internet poderia usar a ferramenta.

### O que provavelmente vai dar problema na Vercel

Na Vercel o disco do servidor é somente leitura (exceto a pasta temporária `/tmp`). O app foi escrito supondo disco gravável:

1. **O DuckDB instala uma extensão (`httpfs`) na pasta do usuário.** Isso provavelmente falha lá, e aí **toda busca devolve "Não foi possível baixar os dados do Overture Maps"**. É o problema mais provável.
2. **O cache de cidades (`.cache/`) não consegue gravar.** O app ignora o erro, então até funcionaria, mas **toda busca refaria o download** (20 a 45 s) e ninguém aproveitaria a busca do outro.
3. **Limite de tempo das funções.** As buscas pedem até 300 s. Quem manda é o limite do plano da Vercel: confira antes.

Se for o caso, avise quem mantém o projeto. A correção prevista é apontar a extensão e o cache para `/tmp` e, para os colegas dividirem o cache, usar um armazenamento compartilhado (por exemplo o Vercel Blob). Isso não pôde ser testado sem um deploy real.

**Alternativa que funciona com certeza:** rodar numa máquina com Node comum (um PC que fique ligado, ou uma VPS pequena) com `npm run build && npm start` e as mesmas variáveis. Lá o disco é gravável e o cache persiste.

---

## Variáveis de ambiente

Crie um arquivo `.env.local` (para rodar na máquina) ou cadastre na Vercel. O arquivo `.env.example` tem todas, com explicação. **Nunca commite o `.env.local`** (já está no `.gitignore`).

| Variável | Para quê | Obrigatória? |
|---|---|---|
| `APP_PASSWORD` | Senha de entrada | **Sim em produção.** Em desenvolvimento, vazia = sem login |
| `SESSION_SECRET` | Assina o cookie de login (32+ caracteres aleatórios) | **Sim em produção** |
| `PLACES_PROVIDER` | `overture` (padrão, grátis) ou `google` | Não |
| `GOOGLE_PLACES_API_KEY` | Só se usar `PLACES_PROVIDER=google` (exige conta Google Cloud com faturamento) | Não |
| `OVERTURE_RELEASE` | Fixa uma versão dos dados (formato `2026-09-23.1`). Vazia = sempre a mais recente | Não |
| `MAX_SEARCHES_PER_DAY` | Teto de buscas por dia, só para o Google (padrão 100) | Não |

O login vale por 7 dias. Trocar a senha ou o `SESSION_SECRET` derruba todas as sessões abertas. Só tentativas de senha **erradas** contam para o bloqueio (5 por 15 min por endereço, 30 no total).

---

## Como adicionar coisas

Antes de enviar qualquer mudança, rode:

```bash
npm run typecheck && npm run lint && npm test
```

Trabalhe numa branch e abra um pull request, em vez de mexer direto na `main`.

### Um tipo de loja novo

Edite `src/lib/places/niches.ts` e acrescente uma entrada:

```ts
{ label: "Tatuagem e piercing", aliases: ["tatuagem", "estudio de tatuagem"], categories: ["tattoo_and_piercing"] },
```

- `categories` são ids de categoria do **Overture Maps** (em inglês), não texto livre. A lista está em [docs.overturemaps.org](https://docs.overturemaps.org/).
- **Só coloque ids que você confirmou.** Um id errado não dá erro: simplesmente não acha nada. Por exemplo, `florist` não trouxe nenhum lugar em Campo Mourão. Faça uma busca numa cidade média e veja quantos resultados o tipo traz antes de enviar. O exemplo acima (`tattoo_and_piercing`) foi confirmado: 11 lugares em Campo Mourão.
- Escreva os apelidos sem acento e em minúsculas; o app ignora acentos e maiúsculas ao comparar.
- Um mesmo nome ou apelido não pode aparecer em dois tipos (há um teste para isso).
- Quando não está na lista, o app procura o texto digitado no nome da loja.

### Uma marca ou plataforma que não deve contar como "site da loja"

Em `src/lib/analysis/classify-url.ts`:

- `BRAND_HOSTS`: sites de grandes marcas e bancos. Uma franquia que só lista o site da marca conta como **sem site próprio**.
- `SOCIAL_HOSTS`: redes sociais, páginas de agendamento, diretórios e construtores de página.
- Sites de governo (`.gov.br`, `.jus.br`...) já são "institucionais" automaticamente.

Acrescente o domínio e um caso em `classify-url.test.ts`.

### Trocar o nome do produto

`src/config/site.ts`.

### Usar o Google em vez do Overture

Defina `PLACES_PROVIDER=google` e a `GOOGLE_PLACES_API_KEY`. Traz nota e avaliações, mas é pago. Custos em [docs/CUSTOS.md](docs/CUSTOS.md).

---

## O que dá e o que não dá para garantir

Medido em Campo Mourão (1.143 lojas de 14 tipos, 260 sites), conferindo no Chromium:

- **"Site com problema" é confiável.** O navegador não abriu nenhum dos 92 sites marcados, e 14 de 15 marcados "verificar manualmente" também não abriram. Ainda assim, confira o link antes de abordar. Houve um falso alarme provável (um site de grande marca que bloqueia robôs), e alguns "sites" eram diretórios ou páginas de plataforma, não o site da loja. Perto de **1 em cada 3 sites cadastrados estava morto**, porque os dados são antigos: a loja pode ter fechado ou ido para o Instagram.
- **"Sem site próprio" não é garantia.** O dado não conhece todos os sites. Adivinhando o domínio pelo nome em 80 lojas "sem site", cerca de 1 em cada 10 tinha site próprio. Por isso o app procura **possíveis sites** nas lojas sem site:
  - **Forte** (nome + cidade/telefone na página, ou link para a rede social da loja): a loja sai de "Sem site próprio" e vai para "Possível site".
  - **Fraca** (só o título da página bate com o nome): a loja **continua** em "Sem site próprio" e o cartão mostra um aviso. Nomes genéricos ("Bar dos Amigos", "Bella Pizza") existem em todo o Brasil e uma sugestão fraca pode ser outra empresa.
  - Em duas amostras espaçadas de 150 lojas sem site: 4 e 3 sugestões fortes, todas plausíveis, e 2 e 5 fracas, entre elas algumas ambíguas. Os números variam com a amostra. A busca perde sites cujo texto na página inicial não cita cidade nem telefone (muitos geram isso com JavaScript) e nomes feitos só de palavras genéricas.
- **Lojas fechadas:** o dado não informa. Use "Mapa" e "Pesquisar".

### De onde vêm as lojas

**Overture Maps** (padrão, grátis): conjunto de dados aberto de lugares que reúne fontes como Meta, Microsoft e Foursquare, atualizado todo mês. Não tem nota nem avaliações. Quase toda loja tem página no Facebook, porque boa parte dos registros vem de lá, então "Só rede social" é a situação mais comum e "Sem site" é rara. A licença dos dados é aberta (a maioria das fontes usa a CDLA Permissive 2.0); confira a atribuição atual em [docs.overturemaps.org](https://docs.overturemaps.org/attribution/).

Foi o que sobrou depois de medir: o OpenStreetMap tinha 2 lojas de roupa em Campo Mourão contra cerca de 3.400 lugares no Overture. Detalhes em [docs/DECISOES.md](docs/DECISOES.md).

---

## Limites a conhecer

- Cada busca mostra no máximo **500 lojas**; se existirem mais, o app avisa quantas são e mostra as de dados mais confiáveis. O Google, se usado, entrega no máximo 60 por busca.
- Em cidades muito grandes (como Curitiba), cada tipo de loja novo leva de 10 a 40 s, em vez de ser instantâneo.
- A checagem olha só a **página inicial** de cada site, a partir do servidor. Sites protegidos contra robôs (Cloudflare e similares) aparecem como "Verificar manualmente".
- A checagem roda **na região do servidor**. De longe, sites brasileiros ficam mais lentos e mais propensos a bloqueio.
- O limite de buscas por dia (só Google) e o de tentativas de senha são por instância do servidor: valem como freio, não como garantia.
- Todo mundo usa a mesma senha, e não há contas nem banco de dados. "Já entrei em contato" é guardado no navegador de cada pessoa, não é compartilhado.

---

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
    api/guess           procura possíveis sites das lojas sem site
    api/cities          municípios do estado (IBGE)
  components/search/    formulário, filtros, cartão, orquestração
  lib/analysis/         classificação de URL, checagem de site, SSRF, possível site
  lib/geo/              estados, cidades e contornos (IBGE)
  lib/places/           Overture (DuckDB), Google, tipos de loja e mapeamento
  lib/access.ts         senha e sessão (HMAC)
  proxy.ts              exige login em tudo, menos /entrar
docs/
  DECISOES.md           por que cada escolha foi feita, com os números medidos
  CUSTOS.md             custos (Overture grátis; Google pago)
```

**Segurança:** como o servidor visita endereços digitados por terceiros nos dados, a checagem bloqueia loopback, redes privadas e o endereço de metadados da nuvem (169.254.169.254), revalida a cada redirecionamento e confere o IP no momento da conexão (contra DNS rebinding). Detalhes em [docs/DECISOES.md](docs/DECISOES.md).
