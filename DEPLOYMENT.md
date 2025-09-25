# Deployment Guide

This guide explains how to deploy the Educational Game Platform using Docker and Dockploy.

## 🐳 Docker Setup

The project includes a multi-stage Dockerfile optimized for production deployment.

### Files Created

- `Dockerfile` - Multi-stage Docker build configuration
- `docker-compose.yml` - Local development/testing setup
- `.dockerignore` - Excludes unnecessary files from Docker build
- `.env.example` - Template for environment variables
- `app/api/health/route.ts` - Health check endpoint

## 🔧 Environment Variables

### Required Environment Variables for Production

Copy `.env.example` to `.env` and configure the following:

#### Convex Configuration
```
CONVEX_DEPLOYMENT=prod:your-deployment-name
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

#### Email Configuration (Resend)
```
RESEND_API_KEY=re_your_api_key
FROM_EMAIL=noreply@yourdomain.com
```

#### App Configuration
```
NEXT_PUBLIC_APP_DOMAIN=https://yourdomain.com
SITE_URL=https://yourdomain.com
```

#### JWT Configuration
```
JWT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----"
JWKS={"keys":[{"use":"sig","kty":"RSA","n":"YOUR_PUBLIC_KEY","e":"AQAB"}]}
```

#### Setup Flag
```
SETUP_SCRIPT_RAN=1
```

### 🔐 Generating JWT Keys

For production, generate new JWT keys:

```bash
# Generate private key
openssl genrsa -out private.pem 2048

# Extract public key
openssl rsa -in private.pem -pubout -out public.pem

# Convert to JWKS format (you'll need to manually format this)
openssl rsa -in private.pem -pubout -outform DER | base64 -w0
```

## 🚀 Dockploy Deployment

### Step 1: Prepare Your Repository

1. Push your code to GitHub/GitLab
2. Ensure all Docker files are committed
3. Set up your production Convex deployment

### Step 2: Configure Dockploy

1. **Create New Application** in Dockploy
2. **Connect Repository**: Link your Git repository
3. **Configure Environment Variables**: Add all required env vars from above
4. **Set Build Configuration**:
   - Build Context: `/`
   - Dockerfile: `Dockerfile`
   - Port: `3000`

### Step 3: Environment Variable Setup in Dockploy

Add these environment variables in Dockploy:

```
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
CONVEX_DEPLOYMENT=prod:your-deployment
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
RESEND_API_KEY=your_resend_key
FROM_EMAIL=noreply@yourdomain.com
NEXT_PUBLIC_APP_DOMAIN=https://yourdomain.com
SITE_URL=https://yourdomain.com
JWT_PRIVATE_KEY="your_private_key"
JWKS={"keys":[...]}
SETUP_SCRIPT_RAN=1
```

### Step 4: Deploy

1. Click **Deploy** in Dockploy
2. Monitor build logs
3. Once deployed, check health endpoint: `https://yourdomain.com/api/health`

## 🔄 Local Docker Testing

Test your Docker setup locally:

```bash
# Build the image
docker build -t game-platform .

# Run with environment variables
docker run -p 3000:3000 --env-file .env game-platform

# Or use docker-compose
docker-compose up
```

## 📊 Health Checks

The application includes a health check endpoint at `/api/health` that returns:

```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "environment": "production",
  "version": "1.0.0"
}
```

## 🔧 Pre-deployment Checklist

- [ ] Convex production deployment is set up
- [ ] All environment variables are configured
- [ ] JWT keys are generated for production
- [ ] Domain DNS is pointing to your server
- [ ] Email service (Resend) is configured
- [ ] SSL certificate is set up
- [ ] Health check endpoint responds correctly

## 🐛 Troubleshooting

### Build Issues
- Check that all dependencies are in `package.json`
- Verify Node.js version compatibility
- Ensure Docker has enough memory allocated

### Runtime Issues
- Check environment variables are set correctly
- Verify Convex deployment URL is accessible
- Check application logs in Dockploy
- Test health endpoint: `/api/health`

### Database/Convex Issues
- Ensure Convex production deployment is active
- Verify API keys and deployment URL
- Check Convex dashboard for errors

## 📝 Notes

- The Docker image uses Node.js 18 Alpine for smaller size
- Standalone output is enabled for optimal Docker performance
- Non-root user (nextjs) is used for security
- Health checks are configured for container orchestration
- All sensitive data should be in environment variables, never in code

## 🔄 Updates

To update the deployment:
1. Push changes to your repository
2. Trigger a new build in Dockploy
3. Monitor deployment progress
4. Verify health check passes