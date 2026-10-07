# Garimpo

Plataforma de prospecção para freelancers e pequenas agências que vendem serviços para empresas locais. O usuário informa o que vende e onde, e a plataforma encontra empresas, diagnostica a presença digital de cada uma e entrega a oportunidade com uma mensagem de abertura pronta.

> O nome "Garimpo" é provisório. Troque em [src/config/site.ts](src/config/site.ts).

**Status:** Fase 1 (fundação) concluída. As decisões de projeto estão em [docs/DECISOES.md](docs/DECISOES.md).

## Stack

Next.js 16 (App Router, Cache Components) · React 19 · TypeScript estrito · Tailwind CSS v4 · Supabase (Postgres, Auth, RLS) · Zod · Vitest · Playwright

## Como rodar

```bash
npm install
cp .env.example .env.local   # preencha as variáveis
npm run dev                  # http://localhost:3000
```

Sem as variáveis do Supabase o site público funciona normalmente; login e cadastro mostram um aviso.

### Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` / `npm start` | Build e servidor de produção |
| `npm run lint` | ESLint |
| `npm run typecheck` | Gera os tipos de rota e roda o TypeScript |
| `npm test` | Testes unitários (Vitest) |

## Configurar o Supabase

1. Crie um projeto em [supabase.com](https://supabase.com) e copie a **URL** e a **anon/publishable key** (Project Settings > API) para o `.env.local`.
2. Aplique a migration em [supabase/migrations/](supabase/migrations/): cole o conteúdo do arquivo no **SQL Editor** e execute, ou use `supabase db push` com o CLI.
3. Em **Authentication > URL Configuration**:
   - Site URL: `http://localhost:3000` (e a URL de produção depois).
   - Redirect URLs: adicione exatamente `http://localhost:3000/auth/callback` (sem query string; o destino pós-login vai em cookie).
   - Em produção, defina `NEXT_PUBLIC_SITE_URL` com a URL pública. Sem ela o app recusa montar os links de autenticação, para não mandar e-mails apontando para `localhost`.
4. (Opcional) **Authentication > Providers > Google**: ative e informe o Client ID e o Secret criados no Google Cloud. Sem isso o botão "Continuar com o Google" volta para o login com uma mensagem de erro.
5. Em **Authentication > Providers > Email**, decida se exige confirmação de e-mail. Com confirmação ligada, o cadastro mostra "enviamos um link"; desligada, o usuário entra direto no onboarding.

> **Confirmação de e-mail em outro aparelho (opcional):** o fluxo padrão (PKCE) só funciona no mesmo navegador em que a conta foi criada. Para funcionar em qualquer aparelho, em **Authentication > Email Templates > Confirm signup**, troque o link por `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup`. O callback já aceita os dois formatos.

> A chave `service_role` nunca vai em variável `NEXT_PUBLIC_*` e não é usada nesta fase.

## Estrutura

```
src/
  app/
    (marketing)/   landing, preços, páginas legais
    (auth)/        login e cadastro (+ server actions)
    auth/callback/ retorno do OAuth e dos links de e-mail
    onboarding/    três perguntas iniciais
    app/           painel e perfil (área autenticada)
  components/      ui/ (base), marketing/, auth/, app/
  config/          site, planos e créditos, serviços
  lib/             supabase/, auth/, validators/, phone, analysis/labels
  proxy.ts         refresh de sessão e proteção de rotas
supabase/migrations/   SQL versionado (RLS ativo)
docs/                  decisões e, nas próximas fases, custos e Google Places
```

## Segurança (resumo)

- RLS ativo em `profiles`; o cliente só lê e edita a própria linha.
- O usuário não consegue alterar plano nem créditos pelo navegador (privilégios de update por coluna).
- Toda entrada passa por Zod no servidor; o parâmetro `next` de redirecionamento só aceita caminhos internos.
- Cabeçalhos de segurança básicos em [next.config.ts](next.config.ts).
