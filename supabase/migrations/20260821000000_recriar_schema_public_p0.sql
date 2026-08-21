-- ATENCAO: migration destrutiva do P0.
-- Remove todos os objetos atuais do schema public e recria somente o modelo P0.
-- Os schemas internos do Supabase, como auth, storage e extensions, nao sao removidos.

BEGIN;

DROP SCHEMA IF EXISTS public CASCADE;

CREATE SCHEMA public AUTHORIZATION postgres;

COMMENT ON SCHEMA public IS 'Schema do prototipo P0 de lancamentos e substituicoes';

-- Evita acesso direto pelas chaves anon e authenticated.
-- O P0 acessa o banco exclusivamente pelo backend usando service_role.
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

CREATE TABLE public.empresas (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    cnpj CHAR(14) NOT NULL UNIQUE
        CHECK (cnpj ~ '^[0-9]{14}$')
);

CREATE TABLE public.categorias (
    id BIGSERIAL PRIMARY KEY,
    empresa_id BIGINT NOT NULL
        REFERENCES public.empresas(id),
    nome VARCHAR(100) NOT NULL
);

CREATE TABLE public.lancamentos (
    id BIGSERIAL PRIMARY KEY,
    empresa_id BIGINT NOT NULL
        REFERENCES public.empresas(id),
    categoria_id BIGINT NOT NULL
        REFERENCES public.categorias(id),
    data_referencia DATE NOT NULL
        CONSTRAINT lancamentos_data_referencia_primeiro_dia_check
        CHECK (EXTRACT(DAY FROM data_referencia) = 1),
    valor NUMERIC(14,2) NOT NULL
        CHECK (valor > 0),
    percentual_imposto NUMERIC(5,2) NOT NULL
        CHECK (percentual_imposto >= 0 AND percentual_imposto <= 100),
    observacao TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ATIVO'
        CHECK (status IN ('ATIVO', 'SUBSTITUIDO')),
    substitui_lancamento_id BIGINT
        REFERENCES public.lancamentos(id),
    motivo_substituicao TEXT,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    substituido_em TIMESTAMP
);

CREATE INDEX idx_categorias_empresa_id
    ON public.categorias (empresa_id);

CREATE INDEX idx_lancamentos_empresa_id
    ON public.lancamentos (empresa_id);

CREATE INDEX idx_lancamentos_categoria_id
    ON public.lancamentos (categoria_id);

CREATE INDEX idx_lancamentos_data_referencia
    ON public.lancamentos (data_referencia);

CREATE INDEX idx_lancamentos_status
    ON public.lancamentos (status);

CREATE INDEX idx_lancamentos_substitui_id
    ON public.lancamentos (substitui_lancamento_id);

-- O backend usa a service_role. Nenhuma tabela fica acessivel diretamente
-- para anon ou authenticated durante o P0.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Mantem o mesmo comportamento caso novas tabelas ou sequencias sejam
-- criadas pelo papel postgres durante o P0.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
    REVOKE ALL ON TABLES FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
    REVOKE ALL ON SEQUENCES FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
    GRANT ALL ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
    GRANT ALL ON SEQUENCES TO service_role;

COMMIT;
