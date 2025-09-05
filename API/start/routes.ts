import router from '@adonisjs/core/services/router'

// lazy import the controller (default export)
const UsersController = () => import('#controllers/users_controller')
const SessionController = () => import('#controllers/session_controller')

// Auth
router.post('/session', [SessionController, 'store'])
router
  .delete('/session', [SessionController, 'destroy'])
  .use(middleware.auth({ guards: ['api'] })) // must be authenticated to log out

// User endpoints
router.post('/users', [UsersController, 'store'])
router.group(() => {
  router.get('/users', [UsersController, 'index'])
  router.get('/users/:id', [UsersController, 'show'])
  router.put('/users/:id', [UsersController, 'update'])
  router.delete('/users/:id', [UsersController, 'destroy'])
}).use(middleware.auth({ guards: ['api'] }))

// Swagger
import AutoSwagger from "adonis-autoswagger";
import swagger from "#config/swagger";
import {middleware} from "#start/kernel";
// returns swagger in YAML
router.get("/swagger", async () => {
  return AutoSwagger.default.docs(router.toJSON(), swagger);
});

// Renders Swagger-UI and passes YAML-output of /swagger
router.get("/docs", async () => {
  //return AutoSwagger.default.ui("/swagger", swagger);
  return AutoSwagger.default.scalar("/swagger"); //to use Scalar instead. If you want, you can pass proxy url as second argument here.
  // return AutoSwagger.default.rapidoc("/swagger", "view"); to use RapiDoc instead (pass "view" default, or "read" to change the render-style)
});

