import Fastify from 'fastify'
import cors from '@fastify/cors'
import { env } from './config/env.js'
import { AppError } from './lib/errors.js'
import { isSupabaseConfigured, supabase } from './lib/supabase.js'
import { createCategoriasController } from './modules/p0/categorias/categorias.controller.js'
import { createCategoriasRepository } from './modules/p0/categorias/categorias.repository.js'
import { categoriasRoutes } from './modules/p0/categorias/categorias.routes.js'
import { createCategoriasService } from './modules/p0/categorias/categorias.service.js'
import { createEmpresasController } from './modules/p0/empresas/empresas.controller.js'
import { createEmpresasRepository } from './modules/p0/empresas/empresas.repository.js'
import { empresasRoutes } from './modules/p0/empresas/empresas.routes.js'
import { createEmpresasService } from './modules/p0/empresas/empresas.service.js'
import { createLancamentosController } from './modules/p0/lancamentos/lancamentos.controller.js'
import { createLancamentosRepository } from './modules/p0/lancamentos/lancamentos.repository.js'
import { lancamentosRoutes } from './modules/p0/lancamentos/lancamentos.routes.js'
import { createLancamentosService } from './modules/p0/lancamentos/lancamentos.service.js'

function defaultServices() {
  const empresasRepository = createEmpresasRepository(supabase)
  const categoriasRepository = createCategoriasRepository(supabase)
  const lancamentosRepository = createLancamentosRepository(supabase)

  return {
    empresasService: createEmpresasService(empresasRepository),
    categoriasService: createCategoriasService({
      categoriasRepository,
      empresasRepository,
    }),
    lancamentosService: createLancamentosService({
      lancamentosRepository,
      empresasRepository,
      categoriasRepository,
    }),
  }
}

function errorPayload(code, message) {
  return {
    erro: {
      codigo: code,
      mensagem: message,
    },
  }
}

export async function buildApp(options = {}) {
  const app = Fastify({
    logger: options.logger ?? true,
    ajv: {
      customOptions: {
        removeAdditional: false,
        multipleOfPrecision: 8,
      },
    },
  })
  const services = options.services ?? defaultServices()

  await app.register(cors, {
    origin: options.corsOrigins ?? env.frontendOrigins,
    methods: ['GET', 'POST', 'OPTIONS'],
  })

  app.setErrorHandler((error, request, reply) => {
    if (error.validation) {
      return reply
        .status(400)
        .send(errorPayload('PARAMETROS_INVALIDOS', 'Os parametros informados sao invalidos.'))
    }

    if (error instanceof AppError) {
      if (error.statusCode >= 500) request.log.error({ err: error })

      return reply
        .status(error.statusCode)
        .send(errorPayload(error.code, error.message))
    }

    request.log.error({ err: error })
    return reply
      .status(500)
      .send(errorPayload('ERRO_INTERNO', 'Ocorreu uma falha inesperada.'))
  })

  app.get('/health', async () => ({
    status: 'ok',
    service: 'controle-faturamento-api',
    supabase: isSupabaseConfigured ? 'configured' : 'not_configured',
  }))

  await app.register(empresasRoutes, {
    prefix: '/api/empresas',
    controller: createEmpresasController(services.empresasService),
  })
  await app.register(categoriasRoutes, {
    prefix: '/api/empresas',
    controller: createCategoriasController(services.categoriasService),
  })
  await app.register(lancamentosRoutes, {
    prefix: '/api/lancamentos',
    controller: createLancamentosController(services.lancamentosService),
  })

  return app
}
