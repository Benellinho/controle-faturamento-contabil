import { buildApp } from './app.js'
import { env } from './config/env.js'

let app

try {
  app = await buildApp()

  await app.listen({
    port: env.port,
    host: '127.0.0.1',
  })
} catch (error) {
  if (app) app.log.error(error)
  else console.error(error)
  process.exit(1)
}
