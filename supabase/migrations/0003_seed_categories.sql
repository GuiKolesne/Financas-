-- Ao criar a conta, o usuário já encontra o app utilizável: perfil criado e
-- as 32 categorias da planilha antiga prontas para uso.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));

  insert into public.categories (user_id, name, emoji, color, type) values
    (new.id, 'Moradia (Aluguel/Financiamento)', '🏠', '#ef4444', 'expense'),
    (new.id, 'Contas (Água, Luz, Gás)',         '⚡', '#f97316', 'expense'),
    (new.id, 'Internet e Telefone',             '📱', '#f59e0b', 'expense'),
    (new.id, 'Transporte (Combustível)',        '🚗', '#eab308', 'expense'),
    (new.id, 'Transporte (Manutenção)',         '🔧', '#84cc16', 'expense'),
    (new.id, 'Transporte Público',              '🚌', '#22c55e', 'expense'),
    (new.id, 'Supermercado',                    '🛒', '#10b981', 'expense'),
    (new.id, 'Delivery & Restaurantes',         '🍔', '#14b8a6', 'expense'),
    (new.id, 'Saúde (Plano/Consultas)',         '🏥', '#06b6d4', 'expense'),
    (new.id, 'Medicamentos',                    '💊', '#0ea5e9', 'expense'),
    (new.id, 'Educação (Cursos)',               '📚', '#3b82f6', 'expense'),
    (new.id, 'Livros e Materiais',              '📖', '#6366f1', 'expense'),
    (new.id, 'Lazer e Entretenimento',          '🎬', '#8b5cf6', 'expense'),
    (new.id, 'Assinaturas (Streaming, etc)',    '📺', '#a855f7', 'expense'),
    (new.id, 'Vestuário',                       '👕', '#d946ef', 'expense'),
    (new.id, 'Beleza e Cuidados',               '💄', '#ec4899', 'expense'),
    (new.id, 'Presentes e Doações',             '🎁', '#f43f5e', 'expense'),
    (new.id, 'Pets',                            '🐕', '#a16207', 'expense'),
    (new.id, 'Seguros',                         '🛡️', '#57534e', 'expense'),
    (new.id, 'Impostos',                        '📋', '#44403c', 'expense'),
    (new.id, 'Outros',                          '📌', '#64748b', 'expense'),
    (new.id, 'Salário',                         '💼', '#16a34a', 'income'),
    (new.id, 'Freelance',                       '💻', '#22c55e', 'income'),
    (new.id, 'Bônus',                           '🎉', '#4ade80', 'income'),
    (new.id, '13º Salário',                     '🎄', '#15803d', 'income'),
    (new.id, 'Férias',                          '🏖️', '#65a30d', 'income'),
    (new.id, 'Investimentos (Dividendos)',      '📈', '#0d9488', 'income'),
    (new.id, 'Investimentos (Juros)',           '💰', '#0891b2', 'income'),
    (new.id, 'Aluguel Recebido',                '🏘️', '#2563eb', 'income'),
    (new.id, 'Vendas',                          '🛍️', '#7c3aed', 'income'),
    (new.id, 'Prêmios',                         '🏆', '#c026d3', 'income'),
    (new.id, 'Outros',                          '📌', '#64748b', 'income');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
