
## 1. Clone the Repository

git clone <REPO_URL>
cd <REPO_FOLDER>

---

## 2. Backend (AdonisJS API) Setup

Navigate into `/server` 

### 2.1 Install Dependencies

npm install

### 2.2 Generate .env file

TZ=UTC
PORT=3333
HOST=localhost
LOG_LEVEL=info
APP_KEY=
NODE_ENV=development

### 2.3 Generate the App Key

AdonisJS requires an app key for encryption and session handling.

```bash
node ace generate:key
```

This will automatically update your `.env` with a new `APP_KEY`.

---

## 3. Start the Backend

Run the backend development server:

```bash
npm run dev
```

You should see something like:

```bash
Your application is ready
│
├── Address: http://127.0.0.1:3333
├── Environment: development
└── Watcher: On
```

---

## 4. Frontend (React + Vite + TypeScript) Setup

Run cd ..
Navigate into `/client`:

### 4.1 Install Dependencies

```bash
npm install
```

### 4.2 Start the Frontend Dev Server

```bash
npm run dev
```

Vite will give you a local URL, usually:

```
http://localhost:5173/
```

---

## Useful Commands

| Task | Command |
|------|----------|
| Start backend | `node ace serve --watch` |
| Start frontend | `npm run dev` (in `/client`) |
| Generate Adonis app key | `node ace generate:key` |
| Run migrations | `node ace migration:run` |
| Seed data | `node ace db:seed` |

---
