-- Correção dos avisos do linter de segurança do Supabase.
--
-- 1) `set_updated_at` ficava com search_path mutável: alguém com permissão de
--    criar objetos poderia sequestrar um nome de função dentro dela.
-- 2) `handle_new_user` é SECURITY DEFINER (precisa ser, para escrever em
--    public.* durante o cadastro), mas estava exposta em /rest/v1/rpc/ para
--    anon e authenticated. Ela só deve rodar pelo gatilho em auth.users.

create or replace function set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Ninguém chama estas funções pela API. O gatilho continua funcionando porque
-- gatilhos rodam com o privilégio do dono da tabela, não do chamador.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
