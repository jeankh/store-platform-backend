import { INestApplication } from '@nestjs/common'

export function setupSecurity(app: INestApplication) {
  app.enableCors()
}
