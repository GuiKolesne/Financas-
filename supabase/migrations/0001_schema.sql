-- Tipos do domínio.
create type transaction_type as enum ('income', 'expense');
create type payment_method as enum ('pix', 'debit', 'cash', 'credit');
create type import_source as enum ('notification', 'ofx', 'csv');
create type import_status as enum ('pending', 'confirmed', 'discarded');

-- Mantém updated_at em dia sem depender do código da aplicação.
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null default '',
  currency text not null default 'BRL',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  emoji text not null default '',
  color text not null default '#64748b',
  type transaction_type not null,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index categories_user_type_idx on categories (user_id, type) where not is_archived;

create table credit_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  nickname text not null,
  brand text not null default '',
  limit_cents integer not null default 0 check (limit_cents >= 0),
  closing_day smallint not null check (closing_day between 1 and 31),
  due_day smallint not null check (due_day between 1 and 31),
  color text not null default '#7c3aed',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index credit_cards_user_idx on credit_cards (user_id);

-- A "compra-mãe" de um parcelamento. Apagar aqui apaga as parcelas filhas.
create table installment_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  description text not null default '',
  total_cents integer not null check (total_cents >= 0),
  installments_count smallint not null check (installments_count between 1 and 60),
  purchase_date date not null,
  credit_card_id uuid not null references credit_cards on delete cascade,
  category_id uuid not null references categories on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index installment_plans_user_idx on installment_plans (user_id);

create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  -- Data de competência. Para parcelas, é o vencimento da fatura.
  date date not null,
  -- Sempre positivo: o sinal vem da coluna type.
  amount_cents integer not null check (amount_cents >= 0),
  type transaction_type not null,
  category_id uuid not null references categories on delete restrict,
  description text not null default '',
  payment_method payment_method not null default 'pix',
  credit_card_id uuid references credit_cards on delete set null,
  installment_plan_id uuid references installment_plans on delete cascade,
  installment_number smallint check (installment_number is null or installment_number >= 1),
  is_recurring boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Pagamento no crédito exige dizer qual cartão.
  constraint credito_exige_cartao
    check (payment_method <> 'credit' or credit_card_id is not null),
  -- Ou é parcela (tem plano e número) ou não é nenhum dos dois.
  constraint parcela_tem_plano_e_numero
    check ((installment_plan_id is null) = (installment_number is null))
);
create index transactions_user_date_idx on transactions (user_id, date desc);
create index transactions_user_category_idx on transactions (user_id, category_id);
create index transactions_plan_idx on transactions (installment_plan_id)
  where installment_plan_id is not null;

create table budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  category_id uuid not null references categories on delete cascade,
  -- Sempre o primeiro dia do mês.
  month date not null,
  limit_cents integer not null check (limit_cents >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint mes_e_dia_primeiro check (extract(day from month) = 1),
  unique (user_id, category_id, month)
);
create index budgets_user_month_idx on budgets (user_id, month);

-- Criada agora, usada só na Fase 2 (leitor de notificações e OFX/CSV).
create table import_batches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  source import_source not null,
  raw_input text not null default '',
  status import_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at before update on profiles
  for each row execute function set_updated_at();
create trigger categories_updated_at before update on categories
  for each row execute function set_updated_at();
create trigger credit_cards_updated_at before update on credit_cards
  for each row execute function set_updated_at();
create trigger installment_plans_updated_at before update on installment_plans
  for each row execute function set_updated_at();
create trigger transactions_updated_at before update on transactions
  for each row execute function set_updated_at();
create trigger budgets_updated_at before update on budgets
  for each row execute function set_updated_at();
create trigger import_batches_updated_at before update on import_batches
  for each row execute function set_updated_at();
