# Ethara AI TaskFlow

An enterprise-grade internal task and project management platform built for **Ethara AI**.

---

## Tech Stack

| Layer     | Technology                                      |
|-----------|-------------------------------------------------|
| Frontend  | React.js (Vite), Tailwind CSS, ShadCN UI, Framer Motion, Zustand, Recharts |
| Backend   | Golang, Gin Framework, JWT, RBAC Middleware     |
| Database  | MongoDB (local — MongoDB Compass)               |

---

## Features

- **Role-Based Access Control** — Admin and Member roles
- **Project Management** — Create, assign, track projects
- **Task Management** — Full CRUD with priority, status, deadlines
- **Kanban Board** — Visual task status management
- **Team Management** — Admin can create members and assign tasks
- **Analytics Dashboard** — Charts and KPI cards
- **JWT Authentication** — Secure login/register
- **Real-time WebSocket** — Live updates
- **Rate Limiting** — API protection

---

## Getting Started

### Prerequisites

- Go 1.21+
- Node.js 18+
- MongoDB Community Server (running locally on port 27017)

---

### Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env — set MONGODB_URI=mongodb://localhost:27017
go mod tidy
go run main.go
```

Backend runs on: `http://localhost:8080`

---

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: `http://localhost:5174`

---

## Environment Variables

### Backend `.env`

```env
PORT=8080
MONGODB_URI=mongodb://localhost:27017
DB_NAME=ethara_ai_taskflow
JWT_SECRET=your_jwt_secret_here
FRONTEND_URL=http://localhost:5174
ENVIRONMENT=development
```

### Frontend `.env`

```env
VITE_API_URL=http://localhost:8080/api
```

---

## API Endpoints

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

GET    /api/projects
POST   /api/projects          (admin)
PUT    /api/projects/:id
DELETE /api/projects/:id      (admin)

GET    /api/tasks
POST   /api/tasks             (admin)
PUT    /api/tasks/:id
DELETE /api/tasks/:id

GET    /api/users             (admin)
POST   /api/users             (admin)
PUT    /api/users/:id
DELETE /api/users/:id         (admin)

GET    /api/dashboard/stats
```

---

## Project Structure

```
├── backend/
│   ├── config/          # App configuration
│   ├── controllers/     # HTTP handlers
│   ├── database/        # MongoDB connection
│   ├── middleware/       # Auth, RBAC, rate limiting, logger
│   ├── models/          # Data models
│   ├── repositories/    # DB queries
│   ├── routes/          # Route registration
│   ├── services/        # Business logic
│   ├── utils/           # JWT, pagination, response helpers
│   └── websocket/       # WebSocket hub
│
└── frontend/
    └── src/
        ├── api/         # Axios API clients
        ├── components/  # Reusable UI components
        ├── hooks/       # Custom React hooks
        ├── layouts/     # App layout
        ├── pages/       # Route pages
        ├── routes/      # React Router config
        ├── store/       # Zustand state management
        ├── styles/      # Global CSS
        └── utils/       # Helpers and constants
```

---

## License

Built for the Ethara AI Full Stack Developer selection process.
# ethara-ai-taskflow
