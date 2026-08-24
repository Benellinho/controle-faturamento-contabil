BEGIN;

ALTER TABLE public.lancamentos
    DROP CONSTRAINT IF EXISTS lancamentos_valor_check;

ALTER TABLE public.lancamentos
    DROP CONSTRAINT IF EXISTS lancamentos_valor_positivo_check;

ALTER TABLE public.lancamentos
    ADD CONSTRAINT lancamentos_valor_nao_negativo_check
    CHECK (valor >= 0);

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
            OR (item->>'valor')::NUMERIC < 0
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

REVOKE ALL ON FUNCTION public.criar_lancamentos_lote_p0(
    BIGINT, DATE, NUMERIC, NUMERIC, NUMERIC, NUMERIC, JSONB
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.criar_lancamentos_lote_p0(
    BIGINT, DATE, NUMERIC, NUMERIC, NUMERIC, NUMERIC, JSONB
) TO service_role;

COMMIT;
