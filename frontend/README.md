# Frontend

Interface web do Controle de Faturamento Contábil, criada com React e Vite.

## Configuração

Copie `.env.example` para `.env` e preencha os dados públicos do projeto Supabase. A chave `service_role` nunca deve ser usada no frontend.

```env
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=
```

Com o Supabase local em execução, consulte a chave anônima com `npm run supabase:status` na raiz do repositório.

## Desenvolvimento

Na raiz do repositório, execute:

```bash
npm run dev:frontend
```

Para validar o código:

```bash
npm run lint:frontend
```
