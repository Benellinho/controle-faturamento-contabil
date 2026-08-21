BEGIN;

ALTER TABLE public.lancamentos
    ADD COLUMN IF NOT EXISTS percentual_imposto NUMERIC(5,2) NOT NULL DEFAULT 0;

ALTER TABLE public.lancamentos
    DROP CONSTRAINT IF EXISTS lancamentos_percentual_imposto_check;

ALTER TABLE public.lancamentos
    ADD CONSTRAINT lancamentos_percentual_imposto_check
    CHECK (percentual_imposto >= 0 AND percentual_imposto <= 100);

ALTER TABLE public.lancamentos
    ALTER COLUMN percentual_imposto DROP DEFAULT;

DROP FUNCTION IF EXISTS public.substituir_lancamento_p0(
    BIGINT,
    BIGINT,
    DATE,
    NUMERIC,
    TEXT,
    TEXT
);

CREATE OR REPLACE FUNCTION public.substituir_lancamento_p0(
    p_lancamento_original_id BIGINT,
    p_categoria_id BIGINT,
    p_data_referencia DATE,
    p_valor NUMERIC(14,2),
    p_percentual_imposto NUMERIC(5,2),
    p_observacao TEXT,
    p_motivo_substituicao TEXT
)
RETURNS TABLE (
    lancamento_original_id BIGINT,
    novo_lancamento_id BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_original public.lancamentos%ROWTYPE;
    v_novo_lancamento_id BIGINT;
    v_total_atualizado INTEGER;
BEGIN
    IF p_lancamento_original_id IS NULL
        OR p_categoria_id IS NULL
        OR p_data_referencia IS NULL
        OR p_valor IS NULL
        OR p_valor <= 0
        OR p_percentual_imposto IS NULL
        OR p_percentual_imposto < 0
        OR p_percentual_imposto > 100 THEN
        RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'PARAMETROS_INVALIDOS';
    END IF;

    IF btrim(COALESCE(p_motivo_substituicao, '')) = '' THEN
        RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'MOTIVO_SUBSTITUICAO_INVALIDO';
    END IF;

    SELECT l.* INTO v_original
      FROM public.lancamentos AS l
     WHERE l.id = p_lancamento_original_id
       FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'LANCAMENTO_NAO_ENCONTRADO';
    END IF;

    IF v_original.status <> 'ATIVO' THEN
        RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'LANCAMENTO_NAO_ATIVO';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.categorias AS c
         WHERE c.id = p_categoria_id AND c.empresa_id = v_original.empresa_id
    ) THEN
        RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'CATEGORIA_NAO_PERTENCE_EMPRESA';
    END IF;

    INSERT INTO public.lancamentos (
        empresa_id, categoria_id, data_referencia, valor, percentual_imposto,
        observacao, status, substitui_lancamento_id, motivo_substituicao, substituido_em
    ) VALUES (
        v_original.empresa_id, p_categoria_id, p_data_referencia, p_valor,
        p_percentual_imposto, p_observacao, 'ATIVO', v_original.id,
        btrim(p_motivo_substituicao), NULL
    ) RETURNING id INTO v_novo_lancamento_id;

    UPDATE public.lancamentos
       SET status = 'SUBSTITUIDO', substituido_em = CURRENT_TIMESTAMP
     WHERE id = v_original.id AND status = 'ATIVO';

    GET DIAGNOSTICS v_total_atualizado = ROW_COUNT;
    IF v_total_atualizado <> 1 THEN
        RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'LANCAMENTO_NAO_ATIVO';
    END IF;

    RETURN QUERY SELECT v_original.id, v_novo_lancamento_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.criar_lancamentos_lote_p0(
    p_empresa_id BIGINT,
    p_data_referencia DATE,
    p_itens JSONB
)
RETURNS TABLE (
    id BIGINT,
    categoria_id BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF p_empresa_id IS NULL
        OR p_data_referencia IS NULL
        OR p_itens IS NULL
        OR jsonb_typeof(p_itens) <> 'array'
        OR jsonb_array_length(p_itens) = 0 THEN
        RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'PARAMETROS_INVALIDOS';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.empresas AS e WHERE e.id = p_empresa_id) THEN
        RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'EMPRESA_NAO_ENCONTRADA';
    END IF;

    IF EXISTS (
        SELECT 1
          FROM jsonb_array_elements(p_itens) AS item
         WHERE (item->>'categoria_id') IS NULL
            OR (item->>'valor') IS NULL
            OR (item->>'percentual_imposto') IS NULL
            OR (item->>'valor')::NUMERIC <= 0
            OR (item->>'percentual_imposto')::NUMERIC < 0
            OR (item->>'percentual_imposto')::NUMERIC > 100
    ) THEN
        RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'PARAMETROS_INVALIDOS';
    END IF;

    IF EXISTS (
        SELECT (item->>'categoria_id')::BIGINT
          FROM jsonb_array_elements(p_itens) AS item
         GROUP BY (item->>'categoria_id')::BIGINT
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'CATEGORIAS_DUPLICADAS';
    END IF;

    IF EXISTS (
        SELECT 1
          FROM jsonb_array_elements(p_itens) AS item
          LEFT JOIN public.categorias AS c
            ON c.id = (item->>'categoria_id')::BIGINT
           AND c.empresa_id = p_empresa_id
         WHERE c.id IS NULL
    ) OR EXISTS (
        SELECT 1
          FROM public.categorias AS c
         WHERE c.empresa_id = p_empresa_id
           AND NOT EXISTS (
               SELECT 1 FROM jsonb_array_elements(p_itens) AS item
                WHERE (item->>'categoria_id')::BIGINT = c.id
           )
    ) THEN
        RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'CATEGORIAS_INCOMPLETAS';
    END IF;

    RETURN QUERY
    INSERT INTO public.lancamentos (
        empresa_id, categoria_id, data_referencia, valor, percentual_imposto,
        observacao, status, substitui_lancamento_id, motivo_substituicao, substituido_em
    )
    SELECT
        p_empresa_id,
        (item->>'categoria_id')::BIGINT,
        p_data_referencia,
        (item->>'valor')::NUMERIC(14,2),
        (item->>'percentual_imposto')::NUMERIC(5,2),
        NULLIF(btrim(item->>'observacao'), ''),
        'ATIVO', NULL, NULL, NULL
      FROM jsonb_array_elements(p_itens) AS item
     ORDER BY (item->>'categoria_id')::BIGINT
    RETURNING lancamentos.id, lancamentos.categoria_id;
END;
$$;

REVOKE ALL ON FUNCTION public.substituir_lancamento_p0(
    BIGINT, BIGINT, DATE, NUMERIC, NUMERIC, TEXT, TEXT
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.substituir_lancamento_p0(
    BIGINT, BIGINT, DATE, NUMERIC, NUMERIC, TEXT, TEXT
) TO service_role;

REVOKE ALL ON FUNCTION public.criar_lancamentos_lote_p0(
    BIGINT, DATE, JSONB
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.criar_lancamentos_lote_p0(
    BIGINT, DATE, JSONB
) TO service_role;

COMMIT;
