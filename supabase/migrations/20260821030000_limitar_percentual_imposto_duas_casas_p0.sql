BEGIN;

ALTER TABLE public.lancamentos
    ALTER COLUMN percentual_imposto TYPE NUMERIC(5,2)
    USING ROUND(percentual_imposto, 2);

COMMIT;
