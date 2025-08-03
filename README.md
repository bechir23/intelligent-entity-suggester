# Intelligent Entity Suggester System

A comprehensive intelligent entity suggester system with real-time collaboration features, built with React, Node.js, and Supabase.

## 🚀 Features

- **Real-time Entity Suggestions**: Advanced full-text search with <150ms response times
- **Rich Text Editor**: TipTap-based editor with entity mentions and metadata injection
- **Real-time Collaboration**: WebSocket-based collaborative editing
- **Comprehensive Database**: Full-text search across customers, products, sales, tasks, and more
- **Audit Trail**: Complete metadata persistence with change tracking
- **Date/Time NLP**: Natural language date parsing with Chrono Node
- **Pronoun Resolution**: Intelligent context-aware pronoun resolution
- **Production Ready**: Complete Docker setup with one-liner deployment

## 📋 Requirements

- Node.js 20+
- Docker & Docker Compose
- Supabase CLI
- pnpm (recommended) or npm

## 🛠️ Quick Start

### One-liner Setup (Recommended)

```bash
# Clone and setup everything
git clone <repo-url> && cd ahmed_project_upwork
npm run setup && npm start
```

This will:
1. Install all dependencies (frontend + backend)
2. Start Supabase stack (database, auth, storage, etc.)
3. Start the Docker containers
4. Launch the development servers

### Manual Setup

1. **Install Dependencies**
   ```bash
   npm install
   cd server && npm install && cd ..
   ```

2. **Start Supabase Stack**
   ```bash
   npm run supabase:start
   ```

3. **Setup Environment Variables**
   ```bash
   # Copy environment templates
   cp .env.example .env
   cp server/.env.example server/.env
   ```

4. **Start Development Servers**
   ```bash
   npm run dev
   ```

5. **Or use Docker (Production-like)**
   ```bash
   npm run docker:up
   ```

## 🔧 Environment Configuration

### Frontend (.env)
```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
VITE_API_URL=http://localhost:3001
VITE_WS_URL=http://localhost:3001
```

### Backend (server/.env)
```env
NODE_ENV=development
PORT=3001
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
FRONTEND_URL=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
DEBOUNCE_DELAY=300
CACHE_TTL=300000
```

## 🏗️ Architecture

### Frontend
- **Framework**: React 19 + TypeScript + Vite
- **Editor**: TipTap rich text editor with mention plugin
- **State**: Real-time WebSocket integration
- **Styling**: Modern CSS with component-based styling

### Backend
- **Runtime**: Node.js 20 + Express + TypeScript
- **Real-time**: Socket.IO for WebSocket communication
- **Performance**: Rate limiting, debouncing, caching
- **Database**: Supabase PostgreSQL with advanced extensions

### Database Schema
- **Entities**: customers, products, sales, stock, tasks, shifts, attendance
- **Search**: Full-text search with pg_trgm and fuzzystrmatch
- **Audit**: Comprehensive audit trail with metadata tracking
- **Performance**: Optimized indexes and search functions

## 📊 API Endpoints

### REST API
- `GET /api/suggestions` - Get entity suggestions
- `POST /api/audit` - Log audit events
- `GET /api/health` - Health check

### WebSocket Events
- `connect` - Client connection
- `suggestion_request` - Request suggestions
- `suggestion_response` - Receive suggestions
- `metadata_update` - Real-time metadata updates

## 🧪 Testing

### Unit Tests (Vitest)
```bash
npm test              # Run tests
npm run test:ui       # Run with UI
```

### E2E Tests (Cypress)
```bash
npm run test:e2e      # Open Cypress UI
npm run test:e2e:headless  # Run headless
```

## 🚀 Deployment

### Docker Deployment
```bash
# Production build and deploy
docker-compose -f docker-compose.yml up -d

# View logs
npm run docker:logs

# Stop services
npm run docker:down
```

### Manual Deployment
1. Build frontend: `npm run build:frontend`
2. Build backend: `npm run build:backend`
3. Configure production environment variables
4. Start Supabase: `npm run supabase:start`
5. Deploy built assets

## 📁 Project Structure

```
ahmed_project_upwork/
├── src/                          # Frontend React app
│   ├── components/               # React components
│   │   └── IntelligentEditor.tsx # Main editor component
│   ├── services/                 # Frontend services
│   │   ├── api.ts               # API communication
│   │   ├── supabase.ts          # Supabase client
│   │   └── websocket.ts         # WebSocket management
│   └── types/                   # TypeScript types
├── server/                      # Backend Node.js API
│   ├── src/
│   │   ├── routes/              # Express routes
│   │   ├── services/            # Business logic
│   │   └── index.ts             # Main server file
│   └── package.json
├── supabase/                    # Supabase configuration
│   ├── schema.sql               # Database schema
│   ├── config.toml              # Supabase config
│   └── kong.yml                 # Kong gateway config
├── docker-compose.yml           # Docker orchestration
├── Dockerfile.frontend          # Frontend container
├── server/Dockerfile            # Backend container
└── package.json                 # Root package.json
```

## 🔍 Performance Features

- **<150ms Response**: Optimized database queries and caching
- **Rate Limiting**: 100 requests per 15-minute window
- **Debouncing**: 300ms debounce on search requests
- **Caching**: 5-minute TTL on suggestion results
- **Connection Pooling**: Efficient database connections

## 🛡️ Security Features

- **CORS Protection**: Configured for specific origins
- **Rate Limiting**: DDoS protection
- **Input Validation**: Comprehensive request validation
- **Environment Secrets**: Secure environment variable handling

## 🔧 Development Commands

```bash
# Development
npm run dev                 # Start both frontend and backend
npm run dev:frontend        # Start only frontend
npm run dev:backend         # Start only backend

# Building
npm run build              # Build both frontend and backend
npm run build:frontend     # Build only frontend
npm run build:backend      # Build only backend

# Database
npm run supabase:start     # Start Supabase stack
npm run supabase:stop      # Stop Supabase stack
npm run supabase:reset     # Reset database to schema

# Docker
npm run docker:up          # Start Docker containers
npm run docker:down        # Stop Docker containers
npm run docker:logs        # View container logs

# Testing
npm test                   # Run unit tests
npm run test:ui            # Run tests with UI
npm run test:e2e           # Run Cypress e2e tests

# Linting
npm run lint               # Lint frontend and backend
```

## 🐛 Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3001, 5173, 54321-54328 are available
2. **Docker issues**: Run `docker-compose down` and `docker system prune`
3. **Supabase issues**: Run `supabase stop` and `supabase start`
4. **Permission issues**: Ensure Docker daemon is running

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm run dev:backend

# View all logs
npm run docker:logs
```

## 📈 Monitoring

- Health check endpoint: `http://localhost:3001/api/health`
- Supabase Studio: `http://localhost:54323`
- Real-time metrics available in application logs

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Create Pull Request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Review application logs
3. Ensure all services are running
4. Verify environment configuration

---

Built with ❤️ using React, Node.js, and Supabase

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
