-- Refaz o gatilho de cadastro para que contas novas já nasçam com a paleta
-- validada da migração 0005, em vez do arco-íris original.
--
-- A ordem dos slots não é cosmética: é o mecanismo de segurança. Os primeiros
-- slots são os mais distinguíveis entre si, então vão para as categorias que
-- mais aparecem no gráfico de pizza.

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));

  insert into public.categories (user_id, name, emoji, color, type)
  select new.id, d.nome, d.emoji, public.cor_do_slot(d.slot), 'expense'
  from (values
    ('Moradia (Aluguel/Financiamento)', '🏠',  1),
    ('Supermercado',                    '🛒',  2),
    ('Transporte (Combustível)',        '🚗',  3),
    ('Contas (Água, Luz, Gás)',         '⚡',  4),
    ('Saúde (Plano/Consultas)',         '🏥',  5),
    ('Lazer e Entretenimento',          '🎬',  6),
    ('Educação (Cursos)',               '📚',  7),
    ('Delivery & Restaurantes',         '🍔',  8),
    ('Internet e Telefone',             '📱',  9),
    ('Transporte (Manutenção)',         '🔧', 10),
    ('Transporte Público',              '🚌', 11),
    ('Medicamentos',                    '💊', 12),
    ('Livros e Materiais',              '📖', 13),
    ('Assinaturas (Streaming, etc)',    '📺', 14),
    ('Vestuário',                       '👕', 15),
    ('Beleza e Cuidados',               '💄', 16),
    ('Presentes e Doações',             '🎁', 17),
    ('Pets',                            '🐕', 18),
    ('Seguros',                         '🛡️', 19),
    ('Impostos',                        '📋', 20),
    ('Outros',                          '📌', 21)
  ) as d(nome, emoji, slot);

  insert into public.categories (user_id, name, emoji, color, type)
  select new.id, r.nome, r.emoji, public.cor_do_slot(r.slot), 'income'
  from (values
    ('Salário',                    '💼',  1),
    ('Freelance',                  '💻',  2),
    ('Investimentos (Dividendos)', '📈',  3),
    ('Aluguel Recebido',           '🏘️',  4),
    ('Vendas',                     '🛍️',  5),
    ('Investimentos (Juros)',      '💰',  6),
    ('Bônus',                      '🎉',  7),
    ('13º Salário',                '🎄',  8),
    ('Férias',                     '🏖️',  9),
    ('Prêmios',                    '🏆', 10),
    ('Outros',                     '📌', 11)
  ) as r(nome, emoji, slot);

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
