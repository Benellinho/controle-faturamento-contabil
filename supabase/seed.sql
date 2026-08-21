-- Dados exclusivamente ficticios para desenvolvimento e testes locais.
-- Nunca adicionar dados reais de clientes neste arquivo.

INSERT INTO public.empresas (nome, cnpj)
VALUES
    ('EMPRESA EXEMPLO ALFA LTDA', '99999999000191'),
    ('EMPRESA EXEMPLO BETA LTDA', '88888888000191'),
    ('EMPRESA EXEMPLO GAMA LTDA', '77777777000191');

INSERT INTO public.categorias (empresa_id, nome)
SELECT empresa.id, categoria.nome
  FROM (
      VALUES
          ('99999999000191', 'Vendas'),
          ('88888888000191', 'Vendas'),
          ('77777777000191', 'Vendas'),
          ('77777777000191', 'Anexo III'),
          ('77777777000191', 'Anexo IV')
  ) AS categoria(cnpj, nome)
  JOIN public.empresas AS empresa ON empresa.cnpj = categoria.cnpj;
