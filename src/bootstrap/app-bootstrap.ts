import { INestApplication } from '@nestjs/common'

import { setupSecurity } from './security'
import { setupSwagger } from './swagger'
import { setupValidation } from './validation'

export function configureApplication(app: INestApplication) {
  app.setGlobalPrefix('api')
  setupSecurity(app)
  setupValidation(app)
  setupSwagger(app)
}
