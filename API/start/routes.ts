import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

// lazy import controllers (default exports)
const AuthController = () => import('#controllers/auth_controller') // login/logout
const UsersController = () => import('#controllers/users_controller') // admin manages users
const SubjectsController = () => import('#controllers/subjects_controller') // subjects CRUD
const MeController = () => import('#controllers/me_controller') // current user

const WalletController = () => import('#controllers/wallets_controller')

const TimerController = () => import('#controllers/timers_controller') // timer controls

const ItemsController = () => import('#controllers/items_controller') // admin manages items

const InventoryController = () => import('#controllers/inventories_controller') // user inventory management

// -----------------------------
// Auth (session/token endpoints)
// -----------------------------
router.post('/login', [AuthController, 'login']) // login (create token)
router
  .delete('/logout', [AuthController, 'logout']) // logout (invalidate current token)
  .use(middleware.auth({ guards: ['api'] }))

// -----------------------------
// Public user registration
// -----------------------------
router.post('/register', [AuthController, 'register']) // register (creates role: 'user')

// -----------------------------
// Admin-only management
// -----------------------------
router
  .group(() => {
    router.get('/users', [UsersController, 'index'])
    router.get('/users/:id', [UsersController, 'show'])
    router.put('/users/:id', [UsersController, 'update'])
    router.delete('/users/:id', [UsersController, 'destroy'])

    // view a user's subjects as admin
    router.get('/users/:id/subjects', [SubjectsController, 'byUser'])

    // view a user's inventory as admin
    router.get('/users/:id/inventory', [InventoryController, 'forUser'])

    // view all subjects
    router.get('/subjects', [SubjectsController, 'index'])

    // add or remove coins from user
    router.post('/wallet/adjust', [WalletController, 'adjust'])

    // add or remove items from user
    router.post('/inventory/adjust', [InventoryController, 'adjust'])

    // manage the item catalog
    router.post('/items', [ItemsController, 'store'])
    router.put('/items/:id', [ItemsController, 'update'])
    router.delete('/items/:id', [ItemsController, 'destroy'])
  })
  .use([
    middleware.auth({ guards: ['api'] }),
    middleware.role(), // <-- custom role middleware allows only admin
  ])

// -----------------------------
// Me (current authenticated user)
// -----------------------------
router
  .group(() => {
    router.get('/me', [MeController, 'show'])
    router.put('/me', [MeController, 'update'])
    router.get('/me/subjects', [SubjectsController, 'mine'])
    router.get('/me/sessions', [TimerController, 'mine'])
    router.get('/me/sessions/totals', [TimerController, 'total'])
    router.get('/me/wallet', [WalletController, 'show'])
    router.get('/me/coins/ledger', [WalletController, 'ledger'])
    router.get('/me/inventory', [InventoryController, 'mine'])
  })
  .use(middleware.auth({ guards: ['api'] }))

// -----------------------------
// Item catalog (shop)
// -----------------------------
router
  .group(() => {
    router.get('/items', [ItemsController, 'index'])
    router.get('/items/:id', [ItemsController, 'show'])
    router.post('/items/:id/purchase', [ItemsController, 'purchaseById'])
    router.post('/items/purchase', [ItemsController, 'purchaseBySlug'])
    router.post('/packs/:slug/open', [ItemsController, 'openParam'])
  })
  .use(middleware.auth({ guards: ['api'] }))

// -----------------------------
// Subjects (owner-only)
// -----------------------------
router
  .group(() => {
    router.post('/subjects', [SubjectsController, 'store'])
    router.get('/subjects/:id', [SubjectsController, 'show'])
    router.put('/subjects/:id', [SubjectsController, 'update'])
    router.delete('/subjects/:id', [SubjectsController, 'destroy'])
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
import AutoSwagger from 'adonis-autoswagger'
import swagger from '#config/swagger'
// Returns the OpenAPI spec in YAML
router.get('/swagger', async () => {
  return AutoSwagger.default.docs(router.toJSON(), swagger)
})

// Renders Swagger UI (Scalar by default) using the YAML endpoint above
router.get('/docs', async () => {
  return AutoSwagger.default.scalar('/swagger')
})
