BEGIN;

UPDATE public.lancamentos
   SET data_referencia = date_trunc('month', data_referencia)::DATE
 WHERE EXTRACT(DAY FROM data_referencia) <> 1;

ALTER TABLE public.lancamentos
    DROP CONSTRAINT IF EXISTS lancamentos_data_referencia_primeiro_dia_check;

ALTER TABLE public.lancamentos
    ADD CONSTRAINT lancamentos_data_referencia_primeiro_dia_check
    CHECK (EXTRACT(DAY FROM data_referencia) = 1);

COMMIT;
