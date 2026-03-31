export const appConfig = {
  name: process.env.APP_NAME || 'e-com-backend',
  version: process.env.APP_VERSION || '0.1.0',
  port: Number(process.env.PORT || 3000),
}
