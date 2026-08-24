BEGIN;

ALTER TABLE public.lancamentos
    ADD COLUMN IF NOT EXISTS tipo_lancamento VARCHAR(10) NOT NULL DEFAULT 'NORMAL';

ALTER TABLE public.lancamentos
    DROP CONSTRAINT IF EXISTS lancamentos_tipo_lancamento_check;

ALTER TABLE public.lancamentos
    ADD CONSTRAINT lancamentos_tipo_lancamento_check
    CHECK (tipo_lancamento IN ('NORMAL', 'COM_RT'));

ALTER TABLE public.lancamentos
    ALTER COLUMN tipo_lancamento DROP DEFAULT;

CREATE INDEX IF NOT EXISTS idx_lancamentos_tipo_lancamento
    ON public.lancamentos (tipo_lancamento);

DROP FUNCTION IF EXISTS public.criar_lancamentos_lote_p0(
    BIGINT, DATE, NUMERIC, NUMERIC, NUMERIC, NUMERIC, JSONB
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

    IF p_categoria_id <> v_original.categoria_id THEN
        RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'CATEGORIA_NAO_PERTENCE_EMPRESA';
    END IF;

    INSERT INTO public.lancamentos (
        empresa_id, categoria_id, tipo_lancamento, data_referencia, valor,
        percentual_imposto, observacao, status, substitui_lancamento_id,
        motivo_substituicao, substituido_em
    ) VALUES (
        v_original.empresa_id, v_original.categoria_id, v_original.tipo_lancamento,
        p_data_referencia, p_valor, p_percentual_imposto, p_observacao, 'ATIVO',
        v_original.id, btrim(p_motivo_substituicao), NULL
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
    p_estoque_inicial NUMERIC(14,2),
    p_estoque_final NUMERIC(14,2),
    p_caixa_inicial NUMERIC(14,2),
    p_caixa_final NUMERIC(14,2),
    p_itens JSONB
)
RETURNS TABLE (
    id BIGINT,
    categoria_id BIGINT,
    tipo_lancamento VARCHAR(10)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF p_empresa_id IS NULL
        OR p_data_referencia IS NULL
        OR p_estoque_inicial IS NULL OR p_estoque_inicial < 0
        OR p_estoque_final IS NULL OR p_estoque_final < 0
        OR p_caixa_inicial IS NULL OR p_caixa_inicial < 0
        OR p_caixa_final IS NULL OR p_caixa_final < 0
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
            OR (item->>'tipo_lancamento') IS NULL
            OR (item->>'tipo_lancamento') NOT IN ('NORMAL', 'COM_RT')
            OR (item->>'valor') IS NULL
            OR (item->>'percentual_imposto') IS NULL
            OR (item->>'valor')::NUMERIC <= 0
            OR (item->>'percentual_imposto')::NUMERIC < 0
            OR (item->>'percentual_imposto')::NUMERIC > 100
    ) THEN
        RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'PARAMETROS_INVALIDOS';
    END IF;

    IF EXISTS (
        SELECT (item->>'categoria_id')::BIGINT, item->>'tipo_lancamento'
          FROM jsonb_array_elements(p_itens) AS item
         GROUP BY (item->>'categoria_id')::BIGINT, item->>'tipo_lancamento'
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'CAMPOS_CATEGORIA_DUPLICADOS';
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
         CROSS JOIN (VALUES ('NORMAL'), ('COM_RT')) AS tipo(nome)
         WHERE c.empresa_id = p_empresa_id
           AND NOT EXISTS (
               SELECT 1
                 FROM jsonb_array_elements(p_itens) AS item
                WHERE (item->>'categoria_id')::BIGINT = c.id
                  AND item->>'tipo_lancamento' = tipo.nome
           )
    ) THEN
        RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'CATEGORIAS_INCOMPLETAS';
    END IF;

    RETURN QUERY
    INSERT INTO public.lancamentos (
        empresa_id, categoria_id, tipo_lancamento, data_referencia, valor,
        percentual_imposto, estoque_inicial, estoque_final, caixa_inicial,
        caixa_final, observacao, status, substitui_lancamento_id,
        motivo_substituicao, substituido_em
    )
    SELECT
        p_empresa_id,
        (item->>'categoria_id')::BIGINT,
        item->>'tipo_lancamento',
        p_data_referencia,
        (item->>'valor')::NUMERIC(14,2),
        (item->>'percentual_imposto')::NUMERIC(5,2),
        p_estoque_inicial, p_estoque_final, p_caixa_inicial, p_caixa_final,
        NULLIF(btrim(item->>'observacao'), ''),
        'ATIVO', NULL, NULL, NULL
      FROM jsonb_array_elements(p_itens) AS item
     ORDER BY (item->>'categoria_id')::BIGINT, item->>'tipo_lancamento'
    RETURNING lancamentos.id, lancamentos.categoria_id, lancamentos.tipo_lancamento;
END;
$$;

REVOKE ALL ON FUNCTION public.substituir_lancamento_p0(
    BIGINT, BIGINT, DATE, NUMERIC, NUMERIC, TEXT, TEXT
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.substituir_lancamento_p0(
    BIGINT, BIGINT, DATE, NUMERIC, NUMERIC, TEXT, TEXT
) TO service_role;

REVOKE ALL ON FUNCTION public.criar_lancamentos_lote_p0(
    BIGINT, DATE, NUMERIC, NUMERIC, NUMERIC, NUMERIC, JSONB
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.criar_lancamentos_lote_p0(
    BIGINT, DATE, NUMERIC, NUMERIC, NUMERIC, NUMERIC, JSONB
) TO service_role;

COMMIT;
