# Custos

O único custo variável é o Google Places. O resto (IBGE para a lista de cidades, a checagem de sites) é gratuito.

## Quanto custa uma busca

Cada busca chama o **Text Search (New)** em até 3 páginas (20 lojas por página, máximo de 60). Telefone, site e nota entram no grupo de campos **Enterprise**, que é a faixa mais cara do Text Search. O app pede só os campos que usa (ver `FIELD_MASK` em `src/lib/places/google.ts`).

Os preços e a franquia gratuita mensal do Google mudam. Confira a tabela atual antes de usar em volume:
<https://developers.google.com/maps/billing-and-pricing/pricing>

Conta de cabeça: uma busca de 60 lojas = 3 requisições Enterprise.

## Freios no app

- `MAX_SEARCHES_PER_DAY` (padrão 100): teto de buscas por dia, por instância do servidor.
- Senha obrigatória em produção, para ninguém mais gastar sua chave.

## Freios que você deve configurar no Google Cloud

O limite do app não substitui o do Google. No console, em **APIs e serviços > Places API (New) > Cotas**, defina um teto diário de requisições, e em **Faturamento > Orçamentos e alertas** crie um alerta de gasto. Restrinja também a chave de API à Places API.
