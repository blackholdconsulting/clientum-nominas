# Guía de Despliegue - Clientum Nóminas

Instrucciones detalladas para el despliegue en diferentes entornos de producción.

## 🚀 Despliegue en Vercel (Recomendado)

### Requisitos Previos
- Cuenta en [Vercel](https://vercel.com)
- Repositorio en GitHub/GitLab/Bitbucket
- Node.js 18+ instalado localmente

### Despliegue Automático
1. **Conectar repositorio**:
   \`\`\`bash
   # Instalar Vercel CLI
   npm install -g vercel
   
   # Iniciar sesión
   vercel login
   
   # Desplegar desde el directorio del proyecto
   vercel --prod
   \`\`\`

2. **Configurar variables de entorno** en Vercel Dashboard:
   \`\`\`env
   NEXT_PUBLIC_APP_URL=https://tu-dominio.vercel.app
   DATABASE_URL=postgresql://...
   SMTP_HOST=smtp.gmail.com
   SMTP_USER=tu-email@gmail.com
   SMTP_PASS=tu-contraseña-app
   \`\`\`

3. **Configurar dominio personalizado** (opcional):
   - Ir a Project Settings → Domains
   - Añadir dominio personalizado
   - Configurar DNS según instrucciones

### Configuración Avanzada
\`\`\`json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}
\`\`\`

## 🐳 Despliegue con Docker

### Dockerfile
\`\`\`dockerfile
FROM node:18-alpine AS base

# Instalar dependencias solo cuando sea necesario
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Instalar dependencias basándose en el gestor de paquetes preferido
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Reconstruir el código fuente solo cuando sea necesario
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Deshabilitar telemetría durante la construcción
ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Imagen de producción, copiar todos los archivos y ejecutar next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Aprovechar las salidas de trazas para reducir el tamaño de la imagen
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
\`\`\`

### Docker Compose
\`\`\`yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/clientum_nominas
      - NEXT_PUBLIC_APP_URL=http://localhost:3000
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=clientum_nominas
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
\`\`\`

### Comandos de Despliegue
\`\`\`bash
# Construir y ejecutar
docker-compose up -d --build

# Ver logs
docker-compose logs -f app

# Parar servicios
docker-compose down

# Actualizar aplicación
docker-compose pull
docker-compose up -d --build
\`\`\`

## ☁️ Despliegue en AWS

### Usando AWS Amplify
1. **Conectar repositorio** en AWS Amplify Console
2. **Configurar build settings**:
   \`\`\`yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   \`\`\`

3. **Variables de entorno** en Amplify Console
4. **Configurar dominio** personalizado

### Usando EC2 + RDS
\`\`\`bash
# Instalar Node.js en EC2
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PM2 para gestión de procesos
sudo npm install -g pm2

# Clonar y configurar aplicación
git clone https://github.com/tu-usuario/clientum-nominas.git
cd clientum-nominas
npm install
npm run build

# Configurar PM2
pm2 start npm --name "clientum-nominas" -- start
pm2 startup
pm2 save
\`\`\`

## 🌐 Configuración de Nginx

### nginx.conf
\`\`\`nginx
upstream nextjs_upstream {
  server app:3000;
}

server {
  listen 80;
  server_name tu-dominio.com www.tu-dominio.com;
  return 301 https://$server_name$request_uri;
}

server {
  listen 443 ssl http2;
  server_name tu-dominio.com www.tu-dominio.com;

  ssl_certificate /etc/nginx/ssl/cert.pem;
  ssl_certificate_key /etc/nginx/ssl/key.pem;
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
  ssl_prefer_server_ciphers off;

  # Seguridad
  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header X-XSS-Protection "1; mode=block" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header Referrer-Policy "no-referrer-when-downgrade" always;
  add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

  # Compresión
  gzip on;
  gzip_vary on;
  gzip_min_length 1024;
  gzip_proxied expired no-cache no-store private must-revalidate auth;
  gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss;

  location / {
    proxy_pass http://nextjs_upstream;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
  }

  # Archivos estáticos
  location /_next/static {
    proxy_cache STATIC;
    proxy_pass http://nextjs_upstream;
    add_header Cache-Control "public, max-age=31536000, immutable";
  }

  location /static {
    proxy_cache STATIC;
    proxy_ignore_headers Cache-Control;
    proxy_cache_valid 60m;
    proxy_pass http://nextjs_upstream;
    add_header Cache-Control "public, max-age=31536000, immutable";
  }
}
\`\`\`

## 🗄️ Configuración de Base de Datos

### PostgreSQL en Producción
\`\`\`sql
-- Crear base de datos
CREATE DATABASE clientum_nominas;
CREATE USER clientum_user WITH ENCRYPTED PASSWORD 'tu_password_seguro';
GRANT ALL PRIVILEGES ON DATABASE clientum_nominas TO clientum_user;

-- Configurar conexiones
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET work_mem = '4MB';
SELECT pg_reload_conf();
\`\`\`

### Backup Automático
\`\`\`bash
#!/bin/bash
# backup.sh
BACKUP_DIR="/backups"
DB_NAME="clientum_nominas"
DATE=$(date +%Y%m%d_%H%M%S)

# Crear backup
pg_dump -h localhost -U clientum_user $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# Mantener solo los últimos 7 días
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete

# Comprimir backup
gzip $BACKUP_DIR/backup_$DATE.sql
\`\`\`

### Cron para Backups
\`\`\`bash
# Editar crontab
crontab -e

# Añadir línea para backup diario a las 2:00 AM
0 2 * * * /path/to/backup.sh
\`\`\`

## 📊 Monitorización

### Health Check Endpoint
\`\`\`typescript
// app/api/health/route.ts
export async function GET() {
  try {
    // Verificar conexión a base de datos
    // Verificar servicios externos
    
    return Response.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version
    });
  } catch (error) {
    return Response.json({
      status: 'unhealthy',
      error: error.message
    }, { status: 500 });
  }
}
\`\`\`

### Configuración de Logs
\`\`\`javascript
// next.config.mjs
const nextConfig = {
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  experimental: {
    instrumentationHook: true,
  },
};
\`\`\`

## 🔒 Seguridad en Producción

### Variables de Entorno Seguras
\`\`\`bash
# Generar secretos seguros
openssl rand -base64 32  # Para JWT_SECRET
openssl rand -base64 32  # Para SESSION_SECRET
\`\`\`

### Configuración de Firewall
\`\`\`bash
# UFW (Ubuntu)
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# Fail2ban para protección contra ataques
sudo apt install fail2ban
\`\`\`

### SSL/TLS con Let's Encrypt
\`\`\`bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com

# Renovación automática
sudo crontab -e
# Añadir: 0 12 * * * /usr/bin/certbot renew --quiet
\`\`\`

## 📈 Optimización de Rendimiento

### Configuración de Cache
\`\`\`javascript
// next.config.mjs
const nextConfig = {
  images: {
    domains: ['tu-dominio.com'],
    formats: ['image/webp', 'image/avif'],
  },
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
};
\`\`\`

### CDN Configuration
\`\`\`javascript
// Para archivos estáticos
const nextConfig = {
  assetPrefix: process.env.NODE_ENV === 'production' 
    ? 'https://cdn.tu-dominio.com' 
    : '',
};
\`\`\`

---

**Nota**: Adapta estas configuraciones según tus necesidades específicas y entorno de despliegue.
