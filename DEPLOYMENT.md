# MADPC - Vercel Deployment Guide

This guide will help you deploy the Manso Adubia District Police Command System to Vercel.

## Prerequisites

- Node.js 18+ installed locally
- A Vercel account (free tier available)
- A Supabase project set up
- Git repository (GitHub, GitLab, or Bitbucket)

## Environment Variables

Before deploying, you need to set up the following environment variables in Vercel:

### Required Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_NAME="Manso Adubia District Police Command"
NEXT_PUBLIC_APP_VERSION="1.0.0"
```

### Optional Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Deployment Steps

### 1. Prepare Your Repository

1. Ensure your code is committed to a Git repository
2. Push your latest changes to the main branch

### 2. Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your Git repository
4. Select the repository containing your MADPC project

### 3. Configure Project Settings

1. **Framework Preset**: Next.js (should be auto-detected)
2. **Root Directory**: Leave as default (.)
3. **Build Command**: `npm run build` (should be auto-detected)
4. **Output Directory**: `.next` (should be auto-detected)
5. **Install Command**: `npm install` (should be auto-detected)

### 4. Set Environment Variables

1. In the Vercel dashboard, go to your project settings
2. Navigate to "Environment Variables"
3. Add each environment variable from the list above
4. Set the environment to "Production, Preview, and Development"

### 5. Deploy

1. Click "Deploy" to start the deployment process
2. Wait for the build to complete (usually 2-5 minutes)
3. Once deployed, you'll receive a URL for your application

## Post-Deployment Configuration

### Domain Setup (Optional)

1. In Vercel dashboard, go to your project
2. Navigate to "Settings" > "Domains"
3. Add your custom domain if you have one

### Performance Monitoring

1. Monitor your application using Vercel Analytics
2. Check the "Functions" tab for any serverless function issues
3. Review build logs if there are any deployment issues

## Supabase Configuration

Ensure your Supabase project is properly configured:

1. **Database Tables**: Make sure all required tables are created
2. **Row Level Security (RLS)**: Configure appropriate policies
3. **Authentication**: Set up authentication providers if needed
4. **API Keys**: Ensure the anon key has appropriate permissions

## Troubleshooting

### Common Issues

1. **Build Failures**: Check the build logs in Vercel dashboard
2. **Environment Variables**: Ensure all required variables are set
3. **Supabase Connection**: Verify your Supabase URL and keys
4. **Image Optimization**: Images are automatically optimized by Vercel

### Build Optimization

The project is configured with:
- Dynamic imports for client-side components
- Optimized bundle splitting
- Image optimization
- Static generation where possible

### Support

If you encounter issues:
1. Check Vercel build logs
2. Verify environment variables
3. Test locally with `npm run build`
4. Check Supabase connection and permissions

## Security Considerations

- Never commit `.env.local` to version control
- Use environment variables for all sensitive data
- Regularly rotate API keys
- Monitor access logs in Supabase dashboard

## Performance Tips

- The app uses dynamic imports to reduce initial bundle size
- Images are optimized automatically by Vercel
- Static pages are pre-rendered for better performance
- Consider enabling Vercel Analytics for monitoring

## Maintenance

- Regularly update dependencies
- Monitor Vercel function usage
- Check Supabase usage and limits
- Review security policies periodically
