# Garimpo

Ferramenta pessoal para achar lojas que precisam de site. Você escolhe **estado, cidade e tipo de loja**, e ela lista os estabelecimentos já classificados:

| Situação | Quando |
|---|---|
| Sem site | O Google não tem site cadastrado para a loja |
| Só rede social | O link é Instagram, Facebook, WhatsApp, Linktree, iFood etc. |
| Site com problema | Domínio inexistente, conexão recusada, 404, erro 500, certificado vencido ou de outro domínio, loop de redirecionamento |
| Site lento | Mais de 4 s para começar a responder |
| Ruim no celular | Abre, mas sem a meta `viewport` |
| Verificar manualmente | O site bloqueou o teste automático ou não respondeu: **não dá para afirmar** que está fora do ar |
| Site ok | Abre normalmente |

Dá para filtrar por situação, ordenar, marcar "já entrei em contato" (fica salvo no navegador), abrir WhatsApp, mapa e site, e exportar a lista em CSV.

## Como rodar

```bash
npm install
cp .env.example .env.local   # preencha GOOGLE_PLACES_API_KEY e APP_PASSWORD
npm run dev                  # http://localhost:3000
```

### Chave do Google

1. No [Google Cloud](https://console.cloud.google.com), crie um projeto e **ative a cobrança**.
2. Ative a **Places API (New)**.
3. Crie uma chave de API (restrinja à Places API) e cole em `GOOGLE_PLACES_API_KEY`.

A chave fica só no servidor e nunca vai para o navegador. Veja os custos em [docs/CUSTOS.md](docs/CUSTOS.md).

### Senha

`APP_PASSWORD` protege a ferramenta, porque cada busca gasta sua chave do Google. `SESSION_SECRET` (32+ caracteres aleatórios, gere com o comando do `.env.example`) assina o cookie de login. Sem uma das duas:

- em desenvolvimento, sem senha o login fica desligado;
- **em produção, o app recusa tudo** (falha fechada).

O login vale por 7 dias. Trocar a senha ou o `SESSION_SECRET` derruba todas as sessões abertas. Só tentativas de senha erradas contam para o bloqueio (5 por 15 min por endereço, 30 no total).

## Limites a conhecer

- O Google entrega **no máximo 60 lojas por busca**. Para cobrir mais, varie o tipo de loja ("barbearia", "salão de beleza") ou busque cidades vizinhas.
- A checagem olha só a **página inicial** de cada site, a partir do servidor. Sites protegidos contra robôs (Cloudflare e similares) aparecem como "Verificar manualmente".
- A checagem roda **na região do servidor**. Se for hospedar, escolha uma região no Brasil (na Vercel, `gru1` em São Paulo); de longe, sites brasileiros ficam mais lentos e mais propensos a bloqueio.
- O limite diário de buscas (`MAX_SEARCHES_PER_DAY`) e o de tentativas de senha são por instância do servidor. Em hospedagem serverless valem como freio, não como garantia.

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
    api/search          busca no Google Places
    api/check           checa os sites (em lotes, com proteção SSRF)
    api/cities          municípios do estado (IBGE)
  components/search/    formulário, filtros, cartão, orquestração
  lib/analysis/         classificação de URL, checagem de site, SSRF
  lib/places/           cliente do Google Places e filtro por cidade
  lib/access.ts         senha e sessão (HMAC)
  proxy.ts              exige login em tudo, menos /entrar
```

**Segurança:** como o servidor visita endereços digitados por terceiros no Google Maps, a checagem bloqueia loopback, redes privadas e o endereço de metadados da nuvem (169.254.169.254), revalida a cada redirecionamento e confere o IP no momento da conexão (contra DNS rebinding). Detalhes em [docs/DECISOES.md](docs/DECISOES.md).
