import router from '@adonisjs/core/services/router'
import {middleware} from "#start/kernel";

// lazy import controllers (default exports)
const AuthController = () => import('#controllers/auth_controller')   // login/logout
const UsersController   = () => import('#controllers/users_controller')     // admin manages users
const SubjectsController= () => import('#controllers/subjects_controller')  // subjects CRUD
const MeController      = () => import('#controllers/me_controller')        // current user

const WalletController = () => import('#controllers/wallets_controller')

const TimerController      = () => import('#controllers/timers_controller')        // timer controls

// -----------------------------
// Auth (session/token endpoints)
// -----------------------------
router.post('/login',  [AuthController, 'login'])   // login (create token)
router
  .delete('/logout', [AuthController, 'logout'])    // logout (invalidate current token)
  .use(middleware.auth({ guards: ['api'] }))

// -----------------------------
// Public user registration
// -----------------------------
router.post('/register', [AuthController, 'register'])        // register (creates role: 'user')

// -----------------------------
// Admin-only management
// -----------------------------
router
  .group(() => {
    router.get('/users',       [UsersController, 'index'])
    router.get('/users/:id',   [UsersController, 'show'])
    router.put('/users/:id',   [UsersController, 'update'])
    router.delete('/users/:id',[UsersController, 'destroy'])

    // view a user's subjects as admin
    router.get('/users/:id/subjects', [SubjectsController, 'byUser'])

    // view all subjects
    router.get('/subjects', [SubjectsController, 'index'])

    // add or remove coins from user
    router.post('/wallet/adjust', [WalletController, 'adjust'])
  })
  .use([
    middleware.auth({ guards: ['api'] }),
    middleware.role(),                           // <-- custom role middleware allows only admin
  ])

// -----------------------------
// Me (current authenticated user)
// -----------------------------
router
  .group(() => {
    router.get('/me',            [MeController, 'show'])
    router.put('/me',            [MeController, 'update'])
    router.get('/me/subjects',   [SubjectsController, 'mine'])
    router.get('/me/sessions',   [TimerController, 'mine'])
    router.get('/me/sessions/totals',   [TimerController, 'total'])
    router.get('/me/wallet', [WalletController, 'show'])
    router.get('/me/coins/ledger', [WalletController, 'ledger'])
  })
  .use(middleware.auth({ guards: ['api'] }))

// -----------------------------
// Subjects (owner-only)
// -----------------------------
router
  .group(() => {
    router.post('/subjects',      [SubjectsController, 'store'])
    router.get('/subjects/:id',   [SubjectsController, 'show'])
    router.put('/subjects/:id',   [SubjectsController, 'update'])
    router.delete('/subjects/:id',[SubjectsController, 'destroy'])
  })
  .use(middleware.auth({ guards: ['api'] }))

// -----------------------------
// Timer controls (owner-only)
// -----------------------------
router
  .group(() => {
    router.post('/timer/start', [TimerController, 'start'])
    router.post('/timer/stop', [TimerController, 'stop'])
  })
  .use(middleware.auth({ guards: ['api'] }))

// Swagger
import AutoSwagger from "adonis-autoswagger";
import swagger from "#config/swagger";
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





