# Custos

## Fonte padrão (Overture Maps): grátis

Os dados do Overture Maps são abertos e ficam num bucket público. Não há chave, conta nem cobrança. O único custo é o tráfego de internet para baixar os dados de cada cidade, uma vez por cidade e por versão. O que fica guardado em disco é pequeno (medido: Campo Mourão 1,3 MB, Maringá 6,7 MB, Curitiba 19,5 MB). O volume de rede gasto no download é maior que isso e não foi medido.

A checagem dos sites e a lista de cidades (IBGE) também são gratuitas.

## Fonte opcional (Google Places): paga

Só vale se você definir `PLACES_PROVIDER=google` (ou tiver `GOOGLE_PLACES_API_KEY` sem definir o provedor).

Cada busca chama o **Text Search (New)** em até 3 páginas (20 lojas por página, máximo de 60). Telefone, site e nota entram no grupo de campos **Enterprise**, a faixa mais cara do Text Search. O app pede só os campos que usa (ver `FIELD_MASK` em `src/lib/places/google.ts`).

Os preços e a franquia gratuita do Google mudam. Confira a tabela atual antes de usar em volume:
<https://developers.google.com/maps/billing-and-pricing/pricing>

Freios no app (só para o Google): `MAX_SEARCHES_PER_DAY` (padrão 100). No Google Cloud, defina também um teto de requisições por dia em APIs e serviços > Places API (New) > Cotas, um alerta em Faturamento > Orçamentos e alertas, e restrinja a chave à Places API.
