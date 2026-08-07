-- Sem RLS, qualquer pessoa com a chave publicável leria o banco inteiro.
-- Estas políticas são a proteção real do app; a interface não é proteção.
alter table profiles          enable row level security;
alter table categories        enable row level security;
alter table credit_cards      enable row level security;
alter table installment_plans enable row level security;
alter table transactions      enable row level security;
alter table budgets           enable row level security;
alter table import_batches    enable row level security;

-- profiles se identifica por id, não por user_id.
create policy "dono cuida do proprio perfil" on profiles
  for all to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "dono cuida das proprias categorias" on categories
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "dono cuida dos proprios cartoes" on credit_cards
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "dono cuida das proprias compras parceladas" on installment_plans
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "dono cuida dos proprios lancamentos" on transactions
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "dono cuida dos proprios orcamentos" on budgets
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "dono cuida das proprias importacoes" on import_batches
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
