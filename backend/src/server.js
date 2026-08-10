import Fastify from 'fastify'
import cors from '@fastify/cors'
import { env } from './config/env.js'
import { isSupabaseConfigured } from './lib/supabase.js'

const app = Fastify({
  logger: true,
})

await app.register(cors, {
  origin: env.frontendUrl,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
})

app.get('/health', async () => {
  return {
    status: 'ok',
    service: 'controle-faturamento-api',
    supabase: isSupabaseConfigured ? 'configured' : 'not_configured',
  }
})

try {
  await app.listen({
    port: env.port,
    host: '127.0.0.1',
  })
} catch (error) {
  app.log.error(error)
  process.exit(1)
}
