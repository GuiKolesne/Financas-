-- Índices que faltavam nas chaves estrangeiras.
--
-- Sem eles, toda exclusão em cascata varre a tabela filha inteira: apagar um
-- cartão precisa achar as compras parceladas dele; apagar uma categoria
-- precisa checar lançamentos, orçamentos e planos. Com poucos dados nem se
-- nota, mas isso cresce com o histórico e não tem volta fácil depois.
--
-- Os índices compostos que já existem (user_id, category_id) não servem aqui:
-- uma busca só por category_id não consegue usar um índice que começa por
-- user_id.

create index transactions_credit_card_idx
  on transactions (credit_card_id)
  where credit_card_id is not null;

create index transactions_category_idx
  on transactions (category_id);

create index installment_plans_credit_card_idx
  on installment_plans (credit_card_id);

create index installment_plans_category_idx
  on installment_plans (category_id);

create index budgets_category_idx
  on budgets (category_id);

create index import_batches_user_idx
  on import_batches (user_id);
