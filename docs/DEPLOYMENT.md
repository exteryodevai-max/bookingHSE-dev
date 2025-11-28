# 🚀 Guida Deployment - BookingHSE

Guida completa per il deployment in produzione della piattaforma BookingHSE.

## 📋 Indice

1. [Prerequisiti](#prerequisiti)
2. [Configurazione Ambiente](#configurazione-ambiente)
3. [Deployment su Vercel](#deployment-su-vercel)
4. [Deployment su Netlify](#deployment-su-netlify)
5. [Deployment Docker](#deployment-docker)
6. [Configurazione Database Produzione](#configurazione-database-produzione)
7. [Configurazione Storage Produzione](#configurazione-storage-produzione)
8. [Configurazione CDN](#configurazione-cdn)
9. [Monitoring e Logging](#monitoring-e-logging)
10. [Sicurezza](#sicurezza)
11. [Backup e Recovery](#backup-e-recovery)
12. [CI/CD Pipeline](#cicd-pipeline)
13. [Troubleshooting](#troubleshooting)

## 🔧 Prerequisiti

### Account e Servizi Necessari
- ✅ **Supabase Pro/Team** - Database produzione
- ✅ **Stripe Live Account** - Pagamenti reali
- ✅ **Vercel/Netlify Account** - Hosting frontend
- ✅ **Domain Provider** - Dominio personalizzato
- ✅ **Cloudflare** (opzionale) - CDN e sicurezza
- ✅ **Sentry** (opzionale) - Error tracking
- ✅ **Google Analytics** (opzionale) - Analytics

### Strumenti di Sviluppo
- Node.js 18+
- Git
- Docker (opzionale)
- Vercel CLI o Netlify CLI

## ⚙️ Configurazione Ambiente

### 1. Variabili d'Ambiente Produzione

Crea un file `.env.production` con le configurazioni di produzione:

```env
# ==============================================
# PRODUCTION ENVIRONMENT VARIABLES
# ==============================================

# Application
NODE_ENV=production
VITE_APP_URL=https://your-domain.com
VITE_APP_NAME=BookingHSE

# Supabase Production
VITE_SUPABASE_URL=https://your-prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key

# Stripe Live
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key
STRIPE_SECRET_KEY=sk_live_your_live_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret

# Security
CORS_ORIGINS=https://your-domain.com
JWT_SECRET=your_super_secure_jwt_secret_for_production

# Monitoring
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
VITE_GA_TRACKING_ID=G-XXXXXXXXXX

# Performance
VITE_DEBUG=false
VITE_USE_MOCK_DATA=false

# Rate Limiting
RATE_LIMIT_MAX=1000
RATE_LIMIT_WINDOW=15

# Maintenance
MAINTENANCE_MODE=false
```

### 2. 🌐 Configurazione URL Centralizzata

BookingHSE utilizza un sistema di configurazione URL centralizzata che si adatta automaticamente all'ambiente di deployment. Questa configurazione è fondamentale per il corretto funzionamento in produzione.

#### Configurazione Automatica per Ambiente

Il sistema rileva automaticamente l'ambiente basandosi su `VITE_APP_URL`:

```typescript
// src/config/urls.ts - Configurazione automatica
const APP_CONFIG = {
  domains: {
    production: 'bookinghse.com',
    staging: 'staging.bookinghse.com',
    local: 'localhost:5173'
  },
  
  // URL dinamico basato su variabile ambiente
  APP_URL: import.meta.env.VITE_APP_URL || 'http://localhost:5173'
};
```

#### Configurazioni per Ambiente

**Produzione** (`VITE_APP_URL=https://bookinghse.com`):
```typescript
APP_CONFIG.getFullUrl('/dashboard') 
// → 'https://bookinghse.com/dashboard'

APP_CONFIG.getAuthUrl('reset', 'token123')
// → 'https://bookinghse.com/auth/reset-password?token=token123'

APP_CONFIG.isProduction() // → true
```

**Staging** (`VITE_APP_URL=https://staging.bookinghse.com`):
```typescript
APP_CONFIG.getFullUrl('/dashboard')
// → 'https://staging.bookinghse.com/dashboard'

APP_CONFIG.isProduction() // → false
```

**Sviluppo** (`VITE_APP_URL=http://localhost:5173`):
```typescript
APP_CONFIG.getFullUrl('/dashboard')
// → 'http://localhost:5173/dashboard'

APP_CONFIG.isProduction() // → false
```

#### Configurazione Supabase Auth URLs

Per il deployment in produzione, configura questi URL nel dashboard Supabase:

**Authentication → URL Configuration:**
```
Site URL: https://bookinghse.com
Redirect URLs:
- https://bookinghse.com/auth/callback
- https://bookinghse.com/auth/login
- https://bookinghse.com/auth/signup
- https://bookinghse.com/auth/reset-password
```

**Per staging:**
```
Site URL: https://staging.bookinghse.com
Redirect URLs:
- https://staging.bookinghse.com/auth/callback
- https://staging.bookinghse.com/auth/login
- https://staging.bookinghse.com/auth/signup
- https://staging.bookinghse.com/auth/reset-password
```

#### Verifica Configurazione

Dopo il deployment, verifica che la configurazione URL funzioni correttamente:

```bash
# Test URL generation
curl https://your-domain.com/api/health

# Verifica redirect di autenticazione
curl -I https://your-domain.com/auth/login

# Test reset password URL
curl -X POST https://your-domain.com/api/auth/reset \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

#### Troubleshooting URL Configuration

**Problema**: URL non corretti in produzione
```bash
# Verifica variabile ambiente
echo $VITE_APP_URL

# Controlla build output
npm run build
grep -r "localhost" dist/
```

**Problema**: Redirect di autenticazione falliti
1. Verifica configurazione Supabase Auth URLs
2. Controlla CORS settings
3. Verifica che `VITE_APP_URL` sia impostato correttamente

### 3. Configurazione Netlify Functions

Per il deployment delle funzioni di contatto su Netlify:

**netlify.toml** (configurazione completa):
```toml
[build]
  publish = "dist"
  functions = "netlify/functions"

[build.environment]
  # Variabili ambiente per build
  NODE_ENV = "production"
  
  # Resend API per email di contatto
  RESEND_API_KEY = "re_xxx"

# Redirect per API routes
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

# Configurazione headers per sicurezza
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

# Configurazione CORS per API
[[headers]]
  for = "/api/*"
  [headers.values]
    Access-Control-Allow-Origin = "*"
    Access-Control-Allow-Headers = "Content-Type"
    Access-Control-Allow-Methods = "POST, OPTIONS"

# Configurazione caching per static assets
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

**Variabili ambiente Netlify:**
```bash
# Dashboard Netlify → Site settings → Environment variables
RESEND_API_KEY=re_xxx_live_api_key
VITE_SUPABASE_URL=https://your-prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_production_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
VITE_APP_URL=https://your-domain.com
```

**Deploy delle funzioni:**
```bash
# Build e deploy
npm run build
netlify deploy --prod --dir=dist

# Oppure con CI/CD integrato
# Netlify rileva automaticamente le funzioni nella cartella netlify/functions
```

### 4. Ottimizzazioni Build

**vite.config.ts** per produzione:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    // Ottimizzazioni produzione
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    // Code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          stripe: ['@stripe/stripe-js'],
          ui: ['lucide-react', 'react-router-dom'],
        },
      },
    },
    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
  },
  // Preview settings
  preview: {
    port: 4173,
    host: true,
  },
})
```

## 🌐 Deployment su Vercel

### 1. Setup Iniziale

```bash
# Installa Vercel CLI
npm i -g vercel

# Login
vercel login

# Inizializza progetto
vercel
```

### 2. Configurazione vercel.json

```json
{
  "version": 2,
  "name": "bookinghse",
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains"
        }
      ]
    },
    {
      "source": "/static/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "app/api/**/*.js": {
      "maxDuration": 30
    }
  }
}
```

### 3. Configurazione Variabili Ambiente

```bash
# Aggiungi variabili via CLI
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
vercel env add VITE_STRIPE_PUBLISHABLE_KEY production

# O via dashboard Vercel
# https://vercel.com/your-team/bookinghse/settings/environment-variables
```

### 4. Deploy

```bash
# Deploy produzione
vercel --prod

# Deploy con dominio personalizzato
vercel --prod --alias your-domain.com
```

## 🌍 Deployment su Netlify

### 1. Setup Iniziale

```bash
# Installa Netlify CLI
npm i -g netlify-cli

# Login
netlify login

# Inizializza
netlify init
```

### 2. Configurazione netlify.toml

```toml
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_ENV = "production"
  NPM_FLAGS = "--prefix=/opt/buildhome/.nodejs/node_modules/npm"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Strict-Transport-Security = "max-age=31536000; includeSubDomains"

[[headers]]
  for = "/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"
```

> Importante: configura le variabili d’ambiente nel dashboard Netlify (Site settings → Environment variables). Non committare mai chiavi segrete nel repository.

Variabili da impostare:

```bash
VITE_SUPABASE_URL=https://your-prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_production_anon_key
VITE_APP_URL=https://your-domain.com
RESEND_API_KEY=re_xxx_live_api_key
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
```

### 3. Deploy

```bash
# Deploy produzione
netlify deploy --prod

# Con build
netlify deploy --prod --build
```

## 🐳 Deployment Docker

### 1. Dockerfile

```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine AS production

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

### 2. nginx.conf

```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    server {
        listen 80;
        server_name _;
        root /usr/share/nginx/html;
        index index.html;
        
        # Handle client-side routing
        location / {
            try_files $uri $uri/ /index.html;
        }
        
        # Cache static assets
        location /static/ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        # Security
        location ~ /\. {
            deny all;
        }
    }
}
```

### 3. docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    
  # Reverse proxy (opzionale)
  nginx-proxy:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx-proxy.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped
```

### 4. Build e Deploy

```bash
# Build immagine
docker build -t bookinghse:latest .

# Run container
docker run -d -p 80:80 --name bookinghse bookinghse:latest

# Con docker-compose
docker-compose up -d
```

## 🗄️ Configurazione Database Produzione

### 1. Upgrade Supabase Plan

```bash
# Upgrade a Pro per produzione
# - Backup automatici
# - SSL certificates
# - Maggiori risorse
# - Support prioritario
```

### 2. Configurazione Sicurezza

```sql
-- Abilita RLS su tutte le tabelle
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_profiles ENABLE ROW LEVEL SECURITY;
-- ... per tutte le tabelle

-- Configura politiche restrittive
CREATE POLICY "Users can only view own data" ON users
FOR ALL USING (auth.uid() = id);

-- Audit logging
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. Performance Optimization

```sql
-- Indici per query frequenti
CREATE INDEX CONCURRENTLY idx_bookings_status_date 
ON bookings(status, scheduled_date) 
WHERE status IN ('pending', 'confirmed');

CREATE INDEX CONCURRENTLY idx_services_location_category 
ON services(location, category_id) 
WHERE is_active = true;

-- Statistiche automatiche
ALTER TABLE bookings SET (autovacuum_analyze_scale_factor = 0.02);
ALTER TABLE services SET (autovacuum_analyze_scale_factor = 0.02);
```

### 4. Search Index Setup

Per ottimizzare la ricerca geografica e testuale, esegui lo script:

```
database/indexes_search.sql
```

- Abilita `pg_trgm` e crea indici GIN su `lower(title|description|subcategory)`
- Crea indice GIN su `service_areas`
- Aggiunge colonna `service_areas_lower` e trigger di aggiornamento per ricerca case‑insensitive
- Esegue il backfill per servizi esistenti

Verifica:
- Inserendo/aggiornando `service_areas`, `service_areas_lower` viene popolata automaticamente
- La ricerca con token di località (città/regione/capoluoghi) torna risultati coerenti

## 📁 Configurazione Storage Produzione

### 1. Setup Bucket Produzione

```sql
-- Esegui storage-setup.sql in produzione
-- Verifica che tutti i bucket siano creati correttamente
SELECT name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets;

-- Risultato atteso:
-- certifications | false | 10485760 | {"application/pdf","image/jpeg","image/png"}
-- profile-images | true  | 5242880  | {"image/jpeg","image/png","image/webp"}
-- service-images | true  | 5242880  | {"image/jpeg","image/png","image/webp"}
-- temp-files     | false | 10485760 | {"*/*"}
```

### 2. Configurazione RLS Storage

```sql
-- Verifica politiche RLS per storage
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'storage';

-- Politiche critiche per produzione:
-- 1. Accesso certificazioni solo al proprietario
-- 2. Immagini profilo pubbliche ma modificabili solo dal proprietario
-- 3. Immagini servizi gestite dai provider
-- 4. File temporanei con TTL automatico
```

### 3. Variabili Ambiente Storage

```env
# Storage Configuration
VITE_SUPABASE_STORAGE_URL=https://your-prod-project.supabase.co/storage/v1
SUPABASE_STORAGE_ADMIN_KEY=your_storage_admin_key

# Bucket Configuration
VITE_STORAGE_BUCKET_CERTIFICATIONS=certifications
VITE_STORAGE_BUCKET_PROFILES=profile-images
VITE_STORAGE_BUCKET_SERVICES=service-images
VITE_STORAGE_BUCKET_TEMP=temp-files

# File Limits (bytes)
VITE_MAX_FILE_SIZE_IMAGE=5242880      # 5MB
VITE_MAX_FILE_SIZE_DOCUMENT=10485760  # 10MB
VITE_MAX_FILES_PER_UPLOAD=10

# CDN Configuration
VITE_STORAGE_CDN_URL=https://cdn.your-domain.com
VITE_STORAGE_TRANSFORM_ENABLED=true
```

### 4. Ottimizzazioni Performance

```typescript
// src/lib/storage-config.prod.ts
export const storageConfig = {
  // Transform images per performance
  imageTransforms: {
    thumbnail: { width: 150, height: 150, quality: 80 },
    medium: { width: 500, height: 500, quality: 85 },
    large: { width: 1200, height: 1200, quality: 90 }
  },
  
  // Cache headers
  cacheHeaders: {
    'Cache-Control': 'public, max-age=31536000, immutable',
    'CDN-Cache-Control': 'public, max-age=31536000'
  },
  
  // Upload optimizations
  uploadOptions: {
    upsert: false,
    duplex: 'half' as const,
    cacheControl: '3600'
  },
  
  // Cleanup automatico file temporanei
  tempFileCleanup: {
    enabled: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 ore
    batchSize: 100
  }
}
```

### 5. Monitoring Storage

```sql
-- Query per monitoraggio storage
CREATE OR REPLACE FUNCTION get_storage_stats()
RETURNS TABLE (
  bucket_name TEXT,
  file_count BIGINT,
  total_size BIGINT,
  avg_file_size NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.name,
    COUNT(o.id)::BIGINT,
    COALESCE(SUM((o.metadata->>'size')::BIGINT), 0)::BIGINT,
    COALESCE(AVG((o.metadata->>'size')::BIGINT), 0)::NUMERIC
  FROM storage.buckets b
  LEFT JOIN storage.objects o ON b.name = o.bucket_id
  GROUP BY b.name
  ORDER BY b.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Esegui per monitoraggio
SELECT * FROM get_storage_stats();
```

### 6. Backup Storage

```bash
#!/bin/bash
# scripts/backup-storage.sh

# Backup configurazione bucket
supabase db dump --schema storage > storage-schema-backup.sql

# Backup file (usando rclone o aws cli)
rclone sync supabase:your-project-storage ./storage-backup/

# Verifica backup
echo "Backup completato: $(date)"
ls -la ./storage-backup/
```

### 7. CDN Integration

```typescript
// src/lib/cdn-storage.ts
export class CDNStorageAdapter {
  private cdnUrl = import.meta.env.VITE_STORAGE_CDN_URL
  
  getOptimizedUrl(path: string, transform?: ImageTransform): string {
    if (!this.cdnUrl || !transform) {
      return this.getDirectUrl(path)
    }
    
    const params = new URLSearchParams({
      width: transform.width?.toString() || '',
      height: transform.height?.toString() || '',
      quality: transform.quality?.toString() || '85',
      format: transform.format || 'webp'
    })
    
    return `${this.cdnUrl}/transform/${path}?${params}`
  }
  
  private getDirectUrl(path: string): string {
    return supabase.storage
      .from(this.getBucketFromPath(path))
      .getPublicUrl(path).data.publicUrl
  }
}
```

### 8. Security Headers

```typescript
// Configurazione security headers per storage
export const storageSecurityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy': "default-src 'self'; img-src 'self' data: https:;",
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
}
```

### 9. Troubleshooting Storage

```sql
-- Debug upload failures
SELECT 
  bucket_id,
  name,
  metadata,
  created_at,
  updated_at
FROM storage.objects 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- Verifica permessi bucket
SELECT 
  bucket_id,
  auth.uid() as current_user,
  (SELECT id FROM auth.users WHERE id = auth.uid()) as user_exists
FROM storage.objects 
LIMIT 1;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'objects';
```

### 10. Alerts e Monitoring

```typescript
// src/lib/storage-monitoring.ts
export const storageMonitoring = {
  async checkStorageHealth(): Promise<HealthStatus> {
    try {
      // Test upload
      const testFile = new Blob(['test'], { type: 'text/plain' })
      const { error } = await supabase.storage
        .from('temp-files')
        .upload(`health-check-${Date.now()}.txt`, testFile)
      
      return { status: error ? 'unhealthy' : 'healthy', error }
    } catch (error) {
      return { status: 'unhealthy', error: error.message }
    }
  },
  
  async getStorageMetrics() {
    const { data } = await supabase.rpc('get_storage_stats')
    return data
  }
}
```

## 🌐 Configurazione CDN

### 1. Cloudflare Setup

```bash
# DNS Configuration
# A record: @ -> your-server-ip
# CNAME: www -> your-domain.com
# CNAME: api -> your-api-endpoint
```

### 2. Cache Rules

```javascript
// Cloudflare Workers per cache personalizzata
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  // Cache static assets
  if (url.pathname.startsWith('/static/')) {
    const response = await fetch(request)
    const newResponse = new Response(response.body, response)
    newResponse.headers.set('Cache-Control', 'public, max-age=31536000')
    return newResponse
  }
  
  // API requests - no cache
  if (url.pathname.startsWith('/api/')) {
    const response = await fetch(request)
    response.headers.set('Cache-Control', 'no-cache')
    return response
  }
  
  return fetch(request)
}
```

## 📊 Monitoring e Logging

### 1. Sistema Debug Avanzato

```typescript
// src/utils/debugAuth.ts - Sistema debug autenticazione
export const debugAuth = {
  async testSupabaseConnection(): Promise<DebugResult> {
    const startTime = Date.now()
    
    try {
      // Test connessione base
      const { data, error } = await supabase.auth.getSession()
      const responseTime = Date.now() - startTime
      
      return {
        success: !error,
        responseTime,
        details: {
          hasSession: !!data.session,
          user: data.session?.user?.email || 'Nessun utente',
          timestamp: new Date().toISOString()
        },
        error: error?.message
      }
    } catch (error) {
      return {
        success: false,
        responseTime: Date.now() - startTime,
        error: error.message
      }
    }
  },

  async checkAuthState(): Promise<AuthDebugInfo> {
    const session = await supabase.auth.getSession()
    const user = await supabase.auth.getUser()
    
    return {
      hasValidSession: !!session.data.session,
      sessionExpiry: session.data.session?.expires_at,
      userEmail: user.data.user?.email,
      lastSignIn: user.data.user?.last_sign_in_at,
      authProvider: user.data.user?.app_metadata?.provider,
      debugTimestamp: new Date().toISOString()
    }
  },

  // Logging avanzato per produzione
  logAuthEvent(event: string, details: any) {
    if (import.meta.env.PROD) {
      // Invia a servizio logging esterno
      console.log(`[AUTH-${event}]`, {
        timestamp: new Date().toISOString(),
        event,
        details: JSON.stringify(details),
        userAgent: navigator.userAgent,
        url: window.location.href
      })
    }
  }
}
```

### 2. Sentry Configuration

```typescript
// src/lib/sentry.ts
import * as Sentry from '@sentry/react'
import { BrowserTracing } from '@sentry/tracing'

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.NODE_ENV,
  integrations: [
    new BrowserTracing(),
  ],
  tracesSampleRate: 0.1,
  beforeSend(event) {
    // Filter out non-critical errors
    if (event.exception) {
      const error = event.exception.values?.[0]
      if (error?.type === 'ChunkLoadError') {
        return null // Ignore chunk load errors
      }
    }
    return event
  },
})
```

### 2. Analytics Setup

```typescript
// src/lib/analytics.ts
import { gtag } from 'ga-gtag'

export const analytics = {
  init() {
    if (import.meta.env.VITE_GA_TRACKING_ID) {
      gtag('config', import.meta.env.VITE_GA_TRACKING_ID, {
        page_title: document.title,
        page_location: window.location.href,
      })
    }
  },
  
  trackEvent(action: string, category: string, label?: string) {
    gtag('event', action, {
      event_category: category,
      event_label: label,
    })
  },
  
  trackPageView(path: string) {
    gtag('config', import.meta.env.VITE_GA_TRACKING_ID, {
      page_path: path,
    })
  },
}
```

### 3. Health Checks

```typescript
// src/lib/health.ts
export const healthCheck = {
  async database() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1)
      return !error
    } catch {
      return false
    }
  },
  
  async stripe() {
    try {
      // Test Stripe connection
      return true
    } catch {
      return false
    }
  },
  
  async overall() {
    const checks = await Promise.all([
      this.database(),
      this.stripe(),
    ])
    return checks.every(Boolean)
  },
}
```

### 4. Script di Utilità per Produzione

```bash
# scripts/check-auth-status.cjs - Verifica stato autenticazione
node scripts/check-auth-status.cjs

# scripts/check-all-users.cjs - Audit completo utenti
node scripts/check-all-users.cjs

# scripts/fix-patrick-user.cjs - Fix specifici utenti
node scripts/fix-patrick-user.cjs

# Esempio output script di debug:
# ✅ Connessione Supabase: OK
# ✅ Database accessibile: OK  
# ✅ Tabelle sincronizzate: OK
# ⚠️  Utenti con profili mancanti: 2
# 📊 Statistiche: 45 utenti totali, 43 profili completi
```

### 5. Configurazione Variabili Debug

```env
# Variabili per debug in produzione
VITE_DEBUG_MODE=false
VITE_AUTH_DEBUG=false
VITE_ENABLE_LOGGING=true
VITE_LOG_LEVEL=error

# Timeout configurations
VITE_AUTH_TIMEOUT=30000
VITE_API_TIMEOUT=15000
VITE_RETRY_ATTEMPTS=3

# Performance monitoring
VITE_PERFORMANCE_MONITORING=true
VITE_ERROR_REPORTING=true
```

## 🔒 Sicurezza

### 1. Environment Security

```bash
# Secrets management
# Non committare mai file .env in produzione
# Usa secret managers (Vercel Secrets, AWS Secrets Manager, etc.)

# Rotazione chiavi regolare
# - Supabase keys ogni 90 giorni
# - Stripe keys ogni 180 giorni
# - JWT secrets ogni 30 giorni
```

### 2. Content Security Policy

```html
<!-- index.html -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://js.stripe.com https://www.googletagmanager.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https:;
  connect-src 'self' https://*.supabase.co https://api.stripe.com;
  frame-src https://js.stripe.com;
">
```

### 3. Rate Limiting

```typescript
// Implementazione rate limiting
const rateLimiter = new Map()

export function rateLimit(ip: string, limit = 100, window = 900000) {
  const now = Date.now()
  const userRequests = rateLimiter.get(ip) || []
  
  // Remove old requests
  const validRequests = userRequests.filter(
    (timestamp: number) => now - timestamp < window
  )
  
  if (validRequests.length >= limit) {
    throw new Error('Rate limit exceeded')
  }
  
  validRequests.push(now)
  rateLimiter.set(ip, validRequests)
}
```

## 💾 Backup e Recovery

### 1. Database Backup

```bash
# Backup automatico Supabase (Pro plan)
# - Backup point-in-time ogni 2 ore
# - Retention 7 giorni (Pro) / 30 giorni (Team)

# Backup manuale
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup con compressione
pg_dump $DATABASE_URL | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### 2. File Backup

```bash
# Backup Supabase Storage
# Script per backup files
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/storage_$DATE"

# Download all files from Supabase Storage
supabase storage download --recursive --bucket bookings-files $BACKUP_DIR

# Compress
tar -czf "storage_backup_$DATE.tar.gz" $BACKUP_DIR
```

### 3. Recovery Plan

```markdown
## Disaster Recovery Plan

### RTO (Recovery Time Objective): 4 ore
### RPO (Recovery Point Objective): 2 ore

### Steps:
1. Assess damage and impact
2. Activate backup systems
3. Restore database from latest backup
4. Restore file storage
5. Update DNS if needed
6. Verify all systems
7. Communicate with users
```

## 🔄 CI/CD Pipeline

### 1. GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run build
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### 2. Quality Gates

```json
// package.json scripts
{
  "scripts": {
    "pre-deploy": "npm run lint && npm run type-check && npm run test && npm run build",
    "deploy:staging": "npm run pre-deploy && vercel",
    "deploy:production": "npm run pre-deploy && vercel --prod"
  }
}
```

## 🚨 Troubleshooting

### Problemi Comuni

#### Build Failures
```bash
# Clear cache
npm run clean
rm -rf node_modules package-lock.json
npm install

# Check dependencies
npm audit
npm update
```

#### Performance Issues
```bash
# Analyze bundle
npm run build -- --analyze

# Check lighthouse score
lighthouse https://your-domain.com --output html
```

#### Database Connection Issues
```sql
-- Check connections
SELECT count(*) FROM pg_stat_activity;

-- Check slow queries
SELECT query, mean_exec_time 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

### Monitoring Alerts

```yaml
# alerts.yml
alerts:
  - name: High Error Rate
    condition: error_rate > 5%
    action: notify_team
    
  - name: Slow Response Time
    condition: avg_response_time > 2s
    action: scale_up
    
  - name: Database Connection Pool
    condition: db_connections > 80%
    action: alert_dba
```

## 📞 Supporto

### Contatti Emergenza
- **DevOps**: devops@bookinghse.com
- **Database**: dba@bookinghse.com
- **Security**: security@bookinghse.com

### Risorse
- [Vercel Status](https://vercel-status.com/)
- [Supabase Status](https://status.supabase.com/)
- [Stripe Status](https://status.stripe.com/)

---

**🎯 Checklist Pre-Deploy**
- [ ] Variabili ambiente configurate
- [ ] Database migrato e testato
- [ ] SSL certificati configurati
- [ ] Monitoring attivo
- [ ] Backup configurati
- [ ] DNS configurato
- [ ] CDN configurato
- [ ] Security headers attivi
- [ ] Rate limiting attivo
- [ ] Health checks funzionanti