import path from 'node:path'
import url from 'node:url'
const configDir = path.dirname(url.fileURLToPath(import.meta.url))

export default {
  path: path.join(configDir, '..'),
  tagIndex: 1,
  productionEnv: 'production',
  info: {
    title: 'StudySow',
    version: '1.0.0',
    description: '',
  },
  snakeCase: true,
  debug: true,
  ignore: ['/swagger', '/docs'],
  preferredPutPatch: 'PUT',
  common: {
    parameters: {},
    headers: {},
  },
  securitySchemes: {},
  authMiddlewares: ['auth', 'auth:api'],
  defaultSecurityScheme: 'BearerAuth',
  persistAuthorization: true,
  showFullPath: false,
}
