# Deployment Guide

## Overview
This guide covers deploying the SadFrogTech platform to various environments, from development to production.

## 🚀 Quick Start Deployment

### Prerequisites
- Node.js 18+ installed
- pnpm package manager
- Git access to the repository
- Database (NeonDB recommended)

### 1. Clone and Setup
```bash
git clone <your-repo-url>
cd sadfrogtech
pnpm install
```

### 2. Environment Configuration
```bash
cp env_template .env.local
# Edit .env.local with your configuration
```

### 3. Build and Start
```bash
pnpm build
pnpm start
```

## 🌐 Production Deployment Options

### Option 1: Vercel (Recommended)

#### Setup
1. **Connect Repository**
   - Go to [Vercel](https://vercel.com)
   - Import your GitHub repository
   - Select the repository

2. **Configure Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add all required environment variables from `env_template`

3. **Deploy**
   - Vercel will automatically deploy on push to main branch
   - Custom domain can be configured in settings

#### Vercel Configuration
```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": ".next",
  "installCommand": "pnpm install",
  "framework": "nextjs"
}
```

### Option 2: Docker Deployment

#### Dockerfile
```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json pnpm-lock.yaml* ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED 1

RUN pnpm build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### Docker Compose
```yaml
version: '3.8'
services:
  sadfrogtech:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - ADMIN_SESSION_SECRET=${ADMIN_SESSION_SECRET}
      - LTC_RPC_USER=${LTC_RPC_USER}
      - LTC_RPC_PASS=${LTC_RPC_PASS}
      - LTC_RPC_HOST=${LTC_RPC_HOST}
      - LTC_RPC_PORT=${LTC_RPC_PORT}
      - LTC_RPC_WALLET=${LTC_RPC_WALLET}
      - ADMIN_LTC_ADDRESS=${ADMIN_LTC_ADDRESS}
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs
```

### Option 3: Manual Server Deployment

#### Server Requirements
- Ubuntu 20.04+ or CentOS 8+
- Node.js 18+
- PM2 for process management
- Nginx for reverse proxy (optional)

#### Setup Steps
1. **Install Dependencies**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g pnpm pm2
```

2. **Deploy Application**
```bash
git clone <your-repo-url> /var/www/sadfrogtech
cd /var/www/sadfrogtech
pnpm install
pnpm build
```

3. **Configure PM2**
```bash
pm2 start npm --name "sadfrogtech" -- start
pm2 save
pm2 startup
```

4. **Nginx Configuration** (Optional)
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔧 Environment-Specific Configurations

### Development
```env
NODE_ENV=development
NEXT_PUBLIC_TESTNET=true
```

### Staging
```env
NODE_ENV=production
NEXT_PUBLIC_TESTNET=true
DATABASE_URL=staging_db_url
```

### Production
```env
NODE_ENV=production
NEXT_PUBLIC_TESTNET=false
DATABASE_URL=production_db_url
```

## 📊 Monitoring and Logging

### PM2 Monitoring
```bash
pm2 monit
pm2 logs sadfrogtech
pm2 status
```

### Application Logs
- Application logs are written to console
- Use PM2 log management for production
- Consider external logging services (DataDog, LogRocket)

### Health Checks
- Application health: `GET /api/admin/system-status`
- Database health: Check database connectivity
- Litecoin node health: Check RPC connectivity

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install pnpm
      uses: pnpm/action-setup@v2
      with:
        version: 8
        
    - name: Install dependencies
      run: pnpm install
      
    - name: Build application
      run: pnpm build
      env:
        DATABASE_URL: ${{ secrets.DATABASE_URL }}
        
    - name: Deploy to server
      run: |
        # Add your deployment commands here
        echo "Deploying to production..."
```

## 🚨 Troubleshooting

### Common Issues

#### Build Failures
- Check Node.js version (requires 18+)
- Clear `.next` directory: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && pnpm install`

#### Database Connection Issues
- Verify `DATABASE_URL` format
- Check database accessibility
- Ensure SSL configuration is correct

#### Litecoin Node Issues
- Verify RPC credentials
- Check node accessibility
- Ensure wallet is loaded

#### Memory Issues
- Increase Node.js memory limit: `NODE_OPTIONS="--max-old-space-size=4096"`
- Monitor memory usage with PM2
- Consider upgrading server resources

### Performance Optimization

#### Production Optimizations
- Enable Next.js compression
- Use CDN for static assets
- Implement caching strategies
- Monitor and optimize database queries

#### Scaling Considerations
- Use load balancers for multiple instances
- Implement database connection pooling
- Consider microservices architecture for large scale

## 📞 Support

For deployment issues:
- Check the troubleshooting section
- Review application logs
- Create GitHub issues with deployment details
- Contact maintainers for critical issues
