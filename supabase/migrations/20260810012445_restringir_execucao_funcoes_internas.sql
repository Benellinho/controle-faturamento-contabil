-- A função é utilizada somente pelo event trigger que habilita RLS.
-- Nenhuma chamada pela Data API deve ser permitida.

revoke execute
on function public.rls_auto_enable()
from public, anon, authenticated, service_role;

-- Impede que novas funções sejam executáveis por padrão.
-- Permissões futuras deverão ser concedidas explicitamente.

alter default privileges
for role postgres
in schema public
revoke execute on functions from public;

alter default privileges
for role postgres
in schema public
revoke execute on functions from anon, authenticated;