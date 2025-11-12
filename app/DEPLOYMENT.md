# Deployment Guide

## Quick Start (Local Development)

### Prerequisites
- Node.js 20+
- npm

### Steps

1. **Navigate to the app directory:**
   ```bash
   cd app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start Convex development server:**
   ```bash
   npx convex dev
   ```

   This will:
   - Prompt you to log in to Convex (or create a free account)
   - Create a development deployment
   - Generate `.env.local` with `NEXT_PUBLIC_CONVEX_URL`
   - Watch for schema and function changes

   **Keep this terminal running!**

4. **In a new terminal, seed the database:**
   ```bash
   npm run seed
   ```

5. **Start the Next.js development server:**
   ```bash
   npm run dev
   ```

   Or use the combined command:
   ```bash
   npm run dev  # Runs both Convex and Next.js concurrently
   ```

6. **Open your browser:**
   ```
   http://localhost:3000
   ```

## Testing the Acceptance Checklist

### 1. Create a Seller Account
- Visit http://localhost:3000/start
- Fill in:
  - Handle: `testuser`
  - Niches: `SaaS, Consulting`
  - Bio: (optional)
- Submit and **copy your adminKey**

### 2. Update Profile
- Visit http://localhost:3000/me
- Your adminKey should be pre-filled (in DEV_MODE)
- Update niches, bio, or email
- Submit to verify it works

### 3. Complete Lessons
- Visit http://localhost:3000/lessons
- Click "Complete" on each of the 5 lessons
- After completing all, click "Check Certification Status"
- You should see a success message and `certified: true`

### 4. Verify Directory Listing
- Visit http://localhost:3000/dir
- You should see your certified seller profile
- It should show your handle, niches, and bio

### 5. Browse and Click Opportunities
- Visit http://localhost:3000/opps
- Enter your handle in the form
- Click "View Opportunity →" on several listings
- These clicks will be tracked

### 6. Check Leaderboard
- Visit http://localhost:3000/leaderboard
- You should see your seller with:
  - 5 lessons completed (50 points)
  - N opportunity clicks (N points)
  - Total points = 50 + N
  - Certified badge ✓

### 7. Page Reloads
- Reload any page
- Everything should still work
- adminKey should persist in localStorage (DEV_MODE)

## Production Deployment

### Vercel Deployment

1. **Push to GitHub:**
   ```bash
   git push origin main
   ```

2. **Deploy Convex to production:**
   ```bash
   npx convex deploy
   ```

   This creates a production deployment and gives you a URL.

3. **Import to Vercel:**
   - Go to vercel.com
   - Import your repository
   - Set environment variables:
     ```
     NEXT_PUBLIC_DEV_MODE=false
     NEXT_PUBLIC_CONVEX_URL=<your-production-convex-url>
     ```

4. **Deploy!**
   - Vercel will build and deploy automatically
   - Your app will be live at `your-app.vercel.app`

5. **Seed production database:**
   ```bash
   CONVEX_URL=<production-url> npm run seed
   ```

### Environment Variables Reference

**Development (.env.local):**
```env
NEXT_PUBLIC_DEV_MODE=true
NEXT_PUBLIC_CONVEX_URL=https://your-dev.convex.cloud
```

**Production (Vercel):**
```env
NEXT_PUBLIC_DEV_MODE=false
NEXT_PUBLIC_CONVEX_URL=https://your-prod.convex.cloud
```

## Troubleshooting

### "Cannot find module '@/convex/_generated/api'"
**Fix:** Run `npx convex dev` first. It generates the API types.

### "CONVEX_URL not found" error in seed script
**Fix:** Make sure `npx convex dev` is running and created `.env.local`.

### No data showing up
**Fix:** Run `npm run seed` to populate lessons and opportunities.

### Admin key not working
**Fix:**
1. Make sure you copied the full key (starts with `sk_`)
2. Check that the key matches what was generated
3. In DEV_MODE, check localStorage in browser DevTools

### Build errors
**Fix:** Make sure all dependencies are installed:
```bash
rm -rf node_modules package-lock.json
npm install
```

## Development Tips

### Running Both Servers
Use the combined command:
```bash
npm run dev
```
This runs Convex and Next.js concurrently.

### Viewing Database
Open the Convex dashboard:
```bash
npx convex dashboard
```

### Clearing Database
Delete all data:
```bash
npx convex run reset  # (you'll need to create this function)
```

Or manually through the Convex dashboard.

### Adding More Seed Data
Edit `scripts/fixtures/*.json` and run:
```bash
npm run seed
```

## Next Steps

After validating the MVP:

1. **Implement Real Scrapers**
   - Edit `scripts/devScrape.ts`
   - Add LinkedIn Jobs API
   - Add Indeed scraper
   - Schedule with cron

2. **Add Authentication** (optional)
   - Replace adminKey with proper auth
   - Consider Clerk or Auth0
   - Add user sessions

3. **Enhance UI**
   - Add shadcn/ui components
   - Improve responsive design
   - Add loading states

4. **Add Analytics**
   - Track user behavior
   - Monitor conversion rates
   - A/B test features

5. **Deploy to Production**
   - Follow the Vercel deployment steps above
   - Set up custom domain
   - Configure SSL

## Support

For issues or questions:
- Check the main README.md
- Review Convex docs: https://docs.convex.dev
- Review Next.js docs: https://nextjs.org/docs
