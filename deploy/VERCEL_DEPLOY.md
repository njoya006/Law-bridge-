# LawBridge — Vercel Frontend Deployment

## 1. Push code to GitHub

See `deploy/GIT_PUSH.md`.

## 2. Import project in Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. **Root Directory**: `lawbridge-frontend`
4. Framework: Next.js (auto-detected)
5. Build command: `npm run build`
6. Output: default

## 3. Environment variables

Copy from `lawbridge-frontend/.env.production.example`.

**Critical:** `API_GATEWAY_URL` must be your AWS EC2 public IP or API domain **before** first deploy.

```
API_GATEWAY_URL=http://YOUR_EC2_PUBLIC_IP
```

All `NEXT_PUBLIC_*` URLs should use **relative paths** (`/api/v1/...`) so the browser calls Vercel HTTPS, and Vercel rewrites proxy to AWS.

## 4. Deploy

Click Deploy. Build should pass if `npm run build` works locally.

## 5. Test

1. Open your Vercel URL
2. Register / login
3. Check browser Network tab — API calls should go to `your-app.vercel.app/api/v1/...`

## How rewrites work

`lawbridge-frontend/next.config.js` proxies:

```
your-app.vercel.app/api/v1/auth/login/
  → http://EC2_IP/api/v1/auth/login/
```

This avoids mixed-content (HTTPS → HTTP) and CORS issues.

## Custom domain (optional)

1. Vercel → Project → Domains → add `app.yourdomain.com`
2. Update DNS per Vercel instructions
