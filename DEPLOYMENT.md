# 🚀 Quick Deployment Guide

## One-Liner Setup

```bash
# Install dependencies and start everything
npm run setup && npm start
```

This single command will:
1. Install all frontend and backend dependencies
2. Start the complete Supabase stack (PostgreSQL, Auth, Storage, Realtime)
3. Launch Docker containers for production-like environment
4. Start development servers with hot reload

## Manual Step-by-Step

### 1. Prerequisites
```bash
# Ensure you have the required tools
node --version  # Should be 20+
docker --version
docker-compose --version
npm install -g @supabase/cli  # Optional for advanced DB operations
```

### 2. Environment Setup
```bash
# Clone repository
git clone <repo-url>
cd ahmed_project_upwork

# Install dependencies
npm install
cd server && npm install && cd ..
```

### 3. Start Services

**Option A: Development Mode (Hot Reload)**
```bash
npm run supabase:start  # Start Supabase stack
npm run dev            # Start frontend & backend with hot reload
```

**Option B: Docker Mode (Production-like)**
```bash
npm run docker:up      # Start all services in containers
```

### 4. Access Applications

- **Frontend**: http://localhost:5173
- **API**: http://localhost:3001
- **Supabase Studio**: http://localhost:54323
- **API Health**: http://localhost:3001/api/health

## Verification Checklist

✅ **Database Ready**
```bash
curl http://localhost:54321/rest/v1/customers?select=*&limit=1
```

✅ **API Ready**
```bash
curl http://localhost:3001/api/health
```

✅ **Frontend Ready**
- Open http://localhost:5173
- Type in the editor
- See suggestions appear

✅ **WebSocket Ready**
- Check console for "Connected to WebSocket"
- Test real-time collaboration features

## Performance Validation

Test the <150ms response requirement:
```bash
# Test suggestion API performance
time curl "http://localhost:3001/api/suggestions?q=cust&type=customers"
```

## Troubleshooting

**Port Conflicts**
```bash
# Kill processes on common ports
npx kill-port 3001 5173 54321 54322 54323
```

**Reset Everything**
```bash
npm run docker:down
npm run supabase:stop
docker system prune -f
npm run supabase:start
npm run docker:up
```

**View Logs**
```bash
npm run docker:logs        # All container logs
npm run supabase:start     # Supabase logs
```

## Production Deployment

For production deployment:

1. **Environment Variables**: Update `.env.docker` with production values
2. **SSL/TLS**: Configure HTTPS certificates
3. **Domain**: Update CORS origins and redirect URLs
4. **Monitoring**: Add application monitoring
5. **Backup**: Configure database backups

```bash
# Production build
npm run build
docker-compose -f docker-compose.yml up -d
```

## Testing

```bash
# Run all tests
npm test                    # Frontend unit tests
cd server && npm test       # Backend API tests
npm run test:e2e           # End-to-end tests

# Coverage reports
npm run test:ui            # Interactive test UI
```

---

🎉 **Your intelligent entity suggester system is now running!**

The system includes:
- ✅ Real-time entity suggestions (<150ms)
- ✅ Rich text editor with mentions
- ✅ WebSocket collaboration
- ✅ Full-text search across 8 entity types
- ✅ Audit trail with metadata
- ✅ Date/time NLP parsing
- ✅ Pronoun resolution
- ✅ Complete Docker setup
- ✅ Testing framework
