-- Recolore as categorias com uma paleta categórica validada.
--
-- Por quê: a paleta original era um arco-íris (vermelho → laranja → âmbar →
-- amarelo → ...). Categorias vizinhas ficavam com cores quase iguais. O
-- validador reprovou o par Moradia (#ef4444) × Contas (#f97316) com ΔE 10,4,
-- abaixo do piso de 15 — difíceis de distinguir mesmo com visão de cores
-- normal, e piores ainda para daltônicos. São justamente duas das categorias
-- que mais aparecem juntas no gráfico de pizza.
--
-- Estas 8 cores passam em todos os testes (banda de luminosidade, piso de
-- croma, separação sob daltonismo, piso de visão normal e contraste) tanto no
-- fundo claro quanto no escuro — o banco guarda uma cor só, então ela precisa
-- funcionar nos dois.
--
-- Ordem importa: os primeiros slots são os mais seguros entre si, então vão
-- para as categorias que mais aparecem no gráfico.

create or replace function cor_do_slot(slot integer)
returns text
language sql
immutable
set search_path = ''
as $$
  select (array[
    '#2a78d6',  -- 1 azul
    '#d95926',  -- 2 laranja
    '#1baf7a',  -- 3 verde-água
    '#c98500',  -- 4 amarelo
    '#d55181',  -- 5 magenta
    '#008300',  -- 6 verde
    '#9085e9',  -- 7 violeta
    '#e34948'   -- 8 vermelho
  ])[((slot - 1) % 8) + 1];
$$;

-- Despesas, na ordem em que costumam pesar no orçamento.
with ordem as (
  select * from (values
    ('Moradia (Aluguel/Financiamento)', 1),
    ('Supermercado',                    2),
    ('Transporte (Combustível)',        3),
    ('Contas (Água, Luz, Gás)',         4),
    ('Saúde (Plano/Consultas)',         5),
    ('Lazer e Entretenimento',          6),
    ('Educação (Cursos)',               7),
    ('Delivery & Restaurantes',         8),
    ('Internet e Telefone',             9),
    ('Transporte (Manutenção)',        10),
    ('Transporte Público',             11),
    ('Medicamentos',                   12),
    ('Livros e Materiais',             13),
    ('Assinaturas (Streaming, etc)',   14),
    ('Vestuário',                      15),
    ('Beleza e Cuidados',              16),
    ('Presentes e Doações',            17),
    ('Pets',                           18),
    ('Seguros',                        19),
    ('Impostos',                       20),
    ('Outros',                         21)
  ) as t(nome, slot)
)
update categories c
set color = cor_do_slot(o.slot)
from ordem o
where c.name = o.nome and c.type = 'expense';

-- Receitas seguem a mesma paleta, começando de novo no slot 1.
with ordem as (
  select * from (values
    ('Salário',                    1),
    ('Freelance',                  2),
    ('Investimentos (Dividendos)', 3),
    ('Aluguel Recebido',           4),
    ('Vendas',                     5),
    ('Investimentos (Juros)',      6),
    ('Bônus',                      7),
    ('13º Salário',                8),
    ('Férias',                     9),
    ('Prêmios',                   10),
    ('Outros',                    11)
  ) as t(nome, slot)
)
update categories c
set color = cor_do_slot(o.slot)
from ordem o
where c.name = o.nome and c.type = 'income';

revoke execute on function public.cor_do_slot(integer) from public, anon, authenticated;
